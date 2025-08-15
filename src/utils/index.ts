import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
	SygnalDataEvent, 
	ExportFormat, 
	ThemeMode, 
	ErrorInfo, 
	AuditLogEntry,
	UserSettings,
	NotificationType,
	Notification
} from "../types";

// Re-export types for convenience
export { 
	ExportFormat, 
	ThemeMode, 
	NotificationType,
	type SygnalDataEvent,
	type ErrorInfo,
	type AuditLogEntry,
	type UserSettings,
	type Notification
} from "../types";

// Existing utility function
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Theme management
export class ThemeManager {
	static getTheme(): ThemeMode {
		// For Chrome extensions, we need to use async storage, but provide sync fallback
		return ThemeMode.SYSTEM;
	}

	static async getThemeAsync(): Promise<ThemeMode> {
		return new Promise((resolve) => {
			chrome.storage.local.get(['eventrich_theme'], (result) => {
				const stored = result.eventrich_theme;
				if (stored && Object.values(ThemeMode).includes(stored as ThemeMode)) {
					resolve(stored as ThemeMode);
				} else {
					resolve(ThemeMode.SYSTEM);
				}
			});
		});
	}

	static async setTheme(theme: ThemeMode): Promise<void> {
		console.log('[ThemeManager] Setting theme to:', theme);
		return new Promise((resolve) => {
			chrome.storage.local.set({ eventrich_theme: theme }, () => {
				console.log('[ThemeManager] Theme saved to storage');
				this.applyTheme(theme);
				resolve();
			});
		});
	}

	static applyTheme(theme: ThemeMode): void {
		console.log('[ThemeManager] Applying theme:', theme);
		const root = document.documentElement;
		
		if (theme === ThemeMode.SYSTEM) {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			console.log('[ThemeManager] System theme prefers dark:', prefersDark);
			theme = prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT;
		}
		
		console.log('[ThemeManager] Final theme to apply:', theme);
		console.log('[ThemeManager] Root element classes before:', root.className);
		
		if (theme === ThemeMode.DARK) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
		
		console.log('[ThemeManager] Root element classes after:', root.className);
	}

	static async initializeTheme(): Promise<void> {
		const theme = await this.getThemeAsync();
		this.applyTheme(theme);
		
		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
			const currentTheme = await this.getThemeAsync();
			if (currentTheme === ThemeMode.SYSTEM) {
				this.applyTheme(ThemeMode.SYSTEM);
			}
		});
	}
}

// Data encryption utilities
export class EncryptionUtils {
	private static key: string = 'eventrich_encryption_key_v1';

	static encrypt(data: string): string {
		try {
			// Simple XOR encryption for basic data protection
			let encrypted = '';
			for (let i = 0; i < data.length; i++) {
				encrypted += String.fromCharCode(
					data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
				);
			}
			return btoa(encrypted);
		} catch (error) {
			console.warn('Encryption failed, storing as plain text');
			return data;
		}
	}

	static decrypt(encryptedData: string): string {
		try {
			const data = atob(encryptedData);
			let decrypted = '';
			for (let i = 0; i < data.length; i++) {
				decrypted += String.fromCharCode(
					data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
				);
			}
			return decrypted;
		} catch (error) {
			console.warn('Decryption failed, returning original data');
			return encryptedData;
		}
	}
}

// Export utilities
export class ExportManager {
	static exportData(data: SygnalDataEvent[], format: ExportFormat, filename?: string): void {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const defaultFilename = `eventrich-data-${timestamp}`;
		
		let content: string;
		let mimeType: string;
		let extension: string;

		switch (format) {
			case ExportFormat.JSON:
				content = JSON.stringify(data, null, 2);
				mimeType = 'application/json';
				extension = 'json';
				break;
			case ExportFormat.CSV:
				content = this.convertToCSV(data);
				mimeType = 'text/csv';
				extension = 'csv';
				break;
			case ExportFormat.TXT:
				content = this.convertToText(data);
				mimeType = 'text/plain';
				extension = 'txt';
				break;
			default:
				throw new Error(`Unsupported export format: ${format}`);
		}

		this.downloadFile(content, mimeType, `${filename || defaultFilename}.${extension}`);
	}

