/**
 * EventRICH.AI API Utilities
 * 
 * This module provides functions for interacting with the EventRICH.AI API
 * according to the official API specification.
 */

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
	code: number;
	timestamp: number;
}

export interface UserCredits {
	credits: number;
	currency: string;
}

export interface UserProfile {
	user: {
		id: number;
		email: string;
		name: string;
		credits: number;
	};
}

export interface UserStats {
	total_events: number;
	events_today: number;
	events_this_week: number;
	events_this_month: number;
	last_event_date: string;
}

export interface TrackEventData {
	event_type: string;
	url: string;
	title?: string;
	referrer?: string;
	event_data?: Record<string, any>;
}

export interface TrackEventResponse {
	event_id: string;
	credits_used: number;
	remaining_credits: number;
}

/**
 * Get the stored API token from Chrome storage
 */
async function getStoredToken(): Promise<string | null> {
	try {
		const authData = await chrome.storage.local.get(['eventrich_auth']);
		if (authData.eventrich_auth?.token) {
			// Check if token is not expired (30 days)
			const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
			if (authData.eventrich_auth.timestamp && (Date.now() - authData.eventrich_auth.timestamp) < thirtyDaysInMs) {
				return authData.eventrich_auth.token;
			} else {
				// Token expired, clear storage
				await chrome.storage.local.remove(['eventrich_auth']);
				return null;
			}
		}
		return null;
	} catch (error) {
		console.error('EventRICH.AI API: Error getting stored token:', error);
		return null;
	}
}

/**
 * Make an authenticated API request to EventRICH.AI
 */
async function makeApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	const token = await getStoredToken();
	if (!token) {
		throw new Error('No valid authentication token found. Please login again.');
	}

	const response = await fetch(`https://dash.eventrich.ai/applications/google_chrome_addon/${endpoint}`, {
		...options,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			...options.headers
		}
	});

	const data = await response.json();
	
	if (!response.ok) {
		// Handle 401 errors by clearing token
		if (response.status === 401) {
			await chrome.storage.local.remove(['eventrich_auth']);
		}
		throw new Error(data.error || `API request failed with status ${response.status}`);
	}

	return data;
}

/**
 * Get current user credits
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/api.php?action=credits
 */
export async function getUserCredits(): Promise<UserCredits> {
	console.log('EventRICH.AI API: Fetching user credits');
	const response = await makeApiRequest<UserCredits>('api.php?action=credits');
	
	if (response.success && response.data) {
		console.log('EventRICH.AI API: Credits retrieved:', response.data);
		return response.data;
	} else {
		throw new Error(response.error || 'Failed to fetch credits');
	}
}

/**
 * Get user profile with credits and subscription info
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/api.php?action=profile
 */
export async function getUserProfile(): Promise<UserProfile> {
	console.log('EventRICH.AI API: Fetching user profile');
	const response = await makeApiRequest<UserProfile>('api.php?action=profile');
	
	if (response.success && response.data) {
		console.log('EventRICH.AI API: Profile retrieved:', response.data);
		return response.data;
	} else {
		throw new Error(response.error || 'Failed to fetch profile');
	}
}

/**
 * Check if user has sufficient credits
 */
export async function hasUserSufficientCredits(requiredCredits: number = 1): Promise<boolean> {
	try {
		const credits = await getUserCredits();
		return credits.credits >= requiredCredits;
	} catch (error) {
		console.error('EventRICH.AI API: Error checking credits:', error);
		return false;
	}
}

/**
 * Logout user from EventRICH.AI
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/logout.php
 */
