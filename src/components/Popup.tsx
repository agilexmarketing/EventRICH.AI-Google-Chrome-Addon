import { Eye, Settings, Search, BarChart3, Code, Copy, Check, FileText, Download, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { 
	CURRENT_URL, 
	Events, 
	SygnalDataEvent, 
	SygnalDataItem, 
	LoginResponse,
	EventFilter,
	UserSettings,
	ThemeMode,
	PLUGIN_ENABLED_KEY
} from "../types";
import { 
	ThemeManager, 
	StorageManager, 
	NotificationManager, 
	ErrorHandler, 
	AuditLogger,
	PerformanceMonitor
} from "../utils";
import { useTheme } from "../contexts/ThemeContext";
import DataItem from "./DataItem";
import LoginForm from "./LoginForm";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";
import FilterPanel from "./FilterPanel";
import ExportButton from "./ExportButton";
import DebugPanel from "./DebugPanel";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ErrorBoundary from "./ErrorBoundary";
import PluginToggle from "./PluginToggle";
import LoginModal from "./LoginModal";

export default function Popup() {
	const { isDark } = useTheme(); // Add theme awareness
	const [currentUrl, setCurrentUrl] = useState("");
	const [isPluginEnabled, setIsPluginEnabled] = useState<boolean>(true);
	const [isLoadingPluginState, setIsLoadingPluginState] = useState<boolean>(true);
	const [settings, setSettings] = useState<UserSettings>({
		theme: ThemeMode.SYSTEM,
		autoExport: false,
		notifications: true,
		debugMode: false,
		maxStoredEvents: 1000,
		exportFormat: 'json' as any,
		filters: {},
		keyboardShortcuts: true
	});
	const [filter, setFilter] = useState<EventFilter>({});
	const [eventRichPixel, setEventRichPixel] = useState<SygnalDataItem>({
		name: "EventRICH.AI Pixel",
		nameID: "Visitor ID",
		image: "/icons/logo.svg",
		id: "",
		items: [],
	});
	const [googleAnalytics, setGoogleAnalytics] = useState<SygnalDataItem>({
		name: "Google Analytics",
		nameID: "Tracking ID",
		image: "/icons/google-analytics.svg",
		id: "",
		items: [],
	});
	const [googleAds, setGoogleAds] = useState<SygnalDataItem>({
		name: "Google Ads",
		nameID: "Conversion ID",
		image: "/icons/google-ads.svg",
		id: "",
		items: [],
	});
	const [meta, setMeta] = useState<SygnalDataItem>({
		name: "Meta",
		nameID: "Pixel ID",
		image: "/icons/meta.svg",
		id: "",
		items: [],
	});
	const [tikTok, setTikTok] = useState<SygnalDataItem>({
		name: "TikTok",
		nameID: "Pixel Code",
		image: "/icons/tiktok.svg",
		id: "",
		items: [],
	});
	const [googleTagManager, setGoogleTagManager] = useState<SygnalDataItem>({
		name: "Google Tag Manager",
		nameID: "GTM ID",
		image: "/icons/google-analytics.svg", // Using GA icon for now
		id: "",
		items: [],
	});
	const [otherTrackers, setOtherTrackers] = useState<SygnalDataItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(false);
	const [showDebugPanel, setShowDebugPanel] = useState(false);
	const [debugDataCopied, setDebugDataCopied] = useState(false);
	const [showScriptExtractor, setShowScriptExtractor] = useState(false);
	const [extractedScripts, setExtractedScripts] = useState<{ source: string; content: string; type: string }[]>([]);
	const [scriptsLoading, setScriptsLoading] = useState(false);
	const [scriptsCopied, setScriptsCopied] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [userData, setUserData] = useState<any>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [scriptsFileDownloaded, setScriptsFileDownloaded] = useState(false);



	// Helper functions for tab-specific storage
	const getTabKey = (eventType: string, tabId: number) => `${eventType}_tab_${tabId}`;

	const getTabData = async (eventType: string, tabId: number): Promise<any[]> => {
		return new Promise((resolve) => {
			const key = getTabKey(eventType, tabId);
			window.chrome.storage.local.get([key], (result) => {
				resolve(result[key] || []);
			});
		});
	};

	const getCurrentTabId = async (): Promise<number | null> => {
		return new Promise((resolve) => {
			window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				resolve(tabs[0]?.id || null);
			});
		});
	};

	// Function to get current URL for the current tab
	const getCurrentUrl = useCallback(async () => {
		const currentTabId = await getCurrentTabId();
		if (!currentTabId) return;

		const key = `currentUrl_tab_${currentTabId}`;
		window.chrome.storage.local.get([key], (result) => {
			if (result[key]) {
				setCurrentUrl(result[key]);
			}
		});
	}, []);

	const fetchEvents = useCallback(async (eventName: Events, eventKey: string) => {
		const currentTabId = await getCurrentTabId();
		if (!currentTabId) return;

		const events = await getTabData(eventName, currentTabId);

		if (events.length > 0) {
			const latestEvent = events[events.length - 1];

			// Extract id from the latest event
			const { id } = latestEvent;

			// Aggregate events into state
			const aggregatedEvents: SygnalDataEvent[] = events.map(
				(event: SygnalDataEvent) => ({
					name: event.name,
					parameters: event.parameters,
					url: event.url,
				}),
			);

			if (eventName === Events.PIXEL_EVENTS) {
				setEventRichPixel((prevVal) => ({
					...prevVal,
					id: id || "visitor_id", // Use visitor_id for EventRICH.AI
					items: aggregatedEvents,
				}));
			} else if (eventName === Events.GOOGLE_ANALYTICS_EVENTS) {
				setGoogleAnalytics((prevVal) => ({
					...prevVal,
					id: id || "tid", // Use tid for Google Analytics
					items: aggregatedEvents,
				}));
			} else if (eventName === Events.GOOGLE_ADS_EVENTS) {
				setGoogleAds((prevVal) => ({
					...prevVal,
					id: id || "conversion_id",
					items: aggregatedEvents,
				}));
			} else if (eventName === Events.META_EVENTS) {
				setMeta((prevVal) => ({
					...prevVal,
					id: id || "pixel_id",
					items: aggregatedEvents,
				}));
			} else if (eventName === Events.TIKTOK_EVENTS) {
				setTikTok((prevVal) => ({
					...prevVal,
					id: id || "pixel_code",
					items: aggregatedEvents,
				}));
			} else if (eventName === Events.GOOGLE_TAG_MANAGER_EVENTS) {
				setGoogleTagManager((prevVal) => ({
					...prevVal,
					id: id || "gtm_id",
					items: aggregatedEvents,
				}));
			} else if (eventName === Events.OTHER_TRACKERS_EVENTS) {
				// Group events by tracker name from the detection rules
				const trackerGroups = new Map();
				
				events.forEach((event: any) => {
					const trackerName = event.trackerName || event.name || "UnknownEvent";
					
					if (!trackerGroups.has(trackerName)) {
						trackerGroups.set(trackerName, {
							name: trackerName,
							nameID: "Tracker ID", 
							image: "/icons/other-tracker.svg",
							id: event.id || "tracker_id",
							items: []
						});
					}
					
					trackerGroups.get(trackerName).items.push({
						name: event.name,
						parameters: event.parameters,
						url: event.url,
					});
				});

				setOtherTrackers(Array.from(trackerGroups.values()));
			}
		}
	}, []);

	// Initialize utilities and load settings
	useEffect(() => {
		const initialize = async () => {
			try {
				PerformanceMonitor.startMeasurement('popup_initialization');
				
				// Load plugin enabled state first
				const pluginResult = await chrome.storage.local.get([PLUGIN_ENABLED_KEY]);
				const enabled = pluginResult[PLUGIN_ENABLED_KEY] !== false; // Default to true
				setIsPluginEnabled(enabled);
				setIsLoadingPluginState(false);
				
				// Initialize theme
				await ThemeManager.initializeTheme();
				
				// Load user settings
				const userSettings = await StorageManager.getSettings();
				setSettings(userSettings);
				
				// Initialize error handling and audit logging
				await ErrorHandler.initializeFromStorage();
				await AuditLogger.initializeFromStorage();
				
				// Log popup open
				AuditLogger.log('popup_opened', { timestamp: new Date().toISOString() });
				
				PerformanceMonitor.endMeasurement('popup_initialization');
			} catch (error) {
				ErrorHandler.logError(error as Error, 'Popup initialization');
				NotificationManager.error('Initialization Error', 'Failed to initialize popup');
				setIsLoadingPluginState(false);
			}
		};

		initialize();
	}, []);

	// Handle plugin toggle
	const handlePluginToggle = useCallback((enabled: boolean) => {
		setIsPluginEnabled(enabled);
		AuditLogger.log('plugin_toggled', { enabled, timestamp: new Date().toISOString() });
	}, []);

	// Handle login success
	const handleLoginSuccess = useCallback((response: LoginResponse) => {
		setUserData(response.user);
		setIsLoggedIn(true);
		setShowLoginModal(false);
		
		// Log successful login
		AuditLogger.log('user_login', { userId: response.user?.id, email: response.user?.email });
		NotificationManager.success('Login Successful', `Welcome back, ${response.user.name}!`);
		console.log("User logged in successfully:", response.user);
	}, []);

	useEffect(() => {
		const loadEvents = async () => {
			try {
				setIsLoading(true);
				PerformanceMonitor.startMeasurement('events_loading');
				
				// Get current URL first
				await getCurrentUrl();
				
				await Promise.all([
					fetchEvents(Events.PIXEL_EVENTS, "pixelEvents"),
					fetchEvents(Events.GOOGLE_ANALYTICS_EVENTS, "googleAnalyticsEvents"),
					fetchEvents(Events.GOOGLE_ADS_EVENTS, "googleAdsEvents"),
					fetchEvents(Events.META_EVENTS, "metaEvents"),
					fetchEvents(Events.TIKTOK_EVENTS, "tikTokEvents"),
					fetchEvents(Events.GOOGLE_TAG_MANAGER_EVENTS, "googleTagManagerEvents"),
					fetchEvents(Events.OTHER_TRACKERS_EVENTS, "otherTrackersEvents"),
				]);
				
				const loadTime = PerformanceMonitor.endMeasurement('events_loading');
				
				if (loadTime > 2000) {
					NotificationManager.warning(
						'Slow Loading', 
						`Data loading took ${Math.round(loadTime)}ms. Consider clearing old data.`
					);
				}
			} catch (error) {
				ErrorHandler.logError(error as Error, 'Loading events');
				NotificationManager.error('Loading Error', 'Failed to load tracking events');
			} finally {
				setIsLoading(false);
			}
		};

		loadEvents();
	}, [fetchEvents, getCurrentUrl]);

	// Filtering logic
	const filterEvents = useCallback((events: SygnalDataEvent[]): SygnalDataEvent[] => {
		return events.filter(event => {
			// Search term filter
			if (filter.searchTerm) {
				const searchLower = filter.searchTerm.toLowerCase();
				const matchesSearch = 
					event.name.toLowerCase().includes(searchLower) ||
					event.url?.toLowerCase().includes(searchLower) ||
					event.parameters.some(category => 
						category.name.toLowerCase().includes(searchLower) ||
						category.items.some(item => 
							item.name.toLowerCase().includes(searchLower) ||
							item.value.toLowerCase().includes(searchLower)
						)
					);
				if (!matchesSearch) return false;
			}

			// Event name filter
			if (filter.eventName && event.name !== filter.eventName) {
				return false;
			}

			// Date range filter
			if (filter.dateRange && event.timestamp) {
				if (filter.dateRange.start && event.timestamp < filter.dateRange.start) {
					return false;
				}
				if (filter.dateRange.end && event.timestamp > filter.dateRange.end) {
					return false;
				}
			}

			return true;
		});
	}, [filter]);

	// Get filtered trackers
	const getFilteredTracker = useCallback((tracker: SygnalDataItem): SygnalDataItem => {
		if (!tracker.id) return tracker;
		
		// Apply tracker name filter
		if (filter.tracker && tracker.name !== filter.tracker) {
			return { ...tracker, items: [] };
		}

		const filteredItems = filterEvents(tracker.items);
		return { ...tracker, items: filteredItems };
	}, [filter, filterEvents]);

	// Get all available tracker names and event names for filters
	const availableTrackers = [
		eventRichPixel.name,
		googleAnalytics.name,
		googleAds.name,
		meta.name,
		tikTok.name,
		googleTagManager.name,
		...otherTrackers.map(t => t.name)
	].filter(name => name);

	const availableEvents = [
		...eventRichPixel.items,
		...googleAnalytics.items,
		...googleAds.items,
		...meta.items,
		...tikTok.items,
		...googleTagManager.items,
		...otherTrackers.flatMap(t => t.items)
	].map(event => event.name)
	.filter((name, index, array) => array.indexOf(name) === index);

	// Get all events for export
	const allEvents = [
		...eventRichPixel.items,
		...googleAnalytics.items,
		...googleAds.items,
		...meta.items,
		...tikTok.items,
		...googleTagManager.items,
		...otherTrackers.flatMap(t => t.items)
	];

	const filteredAllEvents = filterEvents(allEvents);
	
	// Get filtered trackers for display
	const filteredEventRichPixel = getFilteredTracker(eventRichPixel);
	const filteredGoogleAnalytics = getFilteredTracker(googleAnalytics);
	const filteredGoogleAds = getFilteredTracker(googleAds);
	const filteredMeta = getFilteredTracker(meta);
	const filteredTikTok = getFilteredTracker(tikTok);
	const filteredGoogleTagManager = getFilteredTracker(googleTagManager);
	const filteredOtherTrackers = otherTrackers.map(getFilteredTracker);

	const allTrackers = [
		filteredEventRichPixel,
		filteredGoogleAnalytics,
		filteredGoogleAds,
		filteredMeta,
		filteredTikTok,
		filteredGoogleTagManager,
		...filteredOtherTrackers
	];

	// Generate comprehensive debug data
	const generateDebugData = useCallback(() => {
		const debugData = {
			timestamp: new Date().toISOString(),
			url: currentUrl,
			summary: {
				totalTrackers: allTrackers.filter(t => t.id).length,
				totalEvents: allTrackers.reduce((sum, t) => sum + t.items.length, 0),
				detectedTrackers: allTrackers.filter(t => t.id).map(t => t.name)
			},
			trackers: allTrackers.filter(t => t.id).map(tracker => ({
				name: tracker.name,
				id: tracker.id,
				nameID: tracker.nameID,
				eventCount: tracker.items.length,
				events: tracker.items.map(event => ({
					name: event.name,
					url: event.url,
					timestamp: event.timestamp?.toISOString(),
					parameters: event.parameters.reduce((acc, category) => {
						category.items.forEach(item => {
							acc[item.name] = item.value;
						});
						return acc;
					}, {} as Record<string, string>)
				}))
			})),
			metadata: {
				extensionVersion: "2.1.0",
				userAgent: navigator.userAgent,
				generatedAt: new Date().toISOString()
			}
		};
		return debugData;
	}, [allTrackers, currentUrl]);

	const handleCopyDebugData = async () => {
		try {
			const debugData = generateDebugData();
			await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
			setDebugDataCopied(true);
			setTimeout(() => setDebugDataCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy debug data:', error);
		}
	};

	// Script extraction functionality
	const extractScriptsFromPage = async () => {
		try {
			setScriptsLoading(true);
			setExtractedScripts([]);
			
			const currentTabId = await getCurrentTabId();
			if (!currentTabId) {
				NotificationManager.error('Error', 'Could not get current tab');
				setScriptsLoading(false);
				return;
			}

			console.log('Attempting to extract scripts from tab:', currentTabId);

			// Check if chrome.scripting is available
			if (!chrome.scripting) {
				NotificationManager.error('Permission Error', 'Chrome scripting API not available. Please reload the extension.');
				setScriptsLoading(false);
				return;
			}

			// Inject script to extract all scripts from page and iframes
			const results = await chrome.scripting.executeScript({
				target: { tabId: currentTabId },
				func: () => {
					try {
						const scripts: { source: string; content: string; type: string }[] = [];
						
						// Helper function to extract scripts from a document
						const extractFromDocument = (doc: Document, source: string) => {
							const scriptElements = doc.querySelectorAll('script');
							console.log(`Found ${scriptElements.length} script elements in ${source}`);
							
							scriptElements.forEach((script, index) => {
								let content = '';
								let type = 'inline';
								let scriptSource = `${source} - Script ${index + 1}`;
								
								if (script.src) {
									// External script
									type = 'external';
									content = `// External script source: ${script.src}\n// Cannot access content due to CORS restrictions`;
									scriptSource = script.src;
								} else if (script.textContent) {
									// Inline script
									content = script.textContent.trim();
									type = 'inline';
								} else if (script.innerHTML) {
									// Try innerHTML as fallback
									content = script.innerHTML.trim();
									type = 'inline';
								}
								
								// Include scripts even if they have empty content for debugging
								scripts.push({
									source: scriptSource,
									content: content || '// Empty script or script with no accessible content',
									type
								});
							});
						};

						// Extract from main document
						console.log('Extracting from main document');
						extractFromDocument(document, 'Main Page');
						
						// Extract from iframes (if accessible)
						const iframes = document.querySelectorAll('iframe');
						console.log(`Found ${iframes.length} iframes`);
						
						iframes.forEach((iframe, iframeIndex) => {
							try {
								if (iframe.contentDocument) {
									extractFromDocument(
										iframe.contentDocument, 
										`Iframe ${iframeIndex + 1} (${iframe.src || 'same-origin'})`
									);
								} else {
									// iframe not accessible, but still note it
									scripts.push({
										source: `Iframe ${iframeIndex + 1} (${iframe.src || 'cross-origin'})`,
										content: `// Cannot access iframe content due to CORS restrictions\n// iframe src: ${iframe.src || 'no src attribute'}`,
										type: 'iframe-blocked'
									});
								}
							} catch (error) {
								// iframe not accessible due to CORS
								scripts.push({
									source: `Iframe ${iframeIndex + 1} (${iframe.src || 'cross-origin'})`,
									content: `// Cannot access iframe content due to CORS restrictions\n// iframe src: ${iframe.src || 'no src attribute'}\n// Error: ${error.message}`,
									type: 'iframe-blocked'
								});
							}
						});

						console.log(`Total scripts extracted: ${scripts.length}`);
						return scripts;
					} catch (error) {
						console.error('Error in content script:', error);
						return [];
					}
				}
			});

			console.log('Script execution results:', results);

			if (results && results[0] && results[0].result) {
				const scripts = results[0].result;
				console.log('Extracted scripts:', scripts);
				setExtractedScripts(scripts);
				
				NotificationManager.success(
					'Scripts Extracted', 
					`Found ${scripts.length} scripts on the page`
				);
				
				AuditLogger.log('scripts_extracted', { 
					scriptCount: scripts.length,
					url: currentUrl 
				});
			} else {
				console.log('No results from script execution');
				NotificationManager.warning('No Scripts', 'No scripts found on this page or execution failed');
			}
		} catch (error) {
			console.error('Failed to extract scripts:', error);
			NotificationManager.error('Extraction Failed', `Could not extract scripts: ${error.message}`);
			ErrorHandler.logError(error as Error, 'Script extraction');
		} finally {
			setScriptsLoading(false);
		}
	};



	// Generate formatted script content for copying/downloading
	const generateScriptsContent = () => {
		const allScriptsContent = extractedScripts.map((script, index) => 
			`// ========== SCRIPT ${index + 1} ==========\n` +
			`// Source: ${script.source}\n` +
			`// Type: ${script.type}\n` +
			`// Extracted by EventRICH.AI Chrome Extension\n\n` +
			`${script.content}\n\n`
		).join('\n');

		return `// ALL SCRIPTS EXTRACTED FROM: ${currentUrl}\n` +
			`// Extraction Date: ${new Date().toISOString()}\n` +
			`// Total Scripts: ${extractedScripts.length}\n` +
			`// Generated by EventRICH.AI Chrome Extension for AI Analysis\n\n` +
			allScriptsContent;
	};

	const handleCopyAllScripts = async () => {
		if (extractedScripts.length === 0) {
			NotificationManager.warning('No Scripts', 'No scripts available to copy');
			return;
		}

		try {
			const finalContent = generateScriptsContent();
			await navigator.clipboard.writeText(finalContent);
			setScriptsCopied(true);
			setTimeout(() => setScriptsCopied(false), 2000);
			
			NotificationManager.success('All Scripts Copied!', `${extractedScripts.length} scripts copied for AI analysis`);
			
			AuditLogger.log('all_scripts_copied', { 
				scriptCount: extractedScripts.length,
				url: currentUrl 
			});
		} catch (error) {
			console.error('Failed to copy all scripts:', error);
			NotificationManager.error('Copy Failed', 'Could not copy scripts to clipboard');
		}
	};

	const handleDownloadAllScripts = async () => {
		if (extractedScripts.length === 0) {
			NotificationManager.warning('No Scripts', 'No scripts available to download');
			return;
		}

		try {
			const finalContent = generateScriptsContent();
			
			// Create a safe filename from the URL
			const hostname = currentUrl ? new URL(currentUrl).hostname.replace(/[^a-z0-9]/gi, '_') : 'unknown_site';
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `scripts_${hostname}_${timestamp}.txt`;
			
			// Create blob and download
			const blob = new Blob([finalContent], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			
			// Use Chrome downloads API if available, otherwise fallback to direct download
			if (chrome.downloads) {
				chrome.downloads.download({
					url: url,
					filename: filename,
					saveAs: false
				}, () => {
					URL.revokeObjectURL(url);
					setScriptsFileDownloaded(true);
					setTimeout(() => setScriptsFileDownloaded(false), 2000);
					
					NotificationManager.success('Scripts Downloaded!', `File saved as ${filename}`);
					
					AuditLogger.log('all_scripts_downloaded', { 
						scriptCount: extractedScripts.length,
						url: currentUrl,
						filename: filename
					});
				});
			} else {
				// Fallback: create temporary download link
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
				setScriptsFileDownloaded(true);
				setTimeout(() => setScriptsFileDownloaded(false), 2000);
				
				NotificationManager.success('Scripts Downloaded!', `File saved as ${filename}`);
				
				AuditLogger.log('all_scripts_downloaded', { 
					scriptCount: extractedScripts.length,
					url: currentUrl,
					filename: filename
				});
			}
		} catch (error) {
			console.error('Failed to download all scripts:', error);
			NotificationManager.error('Download Failed', 'Could not download scripts file');
		}
	};

	// Keyboard shortcuts
	useEffect(() => {
		if (!settings.keyboardShortcuts) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Ctrl/Cmd + Shift + E - Toggle popup (handled by Chrome commands)
			// Ctrl/Cmd + Shift + X - Export data
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'X') {
				event.preventDefault();
				if (filteredAllEvents.length > 0) {
					AuditLogger.log('keyboard_export', { eventCount: filteredAllEvents.length });
					// ExportButton will handle the actual export
				}
			}
			
			// Ctrl/Cmd + F - Focus search
			if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
				event.preventDefault();
				setShowFilters(true);
				// Focus search input after state update
				setTimeout(() => {
					const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
					searchInput?.focus();
				}, 100);
			}
			
			// Escape - Close filters/modals
			if (event.key === 'Escape') {
				setShowFilters(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [settings.keyboardShortcuts, filteredAllEvents.length]);



	const hasAnyEvents = 
		filteredEventRichPixel.id || 
		filteredGoogleAnalytics.id || 
		filteredGoogleAds.id || 
		filteredMeta.id || 
		filteredTikTok.id || 
		filteredGoogleTagManager.id || 
		filteredOtherTrackers.some(t => t.id);

	// Helper function to determine container classes based on tracker count
	const getContainerClasses = () => {
		const totalTrackers = [
			filteredEventRichPixel.id ? 1 : 0,
			filteredGoogleAnalytics.id ? 1 : 0,
			filteredGoogleAds.id ? 1 : 0,
			filteredMeta.id ? 1 : 0,
			filteredTikTok.id ? 1 : 0,
			filteredGoogleTagManager.id ? 1 : 0,
			...filteredOtherTrackers.filter(t => t.id).map(() => 1)
		].reduce((sum, count) => sum + count, 0);

		if (totalTrackers === 0) {
			return "popup-container no-events-container";
		} else if (totalTrackers <= 3) {
			return "popup-container few-events-container";
		} else {
			return "popup-container many-events-container";
		}
	};

	return (
		<ErrorBoundary>
			<div className={`w-[480px] flex flex-col bg-white dark:bg-gray-900 relative ${getContainerClasses()}`}>
				<NotificationCenter />
				
				{/* Plugin Disabled Overlay */}
				{!isPluginEnabled && !isLoadingPluginState && (
					<div className="absolute inset-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
						<div className="text-center p-6">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
								EventRICH.AI Disabled
							</h2>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								Enable the plugin to start tracking events and save resources
							</p>
							<PluginToggle onToggle={handlePluginToggle} className="mx-auto" />
						</div>
					</div>
				)}
				
				{/* Header */}
				<div className={`flex items-center justify-between gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 px-3 pt-3 ${!isPluginEnabled ? 'blur-sm' : ''}`}>
					<div 
						className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
						onClick={() => {
							window.chrome.tabs.create({ url: 'https://EventRICH.AI' });
							AuditLogger.log('external_link_click', { url: 'https://EventRICH.AI' });
						}}
					>
						<Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
						<span className="text-xl font-bold text-gray-900 dark:text-white">
							EventRICH.AI
						</span>
					</div>
					
					<div className="flex items-center gap-2">
						<ThemeToggle />
						{isPluginEnabled && (
							<div className="w-2 h-2 bg-green-500 rounded-full" title="Plugin is active" />
						)}
						<button
							onClick={() => setShowLoginModal(true)}
							className={`
								flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200
								border border-gray-200 dark:border-gray-600
								${isLoggedIn 
									? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-600' 
									: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
								}
							`}
							title={isLoggedIn ? `Logged in as ${userData?.name || 'User'}` : "Login to EventRICH.AI"}
						>
							<User className="h-4 w-4" />
						</button>
						<div className="flex items-center gap-1">
							<AnalyticsDashboard allTrackers={allTrackers} />
							<ExportButton 
								data={filteredAllEvents} 
								filename="eventrich-tracking-data"
								compact 
							/>
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`
									flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200
									border border-gray-200 dark:border-gray-600 relative
									${showFilters 
										? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600' 
										: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
									}
								`}
								title="Toggle filters (Ctrl+F)"
							>
								<Search className="h-4 w-4" />
								{(filter.searchTerm || filter.tracker || filter.eventName || filter.dateRange) && (
									<span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-2 h-2 rounded-full"></span>
								)}
							</button>
							<button
								onClick={() => setShowDebugPanel(!showDebugPanel)}
								className={`
									flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200
									border border-gray-200 dark:border-gray-600
									${showDebugPanel 
										? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600' 
										: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
									}
								`}
								title="View All Trackers Debug Data"
							>
								<Code className="h-4 w-4" />
							</button>
							<button
								onClick={() => setShowScriptExtractor(!showScriptExtractor)}
								className={`
									flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200
									border border-gray-200 dark:border-gray-600
									${showScriptExtractor 
										? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600' 
										: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
									}
								`}
								title="Extract Page Scripts for AI Analysis"
							>
								<FileText className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>

				{/* Status Bar */}
				<div className={`px-3 py-2 text-xs text-gray-600 dark:text-gray-300 ${!isPluginEnabled ? 'blur-sm' : ''}`}>
					{isLoading ? (
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
							Loading tracking data...
						</div>
					) : hasAnyEvents ? (
						<div className="flex items-center justify-between">
							<div>
								Found tracking on <strong className="text-gray-900 dark:text-white">{currentUrl || "this website"}</strong>
							</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">
								{filteredAllEvents.length !== allEvents.length && (
									<span>{filteredAllEvents.length} of {allEvents.length} events</span>
								)}
								{filteredAllEvents.length === allEvents.length && (
									<span>{allEvents.length} events</span>
								)}
							</div>
						</div>
					) : (
						<div className="flex items-center justify-between">
							<div>
								No tracking detected. Refresh the page to scan for trackers.
							</div>
							{settings.keyboardShortcuts && (
								<div className="text-xs text-gray-400">
									Press Ctrl+F to search
								</div>
							)}
						</div>
					)}
				</div>

				{/* Main Content - Blurred when disabled */}
				<div className={`bg-white dark:bg-gray-900 ${!isPluginEnabled ? 'blur-sm pointer-events-none' : ''}`}>
					{/* Filters Panel */}
					{showFilters && (
						<FilterPanel
							onFilterChange={setFilter}
							availableTrackers={availableTrackers}
							availableEvents={availableEvents}
						/>
					)}

					{/* Debug Panel */}
				{showDebugPanel && (
					<div className="mx-3 mb-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Code className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								<h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
									All Trackers Debug Data
								</h3>
							</div>
							<button
								onClick={handleCopyDebugData}
								className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 rounded transition-colors"
							>
								{debugDataCopied ? (
									<>
										<Check className="h-3 w-3" />
										Copied!
									</>
								) : (
									<>
										<Copy className="h-3 w-3" />
										Copy JSON
									</>
								)}
							</button>
						</div>
						<div className="max-h-64 overflow-y-auto">
							<pre className="text-xs text-purple-800 dark:text-purple-200 whitespace-pre-wrap break-words bg-white dark:bg-purple-950/40 p-2 rounded border border-purple-200 dark:border-purple-700">
								{JSON.stringify(generateDebugData(), null, 2)}
							</pre>
						</div>
						<div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
							This contains all detected trackers, their events, and parameters for debugging purposes.
						</div>
					</div>
				)}

				{/* Script Extractor Panel */}
				{showScriptExtractor && (
					<div className="mx-3 mb-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
								<h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
									Page Script Extractor
								</h3>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={extractScriptsFromPage}
									disabled={scriptsLoading}
									className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-600 rounded transition-colors disabled:opacity-50 border border-orange-500"
								>
									{scriptsLoading ? (
										<>
											<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
											Extracting...
										</>
									) : (
										<>
											<FileText className="h-3 w-3" />
											Extract Scripts
										</>
									)}
								</button>
							</div>
						</div>
						
						{extractedScripts.length > 0 && (
							<div className="mb-3">
								<div className="flex items-center justify-between mb-2">
									<div className="flex flex-col">
										<span className="text-xs font-medium text-orange-800 dark:text-orange-200">
											All Scripts ({extractedScripts.length} found)
										</span>
										<span className="text-xs text-orange-600 dark:text-orange-400">
											Total size: ~{Math.round(generateScriptsContent().length / 1024)}KB
											{extractedScripts.length > 50 && (
												<span className="text-orange-700 dark:text-orange-300 font-medium"> (Large volume - use download for easier handling)</span>
											)}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={handleCopyAllScripts}
											className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60 rounded transition-colors"
										>
											{scriptsCopied ? (
												<>
													<Check className="h-3 w-3" />
													Copied!
												</>
											) : (
												<>
													<Copy className="h-3 w-3" />
													Copy
												</>
											)}
										</button>
										<button
											onClick={handleDownloadAllScripts}
											className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-600 rounded transition-colors"
										>
											{scriptsFileDownloaded ? (
												<>
													<Check className="h-3 w-3" />
													Downloaded!
												</>
											) : (
												<>
													<Download className="h-3 w-3" />
													Download
												</>
											)}
										</button>
									</div>
								</div>
								<div className="relative">
									<textarea
										value={extractedScripts.map((script, index) => 
											`// ========== SCRIPT ${index + 1} ==========\n` +
											`// Source: ${script.source}\n` +
											`// Type: ${script.type}\n` +
											`// Extracted by EventRICH.AI Chrome Extension\n\n` +
											`${script.content}\n\n`
										).join('\n')}
										readOnly
										className="w-full h-64 text-xs text-orange-800 dark:text-orange-200 bg-white dark:bg-orange-950/40 p-3 rounded border border-orange-200 dark:border-orange-700 font-mono resize-none"
										placeholder="Extracted scripts will appear here..."
									/>
								</div>
							</div>
						)}
						
						<div className="text-xs text-orange-600 dark:text-orange-400">
							Extract all scripts from the current page and iframes for AI analysis to improve tracker detection.
							{extractedScripts.length > 0 && (
								<> Found {extractedScripts.filter(s => s.type === 'inline').length} inline, {extractedScripts.filter(s => s.type === 'external').length} external scripts.</>
							)}
						</div>
					</div>
				)}

				{/* Main Content - Dynamic Height */}
				<div className={`
					flex flex-col overflow-y-auto bg-white dark:bg-gray-900
					${hasAnyEvents ? 'max-h-[400px]' : 'min-h-32'}
				`}>
					{/* Function to get consistent background color based on tracker name */}
					{(() => {
						const getTrackerBackgroundColor = (trackerName: string) => {
							const colors = [
								'bg-blue-50 dark:bg-blue-950/50',      // EventRICH.AI
								'bg-green-50 dark:bg-green-950/50',    // Google Analytics
								'bg-purple-50 dark:bg-purple-950/50',  // Google Ads
								'bg-pink-50 dark:bg-pink-950/50',      // Meta
								'bg-yellow-50 dark:bg-yellow-950/50',  // TikTok
								'bg-indigo-50 dark:bg-indigo-950/50',  // Google Tag Manager
								'bg-orange-50 dark:bg-orange-950/50',  // Others 1
								'bg-teal-50 dark:bg-teal-950/50',      // Others 2
								'bg-cyan-50 dark:bg-cyan-950/50',      // Others 3
								'bg-red-50 dark:bg-red-950/50',       // Others 4
							];
							
							// Generate consistent index based on tracker name
							const nameHash = trackerName.split('').reduce((a, b) => {
								a = ((a << 5) - a) + b.charCodeAt(0);
								return a & a;
							}, 0);
							return colors[Math.abs(nameHash) % colors.length];
						};

						// Collect all trackers with IDs
						const allTrackersWithIds = [
							filteredEventRichPixel.id ? filteredEventRichPixel : null,
							filteredGoogleAnalytics.id ? filteredGoogleAnalytics : null,
							filteredGoogleAds.id ? filteredGoogleAds : null,
							filteredMeta.id ? filteredMeta : null,
							filteredTikTok.id ? filteredTikTok : null,
							filteredGoogleTagManager.id ? filteredGoogleTagManager : null,
							...filteredOtherTrackers.filter(tracker => tracker.id)
						].filter(Boolean);

						// Sort alphabetically with EventRICH.AI always first
						const visibleTrackers = allTrackersWithIds.sort((a, b) => {
							// EventRICH.AI always comes first
							if (a.name === "EventRICH.AI Pixel") return -1;
							if (b.name === "EventRICH.AI Pixel") return 1;
							
							// Sort all others alphabetically
							return a.name.localeCompare(b.name);
						});

						return visibleTrackers.map((tracker, index) => (
							<div 
								key={`${tracker!.name}-${tracker!.id}`}
								className={getTrackerBackgroundColor(tracker!.name)}
							>
								<DataItem item={tracker!} />
							</div>
						));
					})()}
					
					{/* No Results Message */}
					{hasAnyEvents && filteredAllEvents.length === 0 && (
						<div className="text-center py-8 text-gray-500 dark:text-gray-400">
							<Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p>No events match your filters</p>
							<button
								onClick={() => setFilter({})}
								className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1"
							>
								Clear filters
							</button>
						</div>
					)}
					
					{/* No Events Detected Message */}
					{!hasAnyEvents && !isLoading && (
						<div className="text-center py-6 text-gray-500 dark:text-gray-400">
							<Eye className="h-6 w-6 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No tracking events detected</p>
							<p className="text-xs mt-1 opacity-75">
								Visit a website with tracking to see events
							</p>
						</div>
					)}
				</div>

					{/* Debug Panel */}
					{settings.debugMode && (
						<DebugPanel events={filteredAllEvents} />
					)}
				</div>
			</div>

			{/* Login Modal */}
			<LoginModal 
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
				onLoginSuccess={handleLoginSuccess}
			/>
		</ErrorBoundary>
	);
}
