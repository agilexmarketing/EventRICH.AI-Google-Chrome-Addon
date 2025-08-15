import { Download, FileText, FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { ExportFormat, SygnalDataEvent, ExportManager, NotificationManager } from "../utils";

interface ExportButtonProps {
	data: SygnalDataEvent[];
	filename?: string;
	className?: string;
	compact?: boolean;
}

export default function ExportButton({ 
	data, 
	filename, 
	className,
	compact = false 
}: ExportButtonProps) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleExport = async (format: ExportFormat) => {
		try {
			if (data.length === 0) {
				NotificationManager.warning(
					"No Data", 
					"There's no tracking data to export. Please wait for events to be captured."
				);
				return;
			}

			ExportManager.exportData(data, format, filename);
			
			NotificationManager.success(
				"Export Successful", 
				`Successfully exported ${data.length} events as ${format.toUpperCase()}`
			);
		} catch (error) {
			NotificationManager.error(
				"Export Failed", 
				error instanceof Error ? error.message : "An unknown error occurred"
			);
		} finally {
			setIsDropdownOpen(false);
		}
	};

	const getFormatIcon = (format: ExportFormat) => {
		switch (format) {
			case ExportFormat.JSON:
				return <FileJson className="h-4 w-4" />;
			case ExportFormat.CSV:
				return <FileSpreadsheet className="h-4 w-4" />;
			case ExportFormat.TXT:
				return <FileText className="h-4 w-4" />;
		}
	};

	const getFormatDescription = (format: ExportFormat) => {
		switch (format) {
			case ExportFormat.JSON:
				return "Structured data with all parameters";
			case ExportFormat.CSV:
				return "Spreadsheet format for analysis";
			case ExportFormat.TXT:
				return "Human-readable text format";
		}
	};

	if (compact) {
		return (
			<div className="relative">
				<button
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					className={`
						flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200
						bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
						text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400
						border border-gray-200 dark:border-gray-600
						${className}
					`}
					title="Export tracking data"
					disabled={data.length === 0}
				>
					<Download className="h-4 w-4" />
				</button>

				{isDropdownOpen && (
					<div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
						{Object.values(ExportFormat).map((format) => (
							<button
								key={format}
								onClick={() => handleExport(format)}
								className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
							>
								{getFormatIcon(format)}
								<span className="font-medium">{format.toUpperCase()}</span>
							</button>
						))}
					</div>
				)}

				{isDropdownOpen && (
					<div 
						className="fixed inset-0 z-40" 
						onClick={() => setIsDropdownOpen(false)}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsDropdownOpen(!isDropdownOpen)}
				className={`
					flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 
					hover:bg-blue-700 rounded-lg transition-colors duration-200
					${className}
				`}
				disabled={data.length === 0}
			>
				<Download className="h-4 w-4" />
				Export Data
				<span className="text-xs opacity-75">({data.length} events)</span>
			</button>

			{isDropdownOpen && (
				<div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
					<div className="p-2">
						<p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
							Choose export format:
						</p>
						{Object.values(ExportFormat).map((format) => (
							<button
								key={format}
								onClick={() => handleExport(format)}
								className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
							>
								{getFormatIcon(format)}
								<div className="flex-1">
									<div className="font-medium text-sm text-gray-900 dark:text-white">
										{format.toUpperCase()}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{getFormatDescription(format)}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			)}

			{isDropdownOpen && (
				<div 
					className="fixed inset-0 z-40" 
					onClick={() => setIsDropdownOpen(false)}
				/>
			)}
		</div>
	);
}



