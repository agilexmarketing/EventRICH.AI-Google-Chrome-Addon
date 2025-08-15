import {
	gaDictionary,
	gtmDictionary,
	metaDictionary,
	pixelDictionary,
	tiktokDictionary,
} from "./constants";
import {
	DictionaryItem,
	Events,
	SygnalDataEventCategoryParameter,
} from "./types";

import { RateLimiter, PerformanceMonitor, ErrorHandler, AuditLogger } from "./utils";

console.info("EventRICH.AI Background loaded.");

// Request deduplication cache
const requestCache = new Map<string, { timestamp: number; response: any }>();
const CACHE_DURATION = 5000; // 5 seconds

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
	maxRequests: 100,
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

interface FlattenedObject {
	[key: string]: string;
}

function flattenObjectFromTikTok(
	obj: Record<string, unknown>,
	parentKey = "",
	result: FlattenedObject = {},
): FlattenedObject {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			// Construct new key based on parent key
			const newKey = parentKey ? `${parentKey}_${key}` : key;

			if (typeof obj[key] === "object" && obj[key] !== null) {
				if (Array.isArray(obj[key])) {
					// Handle arrays by flattening each item
					obj[key].forEach((item, index) => {
						if (typeof item === "object" && item !== null) {
							flattenObjectFromTikTok(
								item as Record<string, unknown>,
								`${newKey}_${index}`,
								result,
							);
						} else {
							result[`${newKey}_${index}`] = `${item}`; // Ensure the value is a string
						}
					});
				} else {
					// Recursively flatten nested objects
					flattenObjectFromTikTok(
						obj[key] as Record<string, unknown>,
						newKey,
						result,
					);
				}
			} else {
				// Directly assign value if not an object
				result[newKey] = `${obj[key]}`; // Ensure the value is a string
			}
		}
	}
	return result;
}

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

				// Debug logging for EventRich.AI detection
				if (data.url.includes("/e/") || data.url.includes("/i/")) {
					const url = new URL(data.url);
					const pathname = url.pathname;

					if (pathname.includes("/e/")) {
						console.log("EventRich.AI /e/ endpoint detected:", data.url);
						const pixelEvents = await getTabData(Events.PIXEL_EVENTS, currentTabId);
						const urlParams = new URLSearchParams(url.search);
						let eventName = "library_loaded";
						let visitorId = "";

						const parameters = Array.from(urlParams.entries())
							.map(([key, value]) => {
								if (key === "visitor_id") {
									visitorId = value;
								}
								return { name: key, value };
							})
							.filter((param) => param.name !== "visitor_id");

						const categorizedParams = categorizeParameters(
							parameters,
							pixelDictionary,
						);

						await setTabData(Events.PIXEL_EVENTS, currentTabId, [
							...pixelEvents,
							{
								name: eventName,
								parameters: categorizedParams,
								id: visitorId,
								url: data.url,
							},
						]);
						await updateBadge();
					}

					if (pathname.includes("/i/")) {
						console.log("EventRich.AI /i/ endpoint detected:", data.url);
						const pixelEvents = await getTabData(Events.PIXEL_EVENTS, currentTabId);
						
						if (data.requestBody && data.requestBody.raw) {
							const decoder = new TextDecoder("utf-8");
							const requestBody = data.requestBody.raw[0]
								? decoder.decode(data.requestBody.raw[0].bytes)
								: null;

							if (requestBody) {
								try {
									const parsedBody = JSON.parse(requestBody);
									console.log("EventRich.AI request body:", parsedBody);
									
									// More robust check for EventRich.AI data
									if (parsedBody.e || parsedBody.v || parsedBody.i || parsedBody.t || parsedBody.u || parsedBody.event || parsedBody.visitor_id) {
										let eventName = parsedBody.e || parsedBody.event || "unknown_event";
										let visitorId = parsedBody.i || parsedBody.visitor_id || "";

										const flattenObject = flattenObjectFromTikTok(parsedBody);
										
										const parameters = Object.entries(flattenObject)
											.map(([key, value]) => {
												return { name: key, value: String(value) };
											})
											.filter((param) => param.name !== "i" && param.name !== "visitor_id");

										const categorizedParams = categorizeParameters(
											parameters,
											pixelDictionary,
										);

										await setTabData(Events.PIXEL_EVENTS, currentTabId, [
											...pixelEvents,
											{
												name: eventName,
												parameters: categorizedParams,
												id: visitorId,
												url: data.url,
											},
										]);
										await updateBadge();
									}
								} catch (error) {
									console.error("Error parsing EventRich.AI tracking data:", error);
								}
							}
						}
					}
				}
				// Detect Google Analytics
				else if (data.url.includes("google-analytics.com/g/collect")) {
					const googleAnalyticsEvents = await getTabData(Events.GOOGLE_ANALYTICS_EVENTS, currentTabId);
					const url = new URL(data.url);
					const urlParams = new URLSearchParams(url.search);
					let eventName = "";
					let tid = "";

					const parameters = Array.from(urlParams.entries()).map(
						([key, value]) => {
							if (key === "en") {
								eventName = value;
							} else if (key === "tid") {
								tid = value;
							}
							return { name: key, value };
						},
					);

					if (parameters.length > 0) {
						const categorizedParams = categorizeParameters(
							parameters,
							gaDictionary,
						);

						await setTabData(Events.GOOGLE_ANALYTICS_EVENTS, currentTabId, [
							...googleAnalyticsEvents,
							{
								name: eventName || "page_view",
								parameters: categorizedParams,
								id: tid,
								url: data.url,
							},
						]);
						await updateBadge();
					}
				}
				// Detect Google Tag Manager
				else if (data.url.includes("googletagmanager.com/gtm") || data.url.includes("googletagmanager.com/gtag") || data.url.includes("googletagmanager.com/collect") || data.url.includes("googletagmanager.com") || data.url.includes("gtm") || data.url.includes("gtag")) {
					const gtmEvents = await getTabData(Events.GOOGLE_TAG_MANAGER_EVENTS, currentTabId);
					const url = new URL(data.url);
					const urlParams = new URLSearchParams(url.search);
					let eventName = "";
					let gtmId = "";
					let parameters: { name: string; value: string }[] = [];

					// First, try to get parameters from URL
					parameters = Array.from(urlParams.entries()).map(
						([key, value]) => {
							if (key === "en" || key === "event") {
								eventName = value;
							} else if (key === "gtm") {
								gtmId = value;
							} else if (key === "tid") {
								gtmId = value;
							}
							return { name: key, value };
						},
					);

					// If it's a POST request, also try to parse the request body
					if (data.requestBody && data.requestBody.raw) {
						const decoder = new TextDecoder("utf-8");
						const requestBody = data.requestBody.raw[0]
							? decoder.decode(data.requestBody.raw[0].bytes)
							: null;

						if (requestBody) {
							try {
								// Try to parse as JSON first
								const parsedBody = JSON.parse(requestBody);
								const flattenObject = flattenObjectFromTikTok(parsedBody);
								
								// Extract event name and GTM ID from JSON
								if (parsedBody.event) {
									eventName = parsedBody.event;
								} else if (parsedBody.en) {
									eventName = parsedBody.en;
								}
								
								if (parsedBody.gtm) {
									gtmId = parsedBody.gtm;
								} else if (parsedBody.tid) {
									gtmId = parsedBody.tid;
								}

								// Add JSON parameters to the existing URL parameters
								const jsonParameters = Object.entries(flattenObject)
									.map(([key, value]) => {
										return { name: key, value: String(value) };
									})
									.filter((param) => param.name !== "gtm" && param.name !== "tid" && param.name !== "gtag");

								parameters = [...parameters, ...jsonParameters];
							} catch (error) {
								// If JSON parsing fails, try to parse as form data
								try {
									const formData = new URLSearchParams(requestBody);
									const formParameters = Array.from(formData.entries())
										.map(([key, value]) => {
											if (key === "en" || key === "event") {
												eventName = value;
											} else if (key === "gtm") {
												gtmId = value;
											} else if (key === "tid") {
												gtmId = value;
											}
											return { name: key, value };
										})
										.filter((param) => param.name !== "gtm" && param.name !== "tid");

									parameters = [...parameters, ...formParameters];
								} catch (formError) {
									console.error("Error parsing GTM tracking data:", formError);
								}
							}
						}
					}

					if (parameters.length > 0 || eventName || gtmId) {
						const categorizedParams = categorizeParameters(
							parameters,
							gtmDictionary,
						);

						await setTabData(Events.GOOGLE_TAG_MANAGER_EVENTS, currentTabId, [
							...gtmEvents,
							{
								name: eventName || "gtm_event",
								parameters: categorizedParams,
								id: gtmId,
								url: data.url,
							},
						]);
						await updateBadge();
					}
				}
				// Detect Google Ads
				else if (data.url.includes("googleadservices.com/pagead/conversion") || data.url.includes("googlesyndication.com/pagead/conversion")) {
					const googleAdsEvents = await getTabData(Events.GOOGLE_ADS_EVENTS, currentTabId);
					const url = new URL(data.url);
					const urlParams = new URLSearchParams(url.search);
					let eventName = "";
					let conversionId = "";

					const parameters = Array.from(urlParams.entries()).map(
						([key, value]) => {
							if (key === "event") {
								eventName = value;
							} else if (key === "id") {
								conversionId = value;
							}
							return { name: key, value };
						},
					);

					if (parameters.length > 0) {
						const categorizedParams = categorizeParameters(
							parameters,
							gaDictionary, // Reuse GA dictionary for now
						);

						await setTabData(Events.GOOGLE_ADS_EVENTS, currentTabId, [
							...googleAdsEvents,
							{
								name: eventName || "conversion",
								parameters: categorizedParams,
								id: conversionId,
								url: data.url,
							},
						]);
						await updateBadge();
					}
				}
				// Detect Meta/Facebook
				else if (data.url.includes("facebook.com/tr") || data.url.includes("fbevents.js") || data.url.includes("graph.facebook.com") || data.url.includes("connect.facebook.net")) {
					const metaEvents = await getTabData(Events.META_EVENTS, currentTabId);
					const url = new URL(data.url);
					const urlParams = new URLSearchParams(url.search);
					let eventName = "";
					let pixelId = "";
					let parameters: { name: string; value: string }[] = [];

					// First, try to get parameters from URL
					parameters = Array.from(urlParams.entries())
						.map(([key, value]) => {
							if (key === "ev") {
								eventName = value;
							} else if (key === "id") {
								pixelId = value;
							} else if (key === "event") {
								eventName = value;
							} else if (key === "pixel_id") {
								pixelId = value;
							}
							return { name: key, value };
						})
						.filter((param) => param.name !== "id" && param.name !== "pixel_id");

					// If it's a POST request, also try to parse the request body
					if (data.method === "POST" && data.requestBody && data.requestBody.raw) {
						const decoder = new TextDecoder("utf-8");
						const requestBody = data.requestBody.raw[0]
							? decoder.decode(data.requestBody.raw[0].bytes)
							: null;

						if (requestBody) {
							try {
								// Try to parse as JSON first
								const parsedBody = JSON.parse(requestBody);
								const flattenObject = flattenObjectFromTikTok(parsedBody);
								
								// Extract event name and pixel ID from JSON
								if (parsedBody.event_name) {
									eventName = parsedBody.event_name;
								} else if (parsedBody.ev) {
									eventName = parsedBody.ev;
								} else if (parsedBody.event) {
									eventName = parsedBody.event;
								} else if (parsedBody.event_type) {
									eventName = parsedBody.event_type;
								}
								
								if (parsedBody.pixel_id) {
									pixelId = parsedBody.pixel_id;
								} else if (parsedBody.id) {
									pixelId = parsedBody.id;
								} else if (parsedBody.pixelId) {
									pixelId = parsedBody.pixelId;
								}

								// Add JSON parameters to the existing URL parameters
								const jsonParameters = Object.entries(flattenObject)
									.map(([key, value]) => {
										return { name: key, value: String(value) };
									})
									.filter((param) => param.name !== "id" && param.name !== "pixel_id" && param.name !== "pixelId");

								parameters = [...parameters, ...jsonParameters];
							} catch (error) {
								// If JSON parsing fails, try to parse as form data
								try {
									const formData = new URLSearchParams(requestBody);
									const formParameters = Array.from(formData.entries())
										.map(([key, value]) => {
											if (key === "ev") {
												eventName = value;
											} else if (key === "id") {
												pixelId = value;
											} else if (key === "event") {
												eventName = value;
											} else if (key === "pixel_id") {
												pixelId = value;
											}
											return { name: key, value };
										})
										.filter((param) => param.name !== "id" && param.name !== "pixel_id");

									parameters = [...parameters, ...formParameters];
								} catch (formError) {
									console.error("Error parsing Facebook tracking data:", formError);
								}
							}
						}
					}

					if (parameters.length > 0 || eventName || pixelId) {
						const categorizedParams = categorizeParameters(
							parameters,
							metaDictionary,
						);

						await setTabData(Events.META_EVENTS, currentTabId, [
							...metaEvents,
							{
								name: eventName || "page_view",
								parameters: categorizedParams,
								id: pixelId,
								url: data.url,
							},
						]);
						await updateBadge();
					}
				}
				// Detect TikTok
				else if (data.url.includes("analytics.tiktok.com/api/v2/pixel")) {
					const tiktokEvents = await getTabData(Events.TIKTOK_EVENTS, currentTabId);
					
					if (data.requestBody && data.requestBody.raw) {
						const decoder = new TextDecoder("utf-8");
						const requestBody = data.requestBody.raw[0]
							? decoder.decode(data.requestBody.raw[0].bytes)
							: null;

						if (requestBody) {
							try {
								const parsedBody = JSON.parse(requestBody);
								const flattenObject = flattenObjectFromTikTok(parsedBody);
								let eventName = "";
								let pixelCode = "";

								const parameters = Object.entries(flattenObject)
									.map(([key, value]) => {
										if (key === "event") {
											eventName = value;
										} else if (key === "context_pixel_code") {
											pixelCode = value;
										}
										return { name: key, value: String(value) };
									})
									.filter((param) => param.name !== "context_pixel_code");

								const categorizedParams = categorizeParameters(
									parameters,
									tiktokDictionary,
								);

								await setTabData(Events.TIKTOK_EVENTS, currentTabId, [
									...tiktokEvents,
									{
										name: eventName || "page_view",
										parameters: categorizedParams,
										id: pixelCode,
										url: data.url,
									},
								]);
								await updateBadge();
							} catch (error) {
								console.error("Error parsing TikTok tracking data:", error);
							}
						}
					}
				}
				// Detect other trackers
				else if (data.url.includes("doubleclick.net") || data.url.includes("googlesyndication.com") || data.url.includes("amazon-adsystem.com") || data.url.includes("bing.com/msads")) {
					const otherTrackersEvents = await getTabData(Events.OTHER_TRACKERS_EVENTS, currentTabId);
					const url = new URL(data.url);
					const urlParams = new URLSearchParams(url.search);
					
					let parameters: { name: string; value: string }[] = [];
					let isGTMEvent = false;
					let gtmId = "";
					let eventName = "";

					// Check if this might be a GTM event by looking for GTM-specific parameters
					if (data.requestBody && data.requestBody.raw) {
						const decoder = new TextDecoder("utf-8");
						const requestBody = data.requestBody.raw[0]
							? decoder.decode(data.requestBody.raw[0].bytes)
							: null;

						if (requestBody) {
							try {
								const parsedBody = JSON.parse(requestBody);
								// Check for GTM-specific fields - expanded check
								if (parsedBody.gtm || parsedBody.gtag || parsedBody.tag_exp || parsedBody.guid === "ON" || parsedBody._tu === "JA" || parsedBody.pscdl === "noapi") {
									isGTMEvent = true;
									gtmId = parsedBody.gtm || parsedBody.gtag || "";
									if (parsedBody.event) {
										eventName = parsedBody.event;
									} else if (parsedBody.en) {
										eventName = parsedBody.en;
									}
									
									console.log("GTM event detected in other trackers:", parsedBody);
									
									// This is a GTM event, handle it in GTM detection
									const gtmEvents = await getTabData(Events.GOOGLE_TAG_MANAGER_EVENTS, currentTabId);
									const flattenObject = flattenObjectFromTikTok(parsedBody);
									
									const gtmParameters = Object.entries(flattenObject)
										.map(([key, value]) => {
											return { name: key, value: String(value) };
										})
										.filter((param) => param.name !== "gtm" && param.name !== "tid" && param.name !== "gtag");

									const categorizedParams = categorizeParameters(
										gtmParameters,
										gtmDictionary,
									);

									await setTabData(Events.GOOGLE_TAG_MANAGER_EVENTS, currentTabId, [
										...gtmEvents,
										{
											name: eventName || "gtm_event",
											parameters: categorizedParams,
											id: gtmId,
											url: data.url,
										},
									]);
									await updateBadge();
									return;
								}
							} catch (error) {
								// Not JSON, continue with normal processing
							}
						}
					}

					// If not a GTM event, process as other tracker
					parameters = Array.from(urlParams.entries()).map(
						([key, value]) => ({ name: key, value })
					);

					if (parameters.length > 0) {
						const categorizedParams = categorizeParameters(
							parameters,
							pixelDictionary, // Reuse pixel dictionary for other trackers
						);

						await setTabData(Events.OTHER_TRACKERS_EVENTS, currentTabId, [
							...otherTrackersEvents,
							{
								name: "tracking_event",
								parameters: categorizedParams,
								id: url.hostname,
								url: data.url,
							},
						]);
						await updateBadge();
					}
				}
				
				// Cache successful processing
				cacheRequest(cacheKey, { processed: true, timestamp: Date.now() });

				// End performance monitoring
				const duration = PerformanceMonitor.endMeasurement(`request_${data.requestId}`);
				
				// Log slow requests
				if (duration > 100) {
					console.warn(`Slow request processing: ${duration}ms for ${data.url}`);
				}

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
