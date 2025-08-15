import { BarChart3, TrendingUp, Clock, Zap, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { SygnalDataEvent, SygnalDataItem, AnalyticsData, formatDuration, formatBytes } from "../utils";

interface AnalyticsDashboardProps {
	allTrackers: SygnalDataItem[];
	className?: string;
}

export default function AnalyticsDashboard({ allTrackers, className }: AnalyticsDashboardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

	const analytics = useMemo(() => {
		const now = new Date();
		const timeRangeMs = {
			'1h': 60 * 60 * 1000,
			'24h': 24 * 60 * 60 * 1000,
			'7d': 7 * 24 * 60 * 60 * 1000
		}[timeRange];

		const cutoffTime = new Date(now.getTime() - timeRangeMs);

		// Collect all events from all trackers
		const allEvents: SygnalDataEvent[] = allTrackers.flatMap(tracker => 
			tracker.items.filter(event => 
				!event.timestamp || event.timestamp >= cutoffTime
			)
		);

		// Calculate analytics
		const totalEvents = allEvents.length;
		const uniqueTrackers = allTrackers.filter(tracker => tracker.items.length > 0).length;
		
		// Top events
		const eventCounts = new Map<string, { count: number; tracker: string }>();
		allEvents.forEach(event => {
			const tracker = allTrackers.find(t => t.items.includes(event));
			const key = `${event.name}`;
			const current = eventCounts.get(key) || { count: 0, tracker: tracker?.name || 'Unknown' };
			eventCounts.set(key, { ...current, count: current.count + 1 });
		});

		const topEvents = Array.from(eventCounts.entries())
			.map(([name, data]) => ({ name, ...data }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Performance metrics
		const eventsWithPerformance = allEvents.filter(e => e.performance?.loadTime);
		const averageLoadTime = eventsWithPerformance.length > 0
			? eventsWithPerformance.reduce((sum, e) => sum + (e.performance?.loadTime || 0), 0) / eventsWithPerformance.length
			: 0;

		const totalDataTransferred = allEvents.reduce((sum, e) => sum + (e.performance?.size || 0), 0);
		
		// Error rate calculation (simplified)
		const errorEvents = allEvents.filter(e => e.name.toLowerCase().includes('error') || e.url?.includes('error'));
		const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;

		// Timeline data
		const timeline = allEvents
			.filter(e => e.timestamp)
			.map(e => ({
				timestamp: e.timestamp!,
				event: e.name,
				tracker: allTrackers.find(t => t.items.includes(e))?.name || 'Unknown',
				success: !e.name.toLowerCase().includes('error')
			}))
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		return {
			totalEvents,
			uniqueTrackers,
			sessionDuration: timeRangeMs,
			topEvents,
			performanceMetrics: {
				averageLoadTime,
				totalDataTransferred,
				errorRate
			},
			timeline
		} as AnalyticsData;
	}, [allTrackers, timeRange]);

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className={`
					flex items-center justify-center p-1.5 rounded-md text-sm font-medium transition-all duration-200
					bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
					text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400
					border border-gray-200 dark:border-gray-600
					${className}
				`}
				title="View Analytics Dashboard"
			>
				<BarChart3 className="h-3.5 w-3.5" />
			</button>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl h-full max-h-[85vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							Analytics Dashboard
						</h2>
					</div>
					<div className="flex items-center gap-3">
						{/* Time Range Selector */}
						<select
							value={timeRange}
							onChange={(e) => setTimeRange(e.target.value as any)}
							className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="1h">Last Hour</option>
							<option value="24h">Last 24 Hours</option>
							<option value="7d">Last 7 Days</option>
						</select>
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
						>
							✕
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4">
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
						<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
							<div className="flex items-center gap-2 mb-2">
								<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								<span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Events</span>
							</div>
							<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
								{analytics.totalEvents.toLocaleString()}
							</p>
						</div>

						<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
							<div className="flex items-center gap-2 mb-2">
								<Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span className="text-sm font-medium text-green-900 dark:text-green-100">Active Trackers</span>
							</div>
							<p className="text-2xl font-bold text-green-900 dark:text-green-100">
								{analytics.uniqueTrackers}
							</p>
						</div>

						<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
							<div className="flex items-center gap-2 mb-2">
								<Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								<span className="text-sm font-medium text-purple-900 dark:text-purple-100">Avg Load Time</span>
							</div>
							<p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
								{formatDuration(analytics.performanceMetrics.averageLoadTime)}
							</p>
						</div>

						<div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
							<div className="flex items-center gap-2 mb-2">
								<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
								<span className="text-sm font-medium text-red-900 dark:text-red-100">Error Rate</span>
							</div>
							<p className="text-2xl font-bold text-red-900 dark:text-red-100">
								{analytics.performanceMetrics.errorRate.toFixed(1)}%
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Top Events */}
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Top Events
							</h3>
							<div className="space-y-3">
								{analytics.topEvents.map((event, index) => (
									<div key={event.name} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-gray-600 dark:text-gray-400">
												#{index + 1}
											</span>
											<div>
												<p className="text-sm font-medium text-gray-900 dark:text-white">
													{event.name}
												</p>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{event.tracker}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-sm font-bold text-gray-900 dark:text-white">
												{event.count}
											</p>
											<div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
												<div 
													className="bg-blue-500 h-1 rounded-full"
													style={{ 
														width: `${(event.count / analytics.topEvents[0]?.count || 1) * 100}%` 
													}}
												/>
											</div>
										</div>
									</div>
								))}
								{analytics.topEvents.length === 0 && (
									<p className="text-center text-gray-500 dark:text-gray-400 py-4">
										No events in selected time range
									</p>
								)}
							</div>
						</div>

						{/* Performance Metrics */}
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Performance Overview
							</h3>
							<div className="space-y-4">
								<div>
									<div className="flex justify-between items-center mb-1">
										<span className="text-sm text-gray-600 dark:text-gray-400">
											Data Transferred
										</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">
											{formatBytes(analytics.performanceMetrics.totalDataTransferred)}
										</span>
									</div>
									<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
										<div 
											className="bg-blue-500 h-2 rounded-full"
											style={{ width: '100%' }}
										/>
									</div>
								</div>

								<div>
									<div className="flex justify-between items-center mb-1">
										<span className="text-sm text-gray-600 dark:text-gray-400">
											Average Load Time
										</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">
											{formatDuration(analytics.performanceMetrics.averageLoadTime)}
										</span>
									</div>
									<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
										<div 
											className={`h-2 rounded-full ${
												analytics.performanceMetrics.averageLoadTime < 1000 
													? 'bg-green-500' 
													: analytics.performanceMetrics.averageLoadTime < 3000 
													? 'bg-yellow-500' 
													: 'bg-red-500'
											}`}
											style={{ 
												width: `${Math.min(100, (analytics.performanceMetrics.averageLoadTime / 5000) * 100)}%` 
											}}
										/>
									</div>
								</div>

								<div>
									<div className="flex justify-between items-center mb-1">
										<span className="text-sm text-gray-600 dark:text-gray-400">
											Error Rate
										</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">
											{analytics.performanceMetrics.errorRate.toFixed(1)}%
										</span>
									</div>
									<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
										<div 
											className={`h-2 rounded-full ${
												analytics.performanceMetrics.errorRate < 1 
													? 'bg-green-500' 
													: analytics.performanceMetrics.errorRate < 5 
													? 'bg-yellow-500' 
													: 'bg-red-500'
											}`}
											style={{ 
												width: `${Math.min(100, analytics.performanceMetrics.errorRate)}%` 
											}}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Recent Timeline */}
						<div className="lg:col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Recent Activity Timeline
							</h3>
							<div className="max-h-64 overflow-y-auto space-y-2">
								{analytics.timeline.slice(-20).reverse().map((item, index) => (
									<div key={index} className="flex items-center gap-3 py-2">
										<div className={`w-2 h-2 rounded-full ${item.success ? 'bg-green-500' : 'bg-red-500'}`} />
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
												{item.event}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{item.tracker}
											</p>
										</div>
										<span className="text-xs text-gray-500 dark:text-gray-400">
											{item.timestamp.toLocaleTimeString()}
										</span>
									</div>
								))}
								{analytics.timeline.length === 0 && (
									<p className="text-center text-gray-500 dark:text-gray-400 py-8">
										No activity in selected time range
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}