	private static convertToCSV(data: SygnalDataEvent[]): string {
		const headers = ['Event Name', 'URL', 'Timestamp', 'Parameters'];
		const rows = data.map(event => [
			event.name,
			event.url || '',
			event.timestamp?.toISOString() || '',
			JSON.stringify(event.parameters)
		]);

		return [headers, ...rows]
			.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
			.join('\n');
	}

	private static convertToText(data: SygnalDataEvent[]): string {
		return data.map(event => {
			let text = `Event: ${event.name}\n`;
			if (event.url) text += `URL: ${event.url}\n`;
			if (event.timestamp) text += `Timestamp: ${event.timestamp.toISOString()}\n`;
			text += 'Parameters:\n';
			event.parameters.forEach(category => {
				text += `  ${category.name}:\n`;
				category.items.forEach(item => {
					text += `    ${item.name}: ${item.value}\n`;
				});
			});
			return text + '\n';
		}).join('---\n');
	}

	private static downloadFile(content: string, mimeType: string, filename: string): void {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		
		// Use Chrome downloads API if available
		if (chrome?.downloads) {
			chrome.downloads.download({
				url: url,
				filename: filename,
				saveAs: true
			});
		} else {
			// Fallback for regular web pages
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
		
		// Clean up the blob URL
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
}

// Error handling utilities
export class ErrorHandler {
	private static errors: ErrorInfo[] = [];

	static logError(error: Error, context: string, url?: string): string {
		const errorInfo: ErrorInfo = {
			id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			error: error,
			context: context,
			userAgent: navigator.userAgent,
			url: url || window.location.href,
			stack: error.stack
		};

		this.errors.push(errorInfo);
		
		// Keep only last 100 errors
		if (this.errors.length > 100) {
			this.errors = this.errors.slice(-100);
		}

		// Store in chrome storage
		chrome.storage.local.set({ 
			eventrich_errors: this.errors 
		});

		console.error(`[EventRICH.AI] ${context}:`, error);
		return errorInfo.id;
	}

	static getErrors(): ErrorInfo[] {
		return [...this.errors];
	}

	static clearErrors(): void {
		this.errors = [];
		chrome.storage.local.remove(['eventrich_errors']);
	}

	static async initializeFromStorage(): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.get(['eventrich_errors'], (result) => {
				if (result.eventrich_errors) {
					this.errors = result.eventrich_errors;
				}
				resolve();
			});
		});
	}
}

// Audit logging
export class AuditLogger {
	private static logs: AuditLogEntry[] = [];

	static log(action: string, details: any, userId?: string): void {
		const entry: AuditLogEntry = {
			id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			action: action,
			userId: userId,
			details: details
		};

		this.logs.push(entry);
		
		// Keep only last 500 entries
		if (this.logs.length > 500) {
			this.logs = this.logs.slice(-500);
		}

		// Store in chrome storage
		chrome.storage.local.set({
			eventrich_audit: this.logs
		});
	}

	static getLogs(): AuditLogEntry[] {
		return [...this.logs];
	}

	static clearLogs(): void {
		this.logs = [];
		chrome.storage.local.remove(['eventrich_audit']);
	}

	static async initializeFromStorage(): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.get(['eventrich_audit'], (result) => {
				if (result.eventrich_audit) {
					this.logs = result.eventrich_audit;
				}
				resolve();
			});
		});
	}
}

// Notification manager
export class NotificationManager {
	private static notifications: Notification[] = [];
	private static listeners: Array<(notifications: Notification[]) => void> = [];

	static addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
		const fullNotification: Notification = {
			...notification,
			id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date()
		};

		this.notifications.push(fullNotification);
		this.notifyListeners();

		// Auto-remove if specified
		if (fullNotification.autoClose !== false) {
			const duration = fullNotification.duration || 5000;
			setTimeout(() => {
				this.removeNotification(fullNotification.id);
			}, duration);
		}

