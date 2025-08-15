export enum Events {
	PIXEL_EVENTS = "pixelEvents",
	GOOGLE_ANALYTICS_EVENTS = "googleAnalyticsEvents",
	GOOGLE_ADS_EVENTS = "googleAdsEvents",
	META_EVENTS = "metaEvents",
	TIKTOK_EVENTS = "tiktokEvents",
	OTHER_TRACKERS_EVENTS = "otherTrackersEvents",
	GOOGLE_TAG_MANAGER_EVENTS = "googleTagManagerEvents",
}

export const CURRENT_URL = "currentUrl";

export interface SygnalDataEventCategoryParameter {
	name: string;
	value: string;
}

export interface SygnalDataEventCategory {
	name: string;
	items: SygnalDataEventCategoryParameter[];
}

export interface SygnalDataEvent {
	name: string;
	parameters: SygnalDataEventCategory[];
	url?: string;
}

export interface SygnalDataItem {
	name: string;
	nameID: string;
	image: string;
	id: string;
	items: SygnalDataEvent[];
}

export interface DictionaryItem {
	name: string;
	items: {
		name: string;
		value: string;
	}[];
}

export interface LoginResponse {
	success: boolean;
	message?: string;
	data?: {
		user: {
			id: number;
			email: string;
			name: string;
			api_token: string;
			credits: number;
			subscription_status: {
				status: string;
				plan: string;
				expires_at: string;
			};
		};
		addon_config: {
			api_endpoint: string;
			tracking_endpoint: string;
			version: string;
			features: {
				event_tracking: boolean;
				credit_management: boolean;
				real_time_analytics: boolean;
			};
		};
	};
	timestamp: number;
}

export interface LoginRequest {
	email: string;
	password: string;
	addon_version: string;
	device_id: string;
}
