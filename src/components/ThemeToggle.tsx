import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeMode, ThemeManager } from "../utils";

interface ThemeToggleProps {
	className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
	const [theme, setTheme] = useState<ThemeMode>(ThemeMode.SYSTEM);

	useEffect(() => {
		const loadTheme = async () => {
			const currentTheme = await ThemeManager.getThemeAsync();
			setTheme(currentTheme);
		};
		loadTheme();
	}, []);

	const handleThemeChange = async (newTheme: ThemeMode) => {
		setTheme(newTheme);
		await ThemeManager.setTheme(newTheme);
	};

	const getIcon = (themeMode: ThemeMode) => {
		switch (themeMode) {
			case ThemeMode.LIGHT:
				return <Sun className="h-4 w-4" />;
			case ThemeMode.DARK:
				return <Moon className="h-4 w-4" />;
			case ThemeMode.SYSTEM:
				return <Monitor className="h-4 w-4" />;
		}
	};

	const getLabel = (themeMode: ThemeMode) => {
		switch (themeMode) {
			case ThemeMode.LIGHT:
				return "Light";
			case ThemeMode.DARK:
				return "Dark";
			case ThemeMode.SYSTEM:
				return "System";
		}
	};

	return (
		<div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
			{Object.values(ThemeMode).map((themeMode) => (
				<button
					key={themeMode}
					onClick={() => handleThemeChange(themeMode)}
					className={`
						flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
						${theme === themeMode 
							? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
						}
					`}
					title={`Switch to ${getLabel(themeMode)} theme`}
				>
					{getIcon(themeMode)}
					<span className="hidden sm:inline">{getLabel(themeMode)}</span>
				</button>
			))}
		</div>
	);
}
