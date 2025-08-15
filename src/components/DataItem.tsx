import { Eye, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils";
import { SygnalDataItem } from "../types";
import DataItemAccordion from "./DataItemAccordion";
import Tooltip from "./Tooltip";

export default function DataItem({ item }: { item: SygnalDataItem }) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Count total events for this tracker
	const totalEvents = item.items.length;

	// Check if this is an external tracker (not EventRICH.AI)
	const isExternalTracker = item.name !== "EventRICH.AI Pixel";

	return (
		<div className="border-t border-gray-200 dark:border-gray-700 pt-2 px-3 flex flex-col gap-1">
			<div 
				className="flex items-center justify-between gap-2 hover:cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1 transition-colors duration-200"
				onClick={() => totalEvents > 0 && setIsExpanded(!isExpanded)}
			>
				<div className="flex items-center gap-2">
					{item.name === "EventRICH.AI Pixel" ? (
						<Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
					) : (
						<img
							src={item.image}
							alt={item.name}
							className="w-6 h-6 rounded-full"
						/>
					)}
					<div className="text-gray-900 dark:text-white text-sm font-medium">
						{item.name}
					</div>
					{isExternalTracker && (
						<Tooltip
							classes="-top-8 left-1/2 -translate-x-1/2"
							trigger={
								<div className="text-red-500 hover:cursor-help">
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
									</svg>
								</div>
							}
						>
							<div 
								className="text-xs text-center whitespace-nowrap"
								style={{ color: '#991b1b' }}
							>
								It is blocked on iOS devices!
							</div>
						</Tooltip>
					)}
					{totalEvents > 0 && (
						<div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
							{totalEvents} event{totalEvents !== 1 ? 's' : ''}
						</div>
					)}
				</div>
				{totalEvents > 0 && (
					<div
						className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
					>
						<ChevronUp
							className={cn(
								"w-4 h-4 transition-all duration-300",
								!isExpanded && "scale-[-1]"
							)}
						/>
					</div>
				)}
			</div>
			{isExpanded && totalEvents > 0 && (
				<div className="flex flex-col gap-1 pl-8">
					{item.items.map((accordionData, i) => (
						<DataItemAccordion
							key={`${accordionData.name}-${i}`}
							accordionData={accordionData}
						/>
					))}
				</div>
			)}
		</div>
	);
}
