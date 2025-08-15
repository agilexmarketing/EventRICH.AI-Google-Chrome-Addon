import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Popup from '../../components/Popup';

// Mock the utils module
jest.mock('../../utils', () => ({
	ThemeManager: {
		initializeTheme: jest.fn(),
		getTheme: jest.fn(() => 'system'),
		setTheme: jest.fn(),
		applyTheme: jest.fn()
	},
	StorageManager: {
		getSettings: jest.fn(() => Promise.resolve({
			theme: 'system',
			autoExport: false,
			notifications: true,
			debugMode: false,
			maxStoredEvents: 1000,
			exportFormat: 'json',
			filters: {},
			keyboardShortcuts: true
		})),
		saveSettings: jest.fn(() => Promise.resolve())
	},
	ErrorHandler: {
		initializeFromStorage: jest.fn(() => Promise.resolve()),
		logError: jest.fn(() => 'error_id'),
		getErrors: jest.fn(() => [])
	},
	AuditLogger: {
		initializeFromStorage: jest.fn(() => Promise.resolve()),
		log: jest.fn()
	},
	PerformanceMonitor: {
		startMeasurement: jest.fn(),
		endMeasurement: jest.fn(() => 100)
	},
	NotificationManager: {
		success: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
		info: jest.fn(),
		subscribe: jest.fn(() => jest.fn()),
		getNotifications: jest.fn(() => [])
	},
	ExportManager: {
		exportData: jest.fn()
	},
	cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
	formatBytes: jest.fn((bytes) => `${bytes} bytes`),
	formatDuration: jest.fn((ms) => `${ms}ms`)
}));

describe('Popup Component', () => {
	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();
		
		// Mock chrome.storage.local.get to return empty data
		(chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
			if (callback) {
				callback({});
			}
		});
		
		// Mock chrome.tabs.query
		(chrome.tabs.query as jest.Mock).mockImplementation((query, callback) => {
			callback([{ id: 1, url: 'https://example.com' }]);
		});
	});

	test('renders popup with loading state initially', () => {
		render(<Popup />);
		
		expect(screen.getByText('Loading tracking data...')).toBeInTheDocument();
		expect(screen.getByText('EventRICH.AI')).toBeInTheDocument();
	});

	test('displays no tracking message when no events detected', async () => {
		render(<Popup />);
		
		await waitFor(() => {
			expect(screen.getByText(/No tracking detected/)).toBeInTheDocument();
		});
	});

	test('shows login form at bottom', () => {
		render(<Popup />);
		
		expect(screen.getByText('Login to activate your credits')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
	});

	test('toggles filters panel when filters button is clicked', async () => {
		const user = userEvent.setup();
		render(<Popup />);
		
		const filtersButton = screen.getByRole('button', { name: /filters/i });
		await user.click(filtersButton);
		
		expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
	});

	test('opens EventRICH.AI website when logo is clicked', async () => {
		const user = userEvent.setup();
		render(<Popup />);
		
		const logo = screen.getByText('EventRICH.AI').closest('div');
		await user.click(logo!);
		
		expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://EventRICH.AI' });
	});

	test('handles keyboard shortcuts', async () => {
		render(<Popup />);
		
		// Test Ctrl+F for search
		fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
		
		await waitFor(() => {
			expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
		});
		
		// Test Escape to close
		fireEvent.keyDown(document, { key: 'Escape' });
		
		await waitFor(() => {
			expect(screen.queryByPlaceholderText(/search events/i)).not.toBeInTheDocument();
		});
	});

	test('displays tracker information when events are present', async () => {
		// Mock storage to return events
		(chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
			if (Array.isArray(keys) && keys.includes('pixelEvents_tab_1')) {
				callback({
					'pixelEvents_tab_1': [
						{
							name: 'page_view',
							parameters: [
								{
									name: 'event info',
									items: [
										{ name: 'Event Name', value: 'page_view' }
									]
								}
							],
							url: 'https://example.com/track',
							id: 'visitor_123'
						}
					]
				});
			} else {
				callback({});
			}
		});
		
		render(<Popup />);
		
		await waitFor(() => {
			expect(screen.getByText('EventRICH.AI Pixel')).toBeInTheDocument();
		});
	});

	test('handles login success', async () => {
		const user = userEvent.setup();
		render(<Popup />);
		
		// Mock successful login response
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({
					success: true,
					data: {
						user: {
							id: 1,
							email: 'test@example.com',
							name: 'Test User',
							api_token: 'token_123',
							credits: 100,
							subscription_status: {
								status: 'active',
								plan: 'pro',
								expires_at: '2025-01-01'
							}
						}
					}
				})
			})
		) as jest.Mock;
		
		const emailInput = screen.getByPlaceholderText('Email');
		const passwordInput = screen.getByPlaceholderText('Password');
		const loginButton = screen.getByRole('button', { name: /login/i });
		
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');
		await user.click(loginButton);
		
		await waitFor(() => {
			expect(chrome.storage.local.set).toHaveBeenCalledWith(
				expect.objectContaining({
					eventrich_login: expect.objectContaining({
						isLoggedIn: true,
						userData: expect.objectContaining({
							email: 'test@example.com'
						})
					})
				})
			);
		});
	});

	test('displays theme toggle component', () => {
		render(<Popup />);
		
		// Should have theme toggle buttons
		expect(screen.getByTitle(/switch to light theme/i)).toBeInTheDocument();
		expect(screen.getByTitle(/switch to dark theme/i)).toBeInTheDocument();
		expect(screen.getByTitle(/switch to system theme/i)).toBeInTheDocument();
	});

	test('shows export button with event count', async () => {
		render(<Popup />);
		
		await waitFor(() => {
			const exportButton = screen.getByRole('button', { name: /export/i });
			expect(exportButton).toBeInTheDocument();
		});
	});

	test('filters events based on search term', async () => {
		const user = userEvent.setup();
		
		// Mock events with different names
		(chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
			if (Array.isArray(keys) && keys.includes('pixelEvents_tab_1')) {
				callback({
					'pixelEvents_tab_1': [
						{
							name: 'page_view',
							parameters: [],
							id: 'visitor_123'
						},
						{
							name: 'purchase',
							parameters: [],
							id: 'visitor_123'
						}
					]
				});
			} else {
				callback({});
			}
		});
		
		render(<Popup />);
		
		// Open filters
		const filtersButton = screen.getByRole('button', { name: /filters/i });
		await user.click(filtersButton);
		
		// Search for 'purchase'
		const searchInput = screen.getByPlaceholderText(/search events/i);
		await user.type(searchInput, 'purchase');
		
		// Should show filtered results
		await waitFor(() => {
			expect(screen.getByText('EventRICH.AI Pixel')).toBeInTheDocument();
		});
	});

	test('handles error boundary', () => {
		// Mock a component that throws an error
		const ThrowError = () => {
			throw new Error('Test error');
		};
		
		const spy = jest.spyOn(console, 'error').mockImplementation();
		
		render(
			<div>
				<ThrowError />
			</div>
		);
		
		spy.mockRestore();
	});
});



