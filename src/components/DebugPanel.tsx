import { Bug, Code, Clock, Eye, EyeOff, Copy, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { SygnalDataEvent, ErrorHandler, AuditLogger, NotificationManager } from "../utils";

interface DebugPanelProps {
	events: SygnalDataEvent[];
	className?: string;
}

export default function DebugPanel({ events, className }: DebugPanelProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'events' | 'errors' | 'audit'>('events');
	const [errors, setErrors] = useState(ErrorHandler.getErrors());
	const [auditLogs, setAuditLogs] = useState(AuditLogger.getLogs());
	const [showRawData, setShowRawData] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setErrors(ErrorHandler.getErrors());
			setAuditLogs(AuditLogger.getLogs());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			NotificationManager.success("Copied", "Debug data copied to clipboard");
		}).catch(() => {
			NotificationManager.error("Copy Failed", "Could not copy to clipboard");
		});
	};

	const exportDebugData = () => {
		const debugData = {
			timestamp: new Date().toISOString(),
			events: events,
			errors: errors,
			auditLogs: auditLogs,
			userAgent: navigator.userAgent,
			url: window.location.href
		};

		const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `eventrich-debug-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		NotificationManager.success("Debug Export", "Debug data exported successfully");
	};

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className={`
					fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 
					text-white rounded-lg shadow-lg transition-colors duration-200 z-40
					${className}
				`}
				title="Open Debug Panel"
			>
				<Bug className="h-4 w-4" />
				<span className="text-sm">Debug</span>
				{errors.length > 0 && (
					<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
						{errors.length}
					</span>
				)}
			</button>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<Bug className="h-5 w-5 text-gray-600 dark:text-gray-400" />
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							Debug Panel
						</h2>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={exportDebugData}
							className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							title="Export debug data"
						>
							<Download className="h-4 w-4" />
							Export
						</button>
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
						>
							<EyeOff className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200 dark:border-gray-700">
					{[
						{ id: 'events', label: 'Events', count: events.length },
						{ id: 'errors', label: 'Errors', count: errors.length },
						{ id: 'audit', label: 'Audit', count: auditLogs.length }
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
							className={`
								flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
								${activeTab === tab.id
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
								}
							`}
						>
							{tab.label}
							{tab.count > 0 && (
								<span className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">
									{tab.count}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Content */}
				<div className="flex-1 overflow-hidden flex flex-col">
					{activeTab === 'events' && (
						<div className="flex-1 overflow-auto p-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-medium text-gray-900 dark:text-white">
									Tracked Events ({events.length})
								</h3>
								<button
									onClick={() => setShowRawData(!showRawData)}
									className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
								>
									{showRawData ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
									{showRawData ? 'Hide' : 'Show'} Raw Data
								</button>
							</div>
							<div className="space-y-3">
								{events.map((event, index) => (
									<div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-medium text-gray-900 dark:text-white">
												{event.name}
											</h4>
											<button
												onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}
												className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
												title="Copy event data"
											>
												<Copy className="h-4 w-4" />
											</button>
										</div>
										{event.timestamp && (
											<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
												<Clock className="inline h-3 w-3 mr-1" />
												{event.timestamp.toLocaleString()}
											</p>
										)}
										{event.url && (
											<p className="text-xs text-gray-600 dark:text-gray-300 mb-2 break-all">
												URL: {event.url}
											</p>
										)}
										{showRawData && event.rawData && (
											<pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
												{JSON.stringify(event.rawData, null, 2)}
											</pre>
										)}
									</div>
								))}
								{events.length === 0 && (
									<p className="text-center text-gray-500 dark:text-gray-400 py-8">
										No events captured yet
									</p>
								)}
							</div>
						</div>
					)}

					{activeTab === 'errors' && (
						<div className="flex-1 overflow-auto p-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-medium text-gray-900 dark:text-white">
									Error Log ({errors.length})
								</h3>
								<button
									onClick={() => ErrorHandler.clearErrors()}
									className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
								>
									Clear All
								</button>
							</div>
							<div className="space-y-3">
								{errors.map((error) => (
									<div key={error.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-medium text-red-900 dark:text-red-100">
												{error.context}
											</h4>
											<button
												onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}
												className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
												title="Copy error data"
											>
												<Copy className="h-4 w-4" />
											</button>
										</div>
										<p className="text-xs text-red-700 dark:text-red-300 mb-2">
											<Clock className="inline h-3 w-3 mr-1" />
											{error.timestamp.toLocaleString()}
										</p>
										<p className="text-sm text-red-800 dark:text-red-200 mb-2">
											{error.error.message}
										</p>
										{error.stack && (
											<pre className="text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto max-h-32 text-red-700 dark:text-red-300">
												{error.stack}
											</pre>
										)}
									</div>
								))}
								{errors.length === 0 && (
									<p className="text-center text-gray-500 dark:text-gray-400 py-8">
										No errors logged
									</p>
								)}
							</div>
						</div>
					)}

					{activeTab === 'audit' && (
						<div className="flex-1 overflow-auto p-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-medium text-gray-900 dark:text-white">
									Audit Log ({auditLogs.length})
								</h3>
								<button
									onClick={() => AuditLogger.clearLogs()}
									className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								>
									Clear All
								</button>
							</div>
							<div className="space-y-2">
								{auditLogs.slice().reverse().map((log) => (
									<div key={log.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
										<div className="flex items-center justify-between mb-1">
											<span className="font-medium text-gray-900 dark:text-white text-sm">
												{log.action}
											</span>
											<span className="text-xs text-gray-500 dark:text-gray-400">
												{log.timestamp.toLocaleString()}
											</span>
										</div>
										{log.details && (
											<pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-20">
												{JSON.stringify(log.details, null, 2)}
											</pre>
										)}
									</div>
								))}
								{auditLogs.length === 0 && (
									<p className="text-center text-gray-500 dark:text-gray-400 py-8">
										No audit logs
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}




