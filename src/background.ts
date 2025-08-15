import {
	DictionaryItem,
	Events,
	SygnalDataEventCategoryParameter,
	PLUGIN_ENABLED_KEY,
} from "./types";
import { TrackerDetector, TrackerDetectionContext, isGTMEvent } from "./trackerConfig";
import { RateLimiter, PerformanceMonitor, ErrorHandler, AuditLogger } from "./utils";

console.info("EventRICH.AI Background loaded.");

// Plugin state tracking
let isPluginEnabled = true;

// Load initial plugin state
chrome.storage.local.get([PLUGIN_ENABLED_KEY], (result) => {
	isPluginEnabled = result[PLUGIN_ENABLED_KEY] !== false; // Default to true
	console.info(`EventRICH.AI Plugin ${isPluginEnabled ? 'enabled' : 'disabled'}`);
});

// Listen for plugin state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "updatePluginState") {
		isPluginEnabled = message.enabled;
		console.info(`EventRICH.AI Plugin ${isPluginEnabled ? 'enabled' : 'disabled'}`);
	}
});

// Request deduplication cache
const requestCache = new Map<string, { timestamp: number; response: any }>();
const CACHE_DURATION = 5000; // 5 seconds

// Rate limiting configuration (increased for high-traffic sites)
const RATE_LIMIT_CONFIG = {
	maxRequests: 10000, // Much higher limit for modern websites
	windowMs: 60000, // 1 minute
	globalKey: 'global_requests'
};

interface ChromeAction {
	action: {
		setBadgeText: (data: { text: string }) => string;
		setBadgeBackgroundColor: (data: { color: string }) => void;
	};
}

// Helper functions for tab-specific storage
const getTabKey = (eventType: string, tabId: number) => `${eventType}_tab_${tabId}`;

const getTabData = async (eventType: string, tabId: number): Promise<any[]> => {
	return new Promise((resolve) => {
		const key = getTabKey(eventType, tabId);
		chrome.storage.local.get([key], (result) => {
			resolve(result[key] || []);
		});
	});
};

const setTabData = async (eventType: string, tabId: number, data: any[]): Promise<void> => {
	return new Promise((resolve) => {
		const key = getTabKey(eventType, tabId);
		chrome.storage.local.set({ [key]: data }, resolve);
	});
};

const getCurrentTabId = async (): Promise<number | null> => {
	return new Promise((resolve) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			resolve(tabs[0]?.id || null);
		});
	});
};

const updateBadge = async () => {
	const currentTabId = await getCurrentTabId();
	if (!currentTabId) return;

	// Get all events for the current tab
	const pixelEvents = await getTabData(Events.PIXEL_EVENTS, currentTabId);
	const googleAnalyticsEvents = await getTabData(Events.GOOGLE_ANALYTICS_EVENTS, currentTabId);
	const googleAdsEvents = await getTabData(Events.GOOGLE_ADS_EVENTS, currentTabId);
	const metaEvents = await getTabData(Events.META_EVENTS, currentTabId);
	const tikTokEvents = await getTabData(Events.TIKTOK_EVENTS, currentTabId);
	const otherTrackersEvents = await getTabData(Events.OTHER_TRACKERS_EVENTS, currentTabId);
	const gtmEvents = await getTabData(Events.GOOGLE_TAG_MANAGER_EVENTS, currentTabId);

	// Count unique trackers (not events)
	let trackerCount = 0;
	if (pixelEvents.length > 0) trackerCount++;
	if (googleAnalyticsEvents.length > 0) trackerCount++;
	if (googleAdsEvents.length > 0) trackerCount++;
	if (metaEvents.length > 0) trackerCount++;
	if (tikTokEvents.length > 0) trackerCount++;
	if (otherTrackersEvents.length > 0) trackerCount++;
	if (gtmEvents.length > 0) trackerCount++;

	// Set the badge text with the count of trackers
	(chrome as unknown as ChromeAction).action.setBadgeText({
		text: trackerCount > 0 ? trackerCount.toString() : "",
	});

	// Optionally, set the badge background color to EventRich.AI blue
	(chrome as unknown as ChromeAction).action.setBadgeBackgroundColor({
		color: "#93C5FD", // Even lighter blue (#60A5FA was still too dark)
	});
};



