import {
	ThemeManager,
	EncryptionUtils,
	ExportManager,
	ErrorHandler,
	NotificationManager,
	PerformanceMonitor,
	RateLimiter,
	StorageManager,
	formatBytes,
	formatDuration,
	generateId,
	debounce,
	throttle
} from '../utils';
import { ThemeMode, ExportFormat, NotificationType, SygnalDataEvent } from '../types';

describe('ThemeManager', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.className = '';
	});

	test('should get default system theme', () => {
		const theme = ThemeManager.getTheme();
		expect(theme).toBe(ThemeMode.SYSTEM);
	});

	test('should set and get theme', () => {
		ThemeManager.setTheme(ThemeMode.DARK);
		expect(ThemeManager.getTheme()).toBe(ThemeMode.DARK);
		expect(localStorage.setItem).toHaveBeenCalledWith('eventrich_theme', ThemeMode.DARK);
	});

	test('should apply dark theme', () => {
		ThemeManager.applyTheme(ThemeMode.DARK);
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	test('should apply light theme', () => {
		document.documentElement.classList.add('dark');
		ThemeManager.applyTheme(ThemeMode.LIGHT);
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});
});

describe('EncryptionUtils', () => {
	test('should encrypt and decrypt data correctly', () => {
		const originalData = 'sensitive information';
		const encrypted = EncryptionUtils.encrypt(originalData);
		const decrypted = EncryptionUtils.decrypt(encrypted);
		
		expect(encrypted).not.toBe(originalData);
		expect(decrypted).toBe(originalData);
	});

	test('should handle encryption errors gracefully', () => {
		const spy = jest.spyOn(console, 'warn').mockImplementation();
		
		// Mock btoa to throw an error
		const originalBtoa = global.btoa;
		global.btoa = jest.fn(() => {
			throw new Error('Mock error');
		});

		const result = EncryptionUtils.encrypt('test');
		expect(result).toBe('test');
		expect(spy).toHaveBeenCalled();

		global.btoa = originalBtoa;
		spy.mockRestore();
	});
});

describe('ExportManager', () => {
	const mockEvents: SygnalDataEvent[] = [
		{
			name: 'test_event',
			parameters: [
				{
					name: 'test_category',
					items: [
						{ name: 'param1', value: 'value1' },
						{ name: 'param2', value: 'value2' }
					]
				}
			],
			url: 'https://example.com',
			timestamp: new Date('2024-12-18T10:00:00Z')
		}
	];

	beforeEach(() => {
		// Mock URL.createObjectURL and URL.revokeObjectURL
		global.URL.createObjectURL = jest.fn(() => 'mock-url');
		global.URL.revokeObjectURL = jest.fn();
		
		// Mock chrome.downloads.download
		(global.chrome.downloads.download as jest.Mock).mockClear();
	});

	test('should export JSON data', () => {
		ExportManager.exportData(mockEvents, ExportFormat.JSON, 'test');
		
		expect(chrome.downloads.download).toHaveBeenCalledWith({
			url: 'mock-url',
			filename: 'test.json',
			saveAs: true
		});
	});

	test('should export CSV data', () => {
		ExportManager.exportData(mockEvents, ExportFormat.CSV, 'test');
		
		expect(chrome.downloads.download).toHaveBeenCalledWith({
			url: 'mock-url',
			filename: 'test.csv',
			saveAs: true
		});
	});

	test('should export TXT data', () => {
		ExportManager.exportData(mockEvents, ExportFormat.TXT, 'test');
		
		expect(chrome.downloads.download).toHaveBeenCalledWith({
			url: 'mock-url',
			filename: 'test.txt',
			saveAs: true
		});
	});

	test('should throw error for unsupported format', () => {
		expect(() => {
			ExportManager.exportData(mockEvents, 'invalid' as ExportFormat);
		}).toThrow('Unsupported export format: invalid');
	});
});

describe('ErrorHandler', () => {
	beforeEach(() => {
		ErrorHandler.clearErrors();
		(chrome.storage.local.set as jest.Mock).mockClear();
	});

	test('should log errors', () => {
		const error = new Error('Test error');
		const errorId = ErrorHandler.logError(error, 'Test context');
		
		expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/);
		expect(ErrorHandler.getErrors()).toHaveLength(1);
		expect(chrome.storage.local.set).toHaveBeenCalled();
	});

	test('should limit stored errors to 100', () => {
		// Add 101 errors
		for (let i = 0; i < 101; i++) {
			ErrorHandler.logError(new Error(`Error ${i}`), 'Test');
		}
		
		expect(ErrorHandler.getErrors()).toHaveLength(100);
	});
});