		return fullNotification.id;
	}

	static removeNotification(id: string): void {
		this.notifications = this.notifications.filter(n => n.id !== id);
		this.notifyListeners();
	}

	static getNotifications(): Notification[] {
		return [...this.notifications];
	}

	static subscribe(listener: (notifications: Notification[]) => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	private static notifyListeners(): void {
		this.listeners.forEach(listener => listener([...this.notifications]));
	}

	static success(title: string, message: string): string {
		return this.addNotification({
			type: NotificationType.SUCCESS,
			title,
			message
		});
	}

	static error(title: string, message: string): string {
		return this.addNotification({
			type: NotificationType.ERROR,
			title,
			message,
			autoClose: false
		});
	}

	static warning(title: string, message: string): string {
		return this.addNotification({
			type: NotificationType.WARNING,
			title,
			message
		});
	}

	static info(title: string, message: string): string {
		return this.addNotification({
			type: NotificationType.INFO,
			title,
			message
		});
	}
}

// Performance monitoring
export class PerformanceMonitor {
	private static measurements: Map<string, number> = new Map();

	static startMeasurement(label: string): void {
		this.measurements.set(label, performance.now());
	}

	static endMeasurement(label: string): number {
		const start = this.measurements.get(label);
		if (!start) {
			// Silently return 0 for measurements that weren't started
			return 0;
		}
		
		const duration = performance.now() - start;
		this.measurements.delete(label);
		return duration;
	}

	static measure<T>(label: string, fn: () => T): T {
		this.startMeasurement(label);
		try {
			const result = fn();
			return result;
		} finally {
			const duration = this.endMeasurement(label);
			console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
		}
	}

	static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
		this.startMeasurement(label);
		try {
			const result = await fn();
			return result;
		} finally {
			const duration = this.endMeasurement(label);
			console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
		}
	}
}

// Rate limiting
export class RateLimiter {
	private static limits: Map<string, { count: number; resetTime: number }> = new Map();

	static isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
		const now = Date.now();
		const limit = this.limits.get(key);

		if (!limit || now > limit.resetTime) {
			this.limits.set(key, { count: 1, resetTime: now + windowMs });
			return true;
		}

		if (limit.count >= maxRequests) {
			return false;
		}

		limit.count++;
		return true;
	}

	static getRemainingRequests(key: string, maxRequests: number): number {
		const limit = this.limits.get(key);
		if (!limit) return maxRequests;
		return Math.max(0, maxRequests - limit.count);
	}

	static getResetTime(key: string): number | null {
		const limit = this.limits.get(key);
		return limit ? limit.resetTime : null;
	}
}

// Storage utilities
export class StorageManager {
	static async getSettings(): Promise<UserSettings> {
		return new Promise((resolve) => {
			chrome.storage.local.get(['eventrich_settings'], (result) => {
				const defaultSettings: UserSettings = {
					theme: ThemeMode.SYSTEM,
					autoExport: false,
					notifications: true,
					debugMode: false,
					maxStoredEvents: 1000,
					exportFormat: ExportFormat.JSON,
					filters: {},
					keyboardShortcuts: true
				};
				
				resolve({ ...defaultSettings, ...result.eventrich_settings });
			});
		});
	}

	static async saveSettings(settings: Partial<UserSettings>): Promise<void> {
		const currentSettings = await this.getSettings();
		const newSettings = { ...currentSettings, ...settings };
		
		return new Promise((resolve) => {
			chrome.storage.local.set({ 
				eventrich_settings: newSettings 
			}, () => {
				resolve();
			});
		});
	}

	static async clearAllData(): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.clear(() => {
				resolve();
			});
		});
	}
}

// Utility functions
export const generateId = (): string => {
	return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
	if (ms < 1000) return `${ms.toFixed(0)}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
	return `${(ms / 3600000).toFixed(1)}h`;
};

export const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return text.substr(0, maxLength - 3) + '...';
};

export const debounce = <T extends (...args: any[]) => void>(
	func: T,
	delay: number
): ((...args: Parameters<T>) => void) => {
	let timeoutId: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
};

export const throttle = <T extends (...args: any[]) => void>(
	func: T,
	delay: number
): ((...args: Parameters<T>) => void) => {
	let lastCall = 0;
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= delay) {
			lastCall = now;
			func(...args);
		}
	};
};
