import { Check, ChevronUp, Code, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils";
import { SygnalDataEvent } from "../types";
import DataItemAccordionParameter from "./DataItemAccordionParameter";

export default function DataItemAccordion({
	accordionData,
}: {
	accordionData: SygnalDataEvent;
}) {
	const [active, setActive] = useState(false);
	const [showRawData, setShowRawData] = useState(false);
	const [copied, setCopied] = useState(false);
	
	const accordionDataName = accordionData.name.includes("_")
		? accordionData.name
				.split("_")
				.map(
					(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
				)
				.join("")
		: accordionData.name;

	// Create raw data object from parameters
	const rawData = accordionData.parameters.reduce((acc, category) => {
		category.items.forEach(item => {
			acc[item.name] = item.value;
		});
		return acc;
	}, {} as Record<string, string>);

	// Add URL to raw data if available
	if (accordionData.url) {
		rawData["_request_url"] = accordionData.url;
	}

	const handleCopyRawData = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(rawData, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy raw data:', error);
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<div className="inline-block">
				<div className="flex items-center justify-between">
					<div
						className="inline-flex items-center gap-1 hover:cursor-pointer"
						onClick={() => setActive((prevValue) => !prevValue)}
					>
						<ChevronUp
							className={cn(
								"text-gray-400 dark:text-gray-300 w-3 h-3 transition-all duration-300",
								!active && "scale-[-1]",
							)}
						/>
						<Check className="text-green-600 dark:text-green-400 w-3 h-3" />
						<span className="text-xs font-bold text-gray-900 dark:text-white capitalize">
							{accordionDataName}
						</span>
					</div>
					{active && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								setShowRawData(!showRawData);
							}}
							className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
						>
							<Code className="w-3 h-3" />
							{showRawData ? "Hide Raw" : "View Raw"}
						</button>
					)}
				</div>
			</div>
			{active && (
				<div className="pl-3 flex flex-col gap-1">
					{showRawData && (
						<div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between mb-1">
								<div className="text-xs font-bold text-gray-700 dark:text-gray-300">
									Raw Data:
								</div>
								<button
									onClick={handleCopyRawData}
									className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
								>
									<Copy className="w-3 h-3" />
									{copied ? "Copied!" : "Copy"}
								</button>
							</div>
							<pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
								{JSON.stringify(rawData, null, 2)}
							</pre>
						</div>
					)}
					{accordionData.parameters.map((parameter, i) => (
						<DataItemAccordionParameter
							key={`${parameter.name}-${i}`}
							parameter={parameter}
						/>
					))}
				</div>
			)}
		</div>
	);
}