describe('NotificationManager', () => {
	test('should add notifications', () => {
		const id = NotificationManager.addNotification({
			type: NotificationType.SUCCESS,
			title: 'Test',
			message: 'Test message'
		});
		
		expect(id).toMatch(/^notif_\d+_[a-z0-9]+$/);
		expect(NotificationManager.getNotifications()).toHaveLength(1);
	});

	test('should remove notifications', () => {
		const id = NotificationManager.addNotification({
			type: NotificationType.INFO,
			title: 'Test',
			message: 'Test message'
		});
		
		NotificationManager.removeNotification(id);
		expect(NotificationManager.getNotifications()).toHaveLength(0);
	});

	test('should auto-remove notifications', (done) => {
		NotificationManager.addNotification({
			type: NotificationType.WARNING,
			title: 'Test',
			message: 'Test message',
			autoClose: true,
			duration: 100
		});
		
		expect(NotificationManager.getNotifications()).toHaveLength(1);
		
		setTimeout(() => {
			expect(NotificationManager.getNotifications()).toHaveLength(0);
			done();
		}, 150);
	});

	test('should notify subscribers', () => {
		const listener = jest.fn();
		const unsubscribe = NotificationManager.subscribe(listener);
		
		NotificationManager.success('Test', 'Message');
		expect(listener).toHaveBeenCalled();
		
		unsubscribe();
	});
});

describe('PerformanceMonitor', () => {
	test('should measure performance', () => {
		const mockNow = jest.fn()
			.mockReturnValueOnce(100)
			.mockReturnValueOnce(200);
		
		Object.defineProperty(window, 'performance', {
			value: { now: mockNow },
			writable: true
		});
		
		PerformanceMonitor.startMeasurement('test');
		const duration = PerformanceMonitor.endMeasurement('test');
		
		expect(duration).toBe(100);
	});

	test('should measure function execution', () => {
		const mockFn = jest.fn(() => 'result');
		const spy = jest.spyOn(console, 'log').mockImplementation();
		
		const result = PerformanceMonitor.measure('test', mockFn);
		
		expect(result).toBe('result');
		expect(mockFn).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledWith(expect.stringContaining('[Performance] test:'));
		
		spy.mockRestore();
	});
});

describe('RateLimiter', () => {
	test('should allow requests within limit', () => {
		expect(RateLimiter.isAllowed('test', 5, 1000)).toBe(true);
		expect(RateLimiter.isAllowed('test', 5, 1000)).toBe(true);
	});

	test('should block requests over limit', () => {
		const key = 'test-limit';
		
		// Use up the limit
		for (let i = 0; i < 5; i++) {
			expect(RateLimiter.isAllowed(key, 5, 1000)).toBe(true);
		}
		
		// Should be blocked now
		expect(RateLimiter.isAllowed(key, 5, 1000)).toBe(false);
	});

	test('should get remaining requests', () => {
		const key = 'test-remaining';
		RateLimiter.isAllowed(key, 5, 1000);
		
		expect(RateLimiter.getRemainingRequests(key, 5)).toBe(4);
	});
});

describe('Utility Functions', () => {
	test('formatBytes should format byte values correctly', () => {
		expect(formatBytes(0)).toBe('0 Bytes');
		expect(formatBytes(1024)).toBe('1 KB');
		expect(formatBytes(1048576)).toBe('1 MB');
		expect(formatBytes(1073741824)).toBe('1 GB');
	});

	test('formatDuration should format time values correctly', () => {
		expect(formatDuration(500)).toBe('500ms');
		expect(formatDuration(1500)).toBe('1.5s');
		expect(formatDuration(65000)).toBe('1.1m');
		expect(formatDuration(3665000)).toBe('1.0h');
	});

	test('generateId should create unique IDs', () => {
		const id1 = generateId();
		const id2 = generateId();
		
		expect(id1).toMatch(/^\d+_[a-z0-9]+$/);
		expect(id2).toMatch(/^\d+_[a-z0-9]+$/);
		expect(id1).not.toBe(id2);
	});

	test('debounce should delay function execution', (done) => {
		const mockFn = jest.fn();
		const debouncedFn = debounce(mockFn, 100);
		
		debouncedFn();
		debouncedFn();
		debouncedFn();
		
		expect(mockFn).not.toHaveBeenCalled();
		
		setTimeout(() => {
			expect(mockFn).toHaveBeenCalledTimes(1);
			done();
		}, 150);
	});

	test('throttle should limit function calls', () => {
		const mockFn = jest.fn();
		const throttledFn = throttle(mockFn, 100);
		
		throttledFn();
		throttledFn();
		throttledFn();
		
		expect(mockFn).toHaveBeenCalledTimes(1);
	});
});




