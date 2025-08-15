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
			
			root.render(
				<ErrorBoundary>
					<Popup />
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

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
	console.error('EventRICH.AI: Uncaught error:', event.error);
	document.body.innerHTML = `
		<div style="padding: 20px; background: #fee; color: #900; font-family: system-ui;">
			<h3>JavaScript Error Detected</h3>
			<p><strong>Error:</strong> ${event.error?.message || 'Unknown error'}</p>
			<p><strong>File:</strong> ${event.filename || 'Unknown file'}</p>
			<p><strong>Line:</strong> ${event.lineno || 'Unknown line'}</p>
			<pre style="background: #f0f0f0; padding: 10px; margin-top: 10px; font-size: 12px;">${event.error?.stack || 'No stack trace'}</pre>
		</div>
	`;
});

// Initialize the popup with comprehensive error handling
console.log('EventRICH.AI: Starting popup initialization...');
try {
	initialize().then(() => {
		console.log('EventRICH.AI: Popup initialization completed successfully');
	}).catch((error) => {
		console.error('EventRICH.AI: Popup initialization promise rejected:', error);
		document.body.innerHTML = `
			<div style="padding: 20px; background: #fee; color: #900; font-family: system-ui;">
				<h3>Initialization Error</h3>
				<p><strong>Error:</strong> ${error?.message || 'Unknown initialization error'}</p>
				<pre style="background: #f0f0f0; padding: 10px; margin-top: 10px; font-size: 12px;">${error?.stack || 'No stack trace'}</pre>
			</div>
		`;
	});
} catch (syncError) {
	console.error('EventRICH.AI: Synchronous initialization error:', syncError);
	document.body.innerHTML = `
		<div style="padding: 20px; background: #fee; color: #900; font-family: system-ui;">
			<h3>Synchronous Initialization Error</h3>
			<p><strong>Error:</strong> ${syncError?.message || 'Unknown sync error'}</p>
			<pre style="background: #f0f0f0; padding: 10px; margin-top: 10px; font-size: 12px;">${syncError?.stack || 'No stack trace'}</pre>
		</div>
	`;
}