export async function logoutUser(): Promise<void> {
	const token = await getStoredToken();
	if (!token) {
		console.log('EventRICH.AI API: No token found for logout');
		return;
	}

	try {
		// Get device ID for logout
		const storedDeviceId = await chrome.storage.local.get(['eventrich_device_id']);
		const deviceId = storedDeviceId.eventrich_device_id;

		console.log('EventRICH.AI API: Logging out user');
		const response = await fetch('https://dash.eventrich.ai/applications/google_chrome_addon/logout.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				api_token: token,
				device_id: deviceId
			}),
		});

		const data = await response.json();
		console.log('EventRICH.AI API: Logout response:', data);

		// Clear local storage regardless of API response
		await chrome.storage.local.remove(['eventrich_auth']);
		
		if (response.ok && data.success) {
			console.log('EventRICH.AI API: User logged out successfully');
		}
	} catch (error) {
		console.error('EventRICH.AI API: Logout error:', error);
		// Still clear local storage on error
		await chrome.storage.local.remove(['eventrich_auth']);
	}
}

/**
 * Get user statistics
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/api.php?action=stats
 */
export async function getUserStats(): Promise<UserStats> {
	console.log('EventRICH.AI API: Fetching user stats');
	const response = await makeApiRequest<UserStats>('api.php?action=stats');
	
	if (response.success && response.data) {
		console.log('EventRICH.AI API: Stats retrieved:', response.data);
		return response.data;
	} else {
		throw new Error(response.error || 'Failed to fetch stats');
	}
}

/**
 * Track a single event
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/api.php?action=track
 */
export async function trackEvent(eventData: TrackEventData): Promise<TrackEventResponse> {
	console.log('EventRICH.AI API: Tracking event:', eventData);
	const response = await makeApiRequest<TrackEventResponse>('api.php?action=track', {
		method: 'POST',
		body: JSON.stringify(eventData)
	});
	
	if (response.success && response.data) {
		console.log('EventRICH.AI API: Event tracked:', response.data);
		return response.data;
	} else {
		throw new Error(response.error || 'Failed to track event');
	}
}

/**
 * Track multiple events in batch
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/api.php?action=batch
 */
export async function trackBatchEvents(events: TrackEventData[]): Promise<{
	events_processed: number;
	credits_used: number;
	remaining_credits: number;
	event_ids: string[];
}> {
	console.log('EventRICH.AI API: Tracking batch events:', events.length);
	const response = await makeApiRequest<{
		events_processed: number;
		credits_used: number;
		remaining_credits: number;
		event_ids: string[];
	}>('api.php?action=batch', {
		method: 'POST',
		body: JSON.stringify({ events })
	});
	
	if (response.success && response.data) {
		console.log('EventRICH.AI API: Batch events tracked:', response.data);
		return response.data;
	} else {
		throw new Error(response.error || 'Failed to track batch events');
	}
}

/**
 * Use credits for custom operations
 * URL: https://dash.eventrich.ai/applications/google_chrome_addon/api.php?action=use_credit
 */
export async function useCredits(amount: number, reason: string): Promise<{
	used_amount: number;
	remaining_credits: number;
	reason: string;
}> {
	console.log('EventRICH.AI API: Using credits:', amount, reason);
	const response = await makeApiRequest<{
		used_amount: number;
		remaining_credits: number;
		reason: string;
	}>('api.php?action=use_credit', {
		method: 'POST',
		body: JSON.stringify({ amount, reason })
	});
	
	if (response.success && response.data) {
		console.log('EventRICH.AI API: Credits used:', response.data);
		return response.data;
	} else {
		throw new Error(response.error || 'Failed to use credits');
	}
}

/**
 * Refresh user profile data and update local storage
 */
export async function refreshUserProfile(): Promise<UserProfile | null> {
	try {
		const profile = await getUserProfile();
		
		// Update stored user data
		const authData = await chrome.storage.local.get(['eventrich_auth']);
		if (authData.eventrich_auth) {
			await chrome.storage.local.set({
				eventrich_auth: {
					...authData.eventrich_auth,
					user: profile.data.user,
					timestamp: Date.now() // Refresh timestamp
				}
			});
		}
		
		return profile;
	} catch (error) {
		console.error('EventRICH.AI API: Error refreshing profile:', error);
		return null;
	}
}

/**
 * Check if user is authenticated with a valid token
 */
export async function isUserAuthenticated(): Promise<boolean> {
	const token = await getStoredToken();
	return token !== null;
}
