import '@testing-library/jest-dom';
import 'jest-chrome';

// Mock Chrome API
global.chrome = {
	storage: {
		local: {
			get: jest.fn((keys, callback) => {
				if (typeof keys === 'function') {
					keys({});
				} else if (callback) {
					callback({});
				}
				return Promise.resolve({});
			}),
			set: jest.fn((items, callback) => {
				if (callback) callback();
				return Promise.resolve();
			}),
			remove: jest.fn((keys, callback) => {
				if (callback) callback();
				return Promise.resolve();
			}),
			clear: jest.fn((callback) => {
				if (callback) callback();
				return Promise.resolve();
			})
		}
	},
	tabs: {
		query: jest.fn((queryInfo, callback) => {
			callback([{ id: 1, url: 'https://example.com', active: true }]);
		}),
		create: jest.fn((createProperties, callback) => {
			if (callback) callback({ id: 2 });
		})
	},
	runtime: {
		getManifest: jest.fn(() => ({
			version: '2.1.0',
			name: 'EventRICH.AI Test'
		}))
	},
	downloads: {
		download: jest.fn((options, callback) => {
			if (callback) callback(1);
		})
	}
} as any;

// Mock window.chrome for components
Object.defineProperty(window, 'chrome', {
	value: global.chrome,
	writable: true
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
	value: {
		writeText: jest.fn(() => Promise.resolve()),
		readText: jest.fn(() => Promise.resolve(''))
	},
	writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
	value: {
		now: jest.fn(() => Date.now()),
		mark: jest.fn(),
		measure: jest.fn()
	},
	writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	value: jest.fn().mockImplementation(query => ({
		matches: query.includes('dark'),
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
	writable: true
});

// Mock localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Silence console errors in tests unless debugging
if (!process.env.DEBUG_TESTS) {
	const originalError = console.error;
	beforeAll(() => {
		console.error = (...args: any[]) => {
			if (
				typeof args[0] === 'string' &&
				args[0].includes('Warning: ReactDOM.render is deprecated')
			) {
				return;
			}
			originalError.call(console, ...args);
		};
	});

	afterAll(() => {
		console.error = originalError;
	});
}




