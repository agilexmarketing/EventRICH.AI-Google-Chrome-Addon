import { Eye, Settings, Search, BarChart3 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { 
	CURRENT_URL, 
	Events, 
	SygnalDataEvent, 
	SygnalDataItem, 
	LoginResponse,
	EventFilter,
	UserSettings,
	ThemeMode
} from "../types";
import { 
	ThemeManager, 
	StorageManager, 
	NotificationManager, 
	ErrorHandler, 
	AuditLogger,
	PerformanceMonitor
} from "../utils";
import DataItem from "./DataItem";
import LoginForm from "./LoginForm";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";
import FilterPanel from "./FilterPanel";
import ExportButton from "./ExportButton";
import DebugPanel from "./DebugPanel";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ErrorBoundary from "./ErrorBoundary";

export default function Popup() {
	const [currentUrl, setCurrentUrl] = useState("");
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
				// Handle other trackers as an array
				const otherTracker = {
					name: latestEvent.name || "Other Tracker",
					nameID: "Tracker ID",
					image: "/icons/other-tracker.svg",
					id: id || "tracker_id",
					items: aggregatedEvents,
				};

				setOtherTrackers((prevTrackers) => {
					// Check if this tracker already exists
					const existingIndex = prevTrackers.findIndex(
						(tracker) => tracker.id === otherTracker.id
					);

					if (existingIndex >= 0) {
						// Update existing tracker
						const updatedTrackers = [...prevTrackers];
						updatedTrackers[existingIndex] = otherTracker;
						return updatedTrackers;
					} else {
						// Add new tracker
						return [...prevTrackers, otherTracker];
					}
				});
			}
		}
	}, []);

	// Initialize utilities and load settings
	useEffect(() => {
		const initialize = async () => {
			try {
				PerformanceMonitor.startMeasurement('popup_initialization');
				
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
			}
		};

		initialize();
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

	const handleLoginSuccess = (userData: LoginResponse["user"]) => {
		// Log successful login
		AuditLogger.log('user_login', { userId: userData?.id, email: userData?.email });
		NotificationManager.success('Login Successful', `Welcome back, ${userData?.name || userData?.email}!`);
		console.log("User logged in successfully:", userData);
	};

	const hasAnyEvents = 
		filteredEventRichPixel.id || 
		filteredGoogleAnalytics.id || 
		filteredGoogleAds.id || 
		filteredMeta.id || 
		filteredTikTok.id || 
		filteredGoogleTagManager.id || 
		filteredOtherTrackers.some(t => t.id);

	return (
		<ErrorBoundary>
			<div className="w-[450px] flex flex-col bg-white dark:bg-gray-900 relative">
				<NotificationCenter />
				
				{/* Header */}
				<div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 px-3 pt-3">
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
									flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors
									${showFilters 
										? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
										: 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
									}
								`}
								title="Toggle filters (Ctrl+F)"
							>
								<Search className="h-3 w-3" />
								Filters
								{(filter.searchTerm || filter.tracker || filter.eventName || filter.dateRange) && (
									<span className="bg-blue-500 text-white text-xs px-1 rounded-full">●</span>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Status Bar */}
				<div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
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

				{/* Filters Panel */}
				{showFilters && (
					<FilterPanel
						onFilterChange={setFilter}
						availableTrackers={availableTrackers}
						availableEvents={availableEvents}
					/>
				)}

				{/* Main Content */}
				<div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto px-3 pb-3">
					{filteredEventRichPixel.id && <DataItem item={filteredEventRichPixel} />}
					{filteredGoogleAnalytics.id && <DataItem item={filteredGoogleAnalytics} />}
					{filteredGoogleAds.id && <DataItem item={filteredGoogleAds} />}
					{filteredMeta.id && <DataItem item={filteredMeta} />}
					{filteredTikTok.id && <DataItem item={filteredTikTok} />}
					{filteredGoogleTagManager.id && <DataItem item={filteredGoogleTagManager} />}
					{filteredOtherTrackers.map((tracker, index) => (
						tracker.id && <DataItem key={`${tracker.name}-${index}`} item={tracker} />
					))}
					
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
				</div>

				{/* Login Form */}
				<LoginForm onLoginSuccess={handleLoginSuccess} />

				{/* Debug Panel */}
				{settings.debugMode && (
					<DebugPanel events={filteredAllEvents} />
				)}
			</div>
		</ErrorBoundary>
	);
}
