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
		name: "Microsoft Clarity",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"clarity.ms",
			"www.clarity.ms/tag",
			"scripts.clarity.ms"
		],
		description: "Microsoft Clarity session recording and analytics",
		extractors: {
			eventName: ["event", "type"],
			trackerId: ["project", "tag"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Hotjar",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"hotjar.com",
			"static.hotjar.com",
			"script.hotjar.com"
		],
		description: "Hotjar session recording and heatmaps",
		extractors: {
			eventName: ["event"],
			trackerId: ["sv", "site_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "VWO",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"visualwebsiteoptimizer.com",
			"dev.visualwebsiteoptimizer.com",
			"vwo"
		],
		description: "VWO A/B testing and optimization platform",
		extractors: {
			eventName: ["event"],
			trackerId: ["account_id", "a"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Klaviyo",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"klaviyo.com",
			"static.klaviyo.com",
			"static-tracking.klaviyo.com"
		],
		description: "Klaviyo email marketing and customer analytics",
		extractors: {
			eventName: ["event", "track"],
			trackerId: ["company_id", "token"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Amplitude",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"amplitude.com",
			"cdn.amplitude.com",
			"api.amplitude.com"
		],
		description: "Amplitude product analytics",
		extractors: {
			eventName: ["event_type", "event"],
			trackerId: ["api_key", "user_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Twitter/X Ads",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"ads-twitter.com",
			"static.ads-twitter.com",
			"analytics.twitter.com"
		],
		description: "Twitter/X advertising pixel",
		extractors: {
			eventName: ["event", "tw_evt"],
			trackerId: ["txn_id", "pixel_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Pinterest",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"pinit.min.js",
			"pinterest.com/ct",
			"analytics.pinterest.com"
		],
		description: "Pinterest conversion tracking",
		extractors: {
			eventName: ["event", "em"],
			trackerId: ["tid", "pin_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Taboola",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"taboola.com",
			"cdn.taboola.com",
			"trc.taboola.com"
		],
		description: "Taboola content recommendation and advertising",
		extractors: {
			eventName: ["name", "event"],
			trackerId: ["id", "user-id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Outbrain",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"outbrain.com",
			"amplify.outbrain.com",
			"widgets.outbrain.com"
		],
		description: "Outbrain content recommendation and advertising",
		extractors: {
			eventName: ["event"],
			trackerId: ["mrkrid", "publisher_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Quantcast",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"quantserve.com",
			"secure.quantserve.com",
			"rules.quantcount.com"
		],
		description: "Quantcast audience measurement and advertising",
		extractors: {
			eventName: ["event"],
			trackerId: ["p", "site_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Affirm",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"affirm.com",
			"cdn1.affirm.com",
			"api.affirm.com"
		],
		description: "Affirm payment financing analytics",
		extractors: {
			eventName: ["event", "type"],
			trackerId: ["public_api_key", "merchant_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "ShareASale",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"shareasale.com",
			"static.shareasale.com",
			"www.dwin1.com"
		],
		description: "ShareASale affiliate marketing tracking",
		extractors: {
			eventName: ["event"],
			trackerId: ["sasmid", "ssmtid", "merchantID"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "TriplePixel",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"config-security.com",
			"api.config-security.com",
			"TriplePixel"
		],
		description: "TriplePixel marketing analytics platform",
		extractors: {
			eventName: ["action", "event"],
			trackerId: ["id", "host"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "LeadsRX",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"leadsrx.com",
			"app.leadsrx.com"
		],
		description: "LeadsRX attribution and analytics",
		extractors: {
			eventName: ["event"],
			trackerId: ["_lab", "wjshxq43604"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "The Offer",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"secureoffer.io",
			"api.secureoffer.io",
			"theoffer.io"
		],
		description: "The Offer conversion tracking",
		extractors: {
			eventName: ["e", "event"],
			trackerId: ["s", "config"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Mountain",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"mountain.com",
			"dx.mountain.com",
			"px.mountain.com"
		],
		description: "Mountain performance marketing analytics",
		extractors: {
			eventName: ["event"],
			trackerId: ["shaid", "dxver"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Shopify Analytics",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"monorail-edge.shopifysvc.com",
			"trekkie.storefront",
			"ShopifyAnalytics"
		],
		description: "Shopify native analytics and tracking",
		extractors: {
			eventName: ["event", "schema_id"],
			trackerId: ["shop_id", "theme_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Rebuy Engine",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"rebuyengine.com",
			"cdn.rebuyengine.com"
		],
		description: "Rebuy personalization and upsell engine",
		extractors: {
			eventName: ["event"],
			trackerId: ["shop", "rebuy_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Attentive",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"attn.tv",
			"cdn.attn.tv"
		],
		description: "Attentive SMS and email marketing",
		extractors: {
			eventName: ["event"],
			trackerId: ["dtag", "source"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Curalate",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"curalate.com",
			"cdn.curalate.com"
		],
		description: "Curalate visual commerce platform",
		extractors: {
			eventName: ["event", "pixel"],
			trackerId: ["sitename", "crl8"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "USBrowserSpeed",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"usbrowserspeed.com",
			"a.usbrowserspeed.com"
		],
		description: "USBrowserSpeed tracking service",
		extractors: {
			eventName: ["purpose"],
			trackerId: ["pid", "client_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "CookieYes",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"cookieyes.com",
			"cdn-cookieyes.com"
		],
		description: "CookieYes GDPR consent management",
		extractors: {
			eventName: ["event"],
			trackerId: ["client_data", "config"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
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
