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
		urlPatterns: [
			"google-analytics.com/g/collect",
			"google-analytics.com/collect",
			"analytics.google.com",
			"ssl.google-analytics.com"
		],
		description: "Google Analytics 4 (GA4) tracking detection",
		extractors: {
			eventName: ["en", "t"],
			trackerId: ["tid", "tracking_id"]
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
			"m.clarity.ms",
			"www.clarity.ms",
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
			"vwo.com",
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
			"www.klaviyo.com",
			"static.klaviyo.com",
			"static-tracking.klaviyo.com",
			"static-forms.klaviyo.com",
			"a.klaviyo.com",
			"static.klaviyo.com/onsite/js",
			"klaviyo.js",
			"klaviyo_subscribe.js",
			"klaviyo_subscribe.css",
			"in_app_forms",
			"signup_forms",
			"onsite-triggering",
			"forms/api",
			"client/profiles",
			"groups-targeting",
			"full-forms"
		],
		description: "Klaviyo email marketing and customer analytics",
		extractors: {
			eventName: ["event", "track", "type", "data_type"],
			trackerId: ["company_id", "token", "cb", "data"]
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
			"api.amplitude.com",
			"api2.amplitude.com"
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
			eventName: ["name", "event", "en"],
			trackerId: ["id", "user-id", "tim", "pubit"]
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
			trackerId: ["_lab", "acctTag"]
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
			eventName: ["event", "evt"],
			trackerId: ["shaid", "dxver", "ga_tracking_id"]
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
			"cdn.attn.tv",
			".attn.tv"
		],
		description: "Attentive SMS and email marketing",
		extractors: {
			eventName: ["event"],
			trackerId: ["dtag", "source", "id"]
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
		name: "Snapchat Pixel",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"tr.snapchat.com",
			"sc-static.net",
			"snapchat.com/tr"
		],
		description: "Snapchat Ads conversion tracking",
		extractors: {
			eventName: ["event", "et"],
			trackerId: ["pixel_id", "u"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "LinkedIn Insight Tag",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"linkedin.com/li/track",
			"snap.licdn.com",
			"www.linkedin.com/psettings/guest-controls/retargeting-opt-out"
		],
		description: "LinkedIn Ads conversion tracking",
		extractors: {
			eventName: ["event", "conversionType"],
			trackerId: ["partnerId", "conversionId"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Reddit Pixel",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"rdt.li",
			"redditstatic.com",
			"reddit.com/api/v2/pixel"
		],
		description: "Reddit Ads conversion tracking",
		extractors: {
			eventName: ["event", "action"],
			trackerId: ["advertiser_id", "pixel_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Google Optimize",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"optimize.google.com",
			"googleoptimize.com",
			"gtm/optimize"
		],
		description: "Google Optimize A/B testing platform",
		extractors: {
			eventName: ["event"],
			trackerId: ["container_id", "experiment_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Segment",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"api.segment.io",
			"cdn.segment.com",
			"segment.com/v1"
		],
		description: "Segment customer data platform",
		extractors: {
			eventName: ["event", "type"],
			trackerId: ["writeKey", "userId"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Mixpanel",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"api.mixpanel.com",
			"cdn.mxpnl.com",
			"mixpanel.com/track"
		],
		description: "Mixpanel product analytics",
		extractors: {
			eventName: ["event"],
			trackerId: ["token", "distinct_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Heap Analytics",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"heapanalytics.com",
			"cdn.heapanalytics.com"
		],
		description: "Heap digital insights platform",
		extractors: {
			eventName: ["event", "k"],
			trackerId: ["h", "app_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Adobe Analytics",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"adobe.com/b/ss",
			"omtrdc.net",
			"2o7.net",
			"demdex.net"
		],
		description: "Adobe Analytics (formerly Omniture)",
		extractors: {
			eventName: ["events", "pe"],
			trackerId: ["rsid", "vid"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Bing Ads",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"bat.bing.com",
			"bing.com/msads",
			"microsoft.com/msads"
		],
		description: "Microsoft Bing Ads conversion tracking",
		extractors: {
			eventName: ["event", "ea", "evt"],
			trackerId: ["ti", "tag_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Intercom",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"api.intercom.io",
			"js.intercomcdn.com",
			"intercom.com/track"
		],
		description: "Intercom customer messaging platform",
		extractors: {
			eventName: ["event_name", "type"],
			trackerId: ["app_id", "user_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Drift",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"driftt.com",
			"js.driftt.com",
			"api.drift.com"
		],
		description: "Drift conversational marketing platform",
		extractors: {
			eventName: ["event"],
			trackerId: ["org_id", "end_user_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Zendesk Chat",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"zopim.com",
			"v2.zopim.com",
			"zendesk.com/api"
		],
		description: "Zendesk Chat customer support",
		extractors: {
			eventName: ["type", "event"],
			trackerId: ["account_key", "session_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Mailchimp",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"mailchimp.com/track",
			"chimpstatic.com",
			"list-manage.com"
		],
		description: "Mailchimp email marketing analytics",
		extractors: {
			eventName: ["goal", "event"],
			trackerId: ["u", "id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "HubSpot",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"hs-analytics.net",
			"hubspot.com/api",
			"hs-scripts.com"
		],
		description: "HubSpot marketing automation",
		extractors: {
			eventName: ["_n", "event"],
			trackerId: ["portalId", "utk"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Pardot",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"pardot.com",
			"pi.pardot.com"
		],
		description: "Salesforce Pardot B2B marketing automation",
		extractors: {
			eventName: ["event", "activity"],
			trackerId: ["account_id", "visitor_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Marketo",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"marketo.net",
			"mktoresp.com",
			"marketo.com/api"
		],
		description: "Adobe Marketo marketing automation",
		extractors: {
			eventName: ["event", "activity_type"],
			trackerId: ["leadId", "munchkinId"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Salesforce DMP",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"krxd.net",
			"salesforce.com/audience",
			"sfmc.co"
		],
		description: "Salesforce Data Management Platform",
		extractors: {
			eventName: ["event", "type"],
			trackerId: ["site_id", "user_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Eloqua",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"eloqua.com",
			"elqtrk.com",
			"oracle.com/cx/marketing"
		],
		description: "Oracle Eloqua marketing automation",
		extractors: {
			eventName: ["event", "pps"],
			trackerId: ["siteId", "visitorId"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Crazy Egg",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"crazyegg.com",
			"script.crazyegg.com"
		],
		description: "Crazy Egg heatmap and A/B testing",
		extractors: {
			eventName: ["event"],
			trackerId: ["CE_SNAPSHOT_NAME", "account_number"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Lucky Orange",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"luckyorange.com",
			"luckyorange.net",
			"settings.luckyorange.net"
		],
		description: "Lucky Orange session recording and analytics",
		extractors: {
			eventName: ["event"],
			trackerId: ["site_id", "session_id", "d"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "FullStory",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"fullstory.com",
			"fs.org"
		],
		description: "FullStory digital experience platform",
		extractors: {
			eventName: ["event", "eventName"],
			trackerId: ["org", "uid"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "LogRocket",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"logrocket.io",
			"lr-ingest.com"
		],
		description: "LogRocket session replay and monitoring",
		extractors: {
			eventName: ["event", "type"],
			trackerId: ["appID", "sessionID"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Smartlook",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"smartlook.com",
			"smartlook.cloud"
		],
		description: "Smartlook visitor recordings and analytics",
		extractors: {
			eventName: ["event"],
			trackerId: ["key", "project_key"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Mouseflow",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"mouseflow.com",
			"cdn-test.mouseflow.com"
		],
		description: "Mouseflow session replay and heatmaps",
		extractors: {
			eventName: ["event"],
			trackerId: ["website_id", "session_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json"]
	},
	{
		name: "Yandex Metrica",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"mc.yandex.ru",
			"metrica.yandex.com"
		],
		description: "Yandex Metrica web analytics",
		extractors: {
			eventName: ["page-url", "event"],
			trackerId: ["browser-info", "counter-id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Baidu Analytics",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"hm.baidu.com",
			"tongji.baidu.com"
		],
		description: "Baidu web analytics",
		extractors: {
			eventName: ["et", "event"],
			trackerId: ["si", "site_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Naver Analytics",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"wcs.naver.net",
			"naver.com/wcslog"
		],
		description: "Naver web analytics (South Korea)",
		extractors: {
			eventName: ["event", "action"],
			trackerId: ["m", "wlog_id"]
		},
		dictionary: [],
		supportsRequestBody: true,
		requestBodyParsers: ["json", "form"]
	},
	{
		name: "Other Trackers",
		eventType: Events.OTHER_TRACKERS_EVENTS,
		urlPatterns: [
			"doubleclick.net",
			"googlesyndication.com", 
			"amazon-adsystem.com",
			"bing.com/msads",
			"googleadservices.com",
			"googletagservices.com",
			"google.com/pagead",
			"adsystem.amazon-adsystem.com"
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
