import { SygnalDataEventCategoryParameter } from "@/types";
import { useState } from "react";

export default function DataItemAccordionParameterItem({
	parameterItem,
	shouldShowContent,
}: {
	parameterItem: SygnalDataEventCategoryParameter;
	shouldShowContent: boolean;
}) {
	const [showValue, setShowValue] = useState(shouldShowContent);

	return (
		<div className="flex items-center gap-1 text-xs">
			<div
				className="font-bold text-gray-900 dark:text-white text-nowrap max-w-32 min-w-min truncate"
				title={parameterItem.name}
			>
				{parameterItem.name}
			</div>
			{showValue ? (
				<div className="truncate text-gray-600 dark:text-gray-300" title={parameterItem.value}>
					{parameterItem.value || "-"}
				</div>
			) : (
				<div
					className="text-blue-600 dark:text-blue-400 hover:underline hover:cursor-pointer"
					onClick={() => setShowValue(true)}
				>
					Show
				</div>
			)}
		</div>
	);
}