// Request deduplication helper
const getCacheKey = (url: string, body?: string): string => {
	return `${url}:${body || ''}`;
};

const isDuplicateRequest = (key: string): boolean => {
	const cached = requestCache.get(key);
	if (!cached) return false;
	
	const now = Date.now();
	if (now - cached.timestamp > CACHE_DURATION) {
		requestCache.delete(key);
		return false;
	}
	
	return true;
};

const cacheRequest = (key: string, response: any): void => {
	// Clean old cache entries
	const now = Date.now();
	for (const [cacheKey, data] of requestCache.entries()) {
		if (now - data.timestamp > CACHE_DURATION) {
			requestCache.delete(cacheKey);
		}
	}
	
	// Add new entry
	requestCache.set(key, { timestamp: now, response });
	
	// Limit cache size
	if (requestCache.size > 1000) {
		const firstKey = requestCache.keys().next().value;
		requestCache.delete(firstKey);
	}
};

const init = async () => {
	// Initialize utilities
	await ErrorHandler.initializeFromStorage();
	await AuditLogger.initializeFromStorage();
	
	AuditLogger.log('background_script_initialized', {
		timestamp: new Date().toISOString(),
		version: chrome.runtime.getManifest().version
	});

	// Helper function to categorize parameters
	const categorizeParameters = (
		parameters: SygnalDataEventCategoryParameter[],
		dictionary: DictionaryItem[],
	) => {
		const categorizedParams = [];

		dictionary.forEach((category) => {
			const categoryParams = parameters
				.filter((param) =>
					category.items.some((item) => item.name === param.name),
				)
				.map((param) => {
					const item = category.items.find((item) => item.name === param.name);
					return {
						name: item?.value || param.name,
						value: param.value,
					};
				});

			if (categoryParams.length > 0) {
				categorizedParams.push({
					name: category.name,
					items: categoryParams,
				});
			}
		});

		// Add parameters that don't match any category as "others"
		const otherParams = parameters.filter(
			(param) =>
				!dictionary.some((category) =>
					category.items.some((item) => item.name === param.name),
				),
		);

		if (otherParams.length > 0) {
			categorizedParams.push({
				name: "Others",
				items: otherParams,
			});
		}

		return categorizedParams;
	};

	// Listen for web requests to detect tracking events
	chrome.webRequest.onBeforeRequest.addListener(
		(data) => {
			// Use an IIFE to handle async operations
			(async () => {
				try {
					// Check if plugin is enabled
					if (!isPluginEnabled) {
						return; // Skip tracking when plugin is disabled
					}

					// Rate limiting check
					if (!RateLimiter.isAllowed(RATE_LIMIT_CONFIG.globalKey, RATE_LIMIT_CONFIG.maxRequests, RATE_LIMIT_CONFIG.windowMs)) {
						console.warn('Rate limit exceeded for tracking detection');
						return;
					}

					// Request deduplication check
					const cacheKey = getCacheKey(data.url, 
						data.requestBody ? JSON.stringify(data.requestBody) : undefined
					);
					
					if (isDuplicateRequest(cacheKey)) {
						return; // Skip duplicate request
					}

					// Performance monitoring
					PerformanceMonitor.startMeasurement(`request_${data.requestId}`);
					
					const currentTabId = await getCurrentTabId();
					if (!currentTabId) {
						PerformanceMonitor.endMeasurement(`request_${data.requestId}`);
						return;
					}

				// Use the new TrackerDetector for streamlined detection
				let requestBody: string | undefined;
						if (data.requestBody && data.requestBody.raw) {
							const decoder = new TextDecoder("utf-8");
					requestBody = data.requestBody.raw[0]
								? decoder.decode(data.requestBody.raw[0].bytes)
						: undefined;
				}

				const context: TrackerDetectionContext = {
								url: data.url,
					method: data.method || 'GET',
					requestBody,
					currentTabId
				};

				// Special handling for GTM events in other tracker domains
				if (requestBody && context.url.includes("doubleclick.net") || context.url.includes("googlesyndication.com")) {
					try {
								const parsedBody = JSON.parse(requestBody);
						if (isGTMEvent(parsedBody)) {
							// Force GTM detection for this request
							context.url = "googletagmanager.com/gtm"; // Override URL pattern for GTM detection
						}
					} catch (error) {
						// Not JSON, continue with normal processing
					}
				}

				const wasProcessed = await TrackerDetector.processTracking(
					context,
					async (rule, extractedData) => {
						// Get existing events for this tracker type
						const existingEvents = await getTabData(rule.eventType, currentTabId);
						
						// Categorize parameters using the rule's dictionary
						const categorizedParams = categorizeParameters(
							extractedData.parameters,
							rule.dictionary,
						);

						// Special handling for EventRICH.AI /e/ endpoint
						if (rule.name === "EventRICH.AI" && data.url.includes("/e/")) {
							extractedData.eventName = "library_loaded";
						}

						// Create the new event
						const newEvent = {
							name: extractedData.eventName || getDefaultEventName(rule.name),
								parameters: categorizedParams,
							id: extractedData.trackerId || getDefaultTrackerId(rule.name, data.url),
								url: data.url,
							timestamp: new Date()
						};

						// Store the event
						await setTabData(rule.eventType, currentTabId, [
							...existingEvents,
							newEvent
						]);

						// Update badge
						await updateBadge();

						// ${rule.name} tracker detected
					}
				);

				// Helper function to get default event names
				function getDefaultEventName(trackerName: string): string {
					switch (trackerName) {
						case "Google Analytics": return "page_view";
						case "Google Tag Manager": return "gtm_event";
						case "Google Ads": return "conversion";
						case "Meta/Facebook": return "page_view";
						case "TikTok": return "page_view";
						case "Other Trackers": return "tracking_event";
						default: return "unknown_event";
					}
				}

				// Helper function to get default tracker IDs
				function getDefaultTrackerId(trackerName: string, url: string): string {
					switch (trackerName) {
						case "Google Analytics": return "tid";
						case "Google Tag Manager": return "gtm_id";
						case "Google Ads": return "conversion_id";
						case "Meta/Facebook": return "pixel_id";
						case "TikTok": return "pixel_code";
						case "Other Trackers": return new URL(url).hostname;
						default: return "tracker_id";
					}
				}
				
				// Cache successful processing
				cacheRequest(cacheKey, { processed: true, timestamp: Date.now() });

				// End performance monitoring
				const duration = PerformanceMonitor.endMeasurement(`request_${data.requestId}`);
				
				// Performance monitoring (no console spam)
				// Duration: ${duration}ms for ${data.url}

				} catch (error) {
					ErrorHandler.logError(error as Error, `Request processing failed for ${data.url}`);
					PerformanceMonitor.endMeasurement(`request_${data.requestId}`);
				}
			})();

			return undefined;
		},
		{ urls: ["<all_urls>"] },
		["requestBody"],
	);

	// Only reset data when a new page is loaded in the same tab, not when switching tabs
	chrome.webNavigation.onCommitted.addListener((details) => {
		if (details.frameId === 0) {
			(async () => {
				const currentTabId = await getCurrentTabId();
				if (!currentTabId) return;

				const urlObj = new URL(details.url);
				const currentUrl = urlObj.hostname;

				// Reset data for this specific tab
				await setTabData(Events.PIXEL_EVENTS, currentTabId, []);
				await setTabData(Events.GOOGLE_ANALYTICS_EVENTS, currentTabId, []);
				await setTabData(Events.GOOGLE_ADS_EVENTS, currentTabId, []);
				await setTabData(Events.META_EVENTS, currentTabId, []);
				await setTabData(Events.TIKTOK_EVENTS, currentTabId, []);
				await setTabData(Events.OTHER_TRACKERS_EVENTS, currentTabId, []);
				await setTabData(Events.GOOGLE_TAG_MANAGER_EVENTS, currentTabId, []);
				
				// Store currentUrl as a string, not an array
				chrome.storage.local.set({ [`currentUrl_tab_${currentTabId}`]: currentUrl });
				
				await updateBadge();
			})();
		}
	});

	// Don't reset data when switching tabs - just update the badge
	chrome.tabs.onActivated.addListener((activeInfo) => {
		(async () => {
			await updateBadge();
		})();
	});
};

// Initialize with error handling
init().catch(error => {
	console.error('Failed to initialize background script:', error);
	// Note: ErrorHandler might not be available if init failed
	try {
		ErrorHandler.logError(error, 'Background script initialization');
	} catch (e) {
		console.error('Failed to log error:', e);
	}
});
