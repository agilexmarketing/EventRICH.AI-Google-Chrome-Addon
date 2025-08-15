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
		subscription_status: {
			status: string;
			plan: string;
			expires_at: string;
		};
	};
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
					subscription_status: profile.data.user.subscription_status,
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
