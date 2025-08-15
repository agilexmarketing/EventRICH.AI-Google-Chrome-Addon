import { Events } from "./types";
import { 
	pixelDictionary, 
	gaDictionary, 
	metaDictionary, 
	tiktokDictionary, 
	gtmDictionary 
} from "./constants";

export interface TrackerDetectionRule {
	name: string;
	eventType: Events;
	urlPatterns: string[];
	description: string;
	extractors: {
		eventName: string[];
		trackerId: string[];
	};
	dictionary: any[];
	supportsRequestBody: boolean;
	requestBodyParsers: ('json' | 'form')[];
}

export const TRACKER_DETECTION_RULES: TrackerDetectionRule[] = [
	{
		name: "EventRICH.AI",
		eventType: Events.PIXEL_EVENTS,
		urlPatterns: ["/e/", "/i/"],
		description: "EventRICH.AI tracking pixel detection",
		extractors: {
			eventName: ["e", "event"],
			trackerId: ["i", "visitor_id"]
		},
		dictionary: pixelDictionary,
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Google Analytics",
		eventType: Events.GOOGLE_ANALYTICS_EVENTS,
		urlPatterns: ["google-analytics.com/g/collect"],
		description: "Google Analytics 4 (GA4) tracking detection",
		extractors: {
			eventName: ["en"],
			trackerId: ["tid"]
		},
		dictionary: gaDictionary,
		supportsRequestBody: false,
		requestBodyParsers: []
	},
	{
		name: "Google Tag Manager",
		eventType: Events.GOOGLE_TAG_MANAGER_EVENTS,
		urlPatterns: [
			"googletagmanager.com/gtm",
			"googletagmanager.com/gtag", 
			"googletagmanager.com/collect",
			"googletagmanager.com",
			"gtm",
			"gtag"
		],
		description: "Google Tag Manager tracking detection",
		extractors: {
			eventName: ["en", "event"],
			trackerId: ["gtm", "tid"]
		},
		dictionary: gtmDictionary,
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Meta/Facebook",
		eventType: Events.META_EVENTS,
		urlPatterns: [
			"facebook.com/tr",
			"fbevents.js",
			"graph.facebook.com",
			"connect.facebook.net"
		],
		description: "Meta (Facebook) Pixel tracking detection",
		extractors: {
			eventName: ["ev", "event", "event_name", "event_type"],
			trackerId: ["id", "pixel_id", "pixelId"]
		},
		dictionary: metaDictionary,
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "TikTok",
		eventType: Events.TIKTOK_EVENTS,
		urlPatterns: ["analytics.tiktok.com/api/v2/pixel"],
		description: "TikTok Pixel tracking detection",
		extractors: {
			eventName: ["event"],
			trackerId: ["context_pixel_code"]
		},
		dictionary: tiktokDictionary,
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Google Ads",
		eventType: Events.GOOGLE_ADS_EVENTS,
		urlPatterns: [
			"googleadservices.com/pagead/conversion",
			"googlesyndication.com/pagead/conversion"
		],
		description: "Google Ads conversion tracking detection",
		extractors: {
			eventName: ["event"],
			trackerId: ["id", "conversion_id"]
		},
		dictionary: gaDictionary, // Reuse GA dictionary for now
		supportsRequestBody: false,
		requestBodyParsers: []
	},
	{
		name: "Other Trackers",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"doubleclick.net",
			"googlesyndication.com", 
			"amazon-adsystem.com",
			"bing.com/msads"
		],
		description: "Generic detection for other advertising and tracking services",
		extractors: {
			eventName: ["event", "en"],
			trackerId: ["id", "tracker_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	}
];

export interface TrackerDetectionContext {
	url: string;
	method: string;
	requestBody?: string;
	currentTabId: number;
}

export interface ExtractedData {
	eventName: string;
	trackerId: string;
	parameters: { name: string; value: string }[];
}

export class TrackerDetector {
	/**
	 * Check if a URL matches any tracker detection rules
	 */
	static findMatchingRule(url: string): TrackerDetectionRule | null {
		for (const rule of TRACKER_DETECTION_RULES) {
			if (rule.urlPatterns.some(pattern => url.includes(pattern))) {
				return rule;
			}
		}
		return null;
	}

	/**
	 * Extract tracking data from URL parameters
	 */
	static extractFromUrlParams(url: string, rule: TrackerDetectionRule): Partial<ExtractedData> {
		const urlObj = new URL(url);
		const urlParams = new URLSearchParams(urlObj.search);
		
		let eventName = "";
		let trackerId = "";
		const parameters: { name: string; value: string }[] = [];

		Array.from(urlParams.entries()).forEach(([key, value]) => {
			// Check if this key matches event name extractors
			if (rule.extractors.eventName.includes(key)) {
				eventName = value;
			}
			// Check if this key matches tracker ID extractors  
			else if (rule.extractors.trackerId.includes(key)) {
				trackerId = value;
			}
			// Add all other parameters
			else {
				parameters.push({ name: key, value });
			}
		});

		return { eventName, trackerId, parameters };
	}

	/**
	 * Extract tracking data from request body
	 */
	static extractFromRequestBody(
		requestBody: string, 
		rule: TrackerDetectionRule
	): Partial<ExtractedData> {
		let eventName = "";
		let trackerId = "";
		let parameters: { name: string; value: string }[] = [];

		// Try JSON parsing first if supported
		if (rule.requestBodyParsers.includes('json')) {
			try {
				const parsedBody = JSON.parse(requestBody);
				const flattenObject = this.flattenObject(parsedBody);
				
				// Extract event name
				for (const field of rule.extractors.eventName) {
					if (parsedBody[field]) {
						eventName = parsedBody[field];
						break;
					}
				}
				
				// Extract tracker ID
				for (const field of rule.extractors.trackerId) {
					if (parsedBody[field]) {
						trackerId = parsedBody[field];
						break;
					}
				}

				// Convert flattened object to parameters, excluding ID fields
				parameters = Object.entries(flattenObject)
					.map(([key, value]) => ({ name: key, value: String(value) }))
					.filter(param => !rule.extractors.trackerId.includes(param.name));

				return { eventName, trackerId, parameters };
			} catch (jsonError) {
				// Fall through to form parsing if JSON fails
			}
		}

		// Try form data parsing if supported
		if (rule.requestBodyParsers.includes('form')) {
			try {
				const formData = new URLSearchParams(requestBody);
				
				Array.from(formData.entries()).forEach(([key, value]) => {
					if (rule.extractors.eventName.includes(key)) {
						eventName = value;
					} else if (rule.extractors.trackerId.includes(key)) {
						trackerId = value;
					} else {
						parameters.push({ name: key, value });
					}
				});

				return { eventName, trackerId, parameters };
			} catch (formError) {
				console.error(`Error parsing ${rule.name} form data:`, formError);
			}
		}

		return { eventName, trackerId, parameters };
	}

	/**
	 * Flatten nested objects for parameter extraction
	 */
	private static flattenObject(
		obj: Record<string, unknown>,
		parentKey = "",
		result: Record<string, string> = {}
	): Record<string, string> {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const newKey = parentKey ? `${parentKey}_${key}` : key;
				
				if (Array.isArray(obj[key])) {
					// Handle arrays by flattening each item
					(obj[key] as unknown[]).forEach((item, index) => {
						if (typeof item === "object" && item !== null) {
							this.flattenObject(
								item as Record<string, unknown>,
								`${newKey}_${index}`,
								result
							);
						} else {
							result[`${newKey}_${index}`] = String(item);
						}
					});
				} else if (typeof obj[key] === "object" && obj[key] !== null) {
					// Recursively flatten nested objects
					this.flattenObject(
						obj[key] as Record<string, unknown>,
						newKey,
						result
					);
				} else {
					// Handle primitive values
					result[newKey] = String(obj[key]);
				}
			}
		}
		return result;
	}

	/**
	 * Process tracking detection for a given context
	 */
	static async processTracking(
		context: TrackerDetectionContext,
		onTrackingDetected: (
			rule: TrackerDetectionRule, 
			extractedData: ExtractedData
		) => Promise<void>
	): Promise<boolean> {
		const rule = this.findMatchingRule(context.url);
		if (!rule) {
			return false;
		}

		// Extract data from URL parameters
		const urlData = this.extractFromUrlParams(context.url, rule);
		
		// Extract data from request body if supported and available
		let bodyData: Partial<ExtractedData> = {};
		if (rule.supportsRequestBody && context.requestBody) {
			bodyData = this.extractFromRequestBody(context.requestBody, rule);
		}

		// Merge data with preference for request body data
		const extractedData: ExtractedData = {
			eventName: bodyData.eventName || urlData.eventName || "unknown_event",
			trackerId: bodyData.trackerId || urlData.trackerId || "",
			parameters: [
				...(urlData.parameters || []),
				...(bodyData.parameters || [])
			]
		};

		// Only process if we have meaningful data
		if (extractedData.parameters.length > 0 || extractedData.eventName || extractedData.trackerId) {
			await onTrackingDetected(rule, extractedData);
			return true;
		}

		return false;
	}
}

// Helper function to check if a request should be processed for GTM
export function isGTMEvent(requestBody: any): boolean {
	return !!(
		requestBody.gtm || 
		requestBody.gtag || 
		requestBody.tag_exp || 
		requestBody.guid === "ON" || 
		requestBody._tu === "JA" || 
		requestBody.pscdl === "noapi"
	);
}

// Export for easy addition of new trackers
export function addTrackerRule(rule: TrackerDetectionRule): void {
	TRACKER_DETECTION_RULES.push(rule);
}
