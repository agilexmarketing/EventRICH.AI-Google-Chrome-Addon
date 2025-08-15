import { createRoot } from "react-dom/client";
import "./styles/global.css";
import Popup from "./components/Popup";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeManager, ErrorHandler, AuditLogger } from "./utils";

// Initialize theme and utilities before mounting
const initialize = async () => {
	try {
		// Initialize theme system
		await ThemeManager.initializeTheme();
		
		// Initialize error handling and audit logging
		await ErrorHandler.initializeFromStorage();
		await AuditLogger.initializeFromStorage();
		
		// Log addon startup
		AuditLogger.log('addon_started', { 
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			version: chrome?.runtime?.getManifest?.()?.version || 'unknown'
		});
		
		// Mount the React app into the root div
		const container = document.getElementById("root");
		if (container) {
			console.log('EventRICH.AI: Root container found, creating React root...');
			const root = createRoot(container);
			console.log('EventRICH.AI: React root created, rendering components...');
			
			// Test with minimal component first
			root.render(
				<ErrorBoundary>
					<div style={{ padding: '20px', minHeight: '200px', backgroundColor: '#f0f0f0' }}>
						<h1>EventRICH.AI Test</h1>
						<p>If you see this, React is working!</p>
						<Popup />
					</div>
				</ErrorBoundary>
			);
			console.log('EventRICH.AI: React render called');
		} else {
			throw new Error('Root container not found');
		}
	} catch (error) {
		console.error('Failed to initialize EventRICH.AI popup:', error);
		ErrorHandler.logError(error as Error, 'Popup initialization');
		
		// Fallback UI
		document.body.innerHTML = `
			<div style="padding: 20px; text-align: center; font-family: system-ui;">
				<h2 style="color: #ef4444;">Failed to load EventRICH.AI</h2>
				<p style="color: #6b7280;">Please try refreshing or contact support if the issue persists.</p>
				<button onclick="window.location.reload()" style="
					background: #3b82f6; 
					color: white; 
					border: none; 
					padding: 8px 16px; 
					border-radius: 6px; 
					cursor: pointer;
					margin-top: 10px;
				">
					Refresh
				</button>
			</div>
		`;
	}
};

// Initialize the popup with debug logging
console.log('EventRICH.AI: Starting popup initialization...');
initialize().then(() => {
	console.log('EventRICH.AI: Popup initialization completed');
}).catch((error) => {
	console.error('EventRICH.AI: Popup initialization failed:', error);
});
