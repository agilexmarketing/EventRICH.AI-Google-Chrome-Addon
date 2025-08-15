import { Search, Filter, X, Calendar, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { EventFilter, Events } from "../types";

interface FilterPanelProps {
	onFilterChange: (filter: EventFilter) => void;
	availableTrackers: string[];
	availableEvents: string[];
	className?: string;
}

export default function FilterPanel({ 
	onFilterChange, 
	availableTrackers, 
	availableEvents, 
	className 
}: FilterPanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [filter, setFilter] = useState<EventFilter>({});

	useEffect(() => {
		onFilterChange(filter);
	}, [filter, onFilterChange]);

	const updateFilter = (updates: Partial<EventFilter>) => {
		setFilter(prev => ({ ...prev, ...updates }));
	};

	const clearFilter = () => {
		setFilter({});
	};

	const hasActiveFilters = Boolean(
		filter.searchTerm || 
		filter.tracker || 
		filter.eventName || 
		filter.dateRange
	);

	return (
		<div className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
			{/* Search Bar - Always Visible */}
			<div className="p-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search events, parameters, or URLs..."
						value={filter.searchTerm || ''}
						onChange={(e) => updateFilter({ searchTerm: e.target.value })}
						className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					{filter.searchTerm && (
						<button
							onClick={() => updateFilter({ searchTerm: undefined })}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* Advanced Filters Toggle */}
			<div className="px-3 pb-2">
				<div className="flex items-center justify-between">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<Filter className="h-4 w-4" />
						Advanced Filters
						{hasActiveFilters && (
							<span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
								{[filter.tracker, filter.eventName, filter.dateRange].filter(Boolean).length}
							</span>
						)}
					</button>
					{hasActiveFilters && (
						<button
							onClick={clearFilter}
							className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
						>
							Clear all
						</button>
					)}
				</div>
			</div>

			{/* Advanced Filters - Collapsible */}
			{isExpanded && (
				<div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3 bg-gray-50 dark:bg-gray-800">
					{/* Tracker Filter */}
					<div>
						<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							<Tag className="inline h-3 w-3 mr-1" />
							Tracker
						</label>
						<select
							value={filter.tracker || ''}
							onChange={(e) => updateFilter({ tracker: e.target.value || undefined })}
							className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">All trackers</option>
							{availableTrackers.map(tracker => (
								<option key={tracker} value={tracker}>{tracker}</option>
							))}
						</select>
					</div>

					{/* Event Name Filter */}
					<div>
						<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							Event Name
						</label>
						<select
							value={filter.eventName || ''}
							onChange={(e) => updateFilter({ eventName: e.target.value || undefined })}
							className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">All events</option>
							{availableEvents.map(event => (
								<option key={event} value={event}>{event}</option>
							))}
						</select>
					</div>

					{/* Date Range Filter */}
					<div>
						<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							<Calendar className="inline h-3 w-3 mr-1" />
							Date Range
						</label>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="datetime-local"
								value={filter.dateRange?.start?.toISOString().slice(0, 16) || ''}
								onChange={(e) => {
									const start = e.target.value ? new Date(e.target.value) : undefined;
									updateFilter({ 
										dateRange: start ? { 
											...filter.dateRange, 
											start 
										} : undefined 
									});
								}}
								className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Start date"
							/>
							<input
								type="datetime-local"
								value={filter.dateRange?.end?.toISOString().slice(0, 16) || ''}
								onChange={(e) => {
									const end = e.target.value ? new Date(e.target.value) : undefined;
									updateFilter({ 
										dateRange: end ? { 
											...filter.dateRange, 
											end 
										} : undefined 
									});
								}}
								className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="End date"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}




