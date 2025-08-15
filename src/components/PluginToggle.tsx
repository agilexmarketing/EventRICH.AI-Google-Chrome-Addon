import React, { useState, useEffect } from "react";
import { Power } from "lucide-react";
import { PLUGIN_ENABLED_KEY } from "../types";

interface PluginToggleProps {
	onToggle?: (enabled: boolean) => void;
	className?: string;
}

export const PluginToggle: React.FC<PluginToggleProps> = ({ onToggle, className = "" }) => {
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Load initial state from storage
	useEffect(() => {
		const loadPluginState = async () => {
			try {
				const result = await chrome.storage.local.get([PLUGIN_ENABLED_KEY]);
				const enabled = result[PLUGIN_ENABLED_KEY] !== false; // Default to true if not set
				setIsEnabled(enabled);
				setIsLoading(false);
			} catch (error) {
				console.error("Failed to load plugin state:", error);
				setIsEnabled(true); // Default to enabled
				setIsLoading(false);
			}
		};

		loadPluginState();
	}, []);

	// Handle toggle
	const handleToggle = async () => {
		if (isLoading) return;

		const newState = !isEnabled;
		setIsEnabled(newState);

		try {
			// Save to storage
			await chrome.storage.local.set({ [PLUGIN_ENABLED_KEY]: newState });
			
			// Notify parent component
			onToggle?.(newState);

			// Send message to background script to update tracking state
			if (chrome.runtime?.sendMessage) {
				chrome.runtime.sendMessage({
					action: "updatePluginState",
					enabled: newState
				});
			}
		} catch (error) {
			console.error("Failed to save plugin state:", error);
			// Revert state on error
			setIsEnabled(!newState);
		}
	};

	if (isLoading) {
		return (
			<div className={`flex items-center justify-center ${className}`}>
				<div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<button
			onClick={handleToggle}
			className={`
				relative inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-in-out
				${isEnabled 
					? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50" 
					: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50"
				}
				${className}
			`}
			title={isEnabled ? "Click to disable EventRICH.AI tracking" : "Click to enable EventRICH.AI tracking"}
		>
			{/* Toggle Switch */}
			<div className={`
				relative w-12 h-6 rounded-full transition-colors duration-300
				${isEnabled ? "bg-green-500" : "bg-red-500"}
			`}>
				<div className={`
					absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out
					${isEnabled ? "translate-x-6" : "translate-x-0.5"}
				`} />
			</div>

			{/* Power Icon */}
			<Power className={`
				h-4 w-4 transition-colors duration-300
				${isEnabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
			`} />

			{/* Status Text */}
			<span className="text-sm font-medium">
				{isEnabled ? "Enabled" : "Disabled"}
			</span>
		</button>
	);
};

export default PluginToggle;
