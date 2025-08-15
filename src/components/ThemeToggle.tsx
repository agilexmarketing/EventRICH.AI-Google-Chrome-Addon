import { Moon, Sun, Monitor } from "lucide-react";
import { ThemeMode } from "../utils";
import { useTheme } from "../contexts/ThemeContext";

interface ThemeToggleProps {
	className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
	const { theme, setTheme } = useTheme();

	const cycleTheme = async () => {
		let nextTheme: ThemeMode;
		
		switch (theme) {
			case ThemeMode.LIGHT:
				nextTheme = ThemeMode.DARK;
				break;
			case ThemeMode.DARK:
				nextTheme = ThemeMode.SYSTEM;
				break;
			case ThemeMode.SYSTEM:
				nextTheme = ThemeMode.LIGHT;
				break;
			default:
				nextTheme = ThemeMode.LIGHT;
		}
		
		await setTheme(nextTheme);
	};

	const getCurrentIcon = () => {
		switch (theme) {
			case ThemeMode.LIGHT:
				return <Sun className="h-3.5 w-3.5" />;
			case ThemeMode.DARK:
				return <Moon className="h-3.5 w-3.5" />;
			case ThemeMode.SYSTEM:
				return <Monitor className="h-3.5 w-3.5" />;
		}
	};

	const getCurrentLabel = () => {
		switch (theme) {
			case ThemeMode.LIGHT:
				return "Light";
			case ThemeMode.DARK:
				return "Dark";
			case ThemeMode.SYSTEM:
				return "System";
		}
	};

	const getNextThemeLabel = () => {
		switch (theme) {
			case ThemeMode.LIGHT:
				return "Dark";
			case ThemeMode.DARK:
				return "System";
			case ThemeMode.SYSTEM:
				return "Light";
		}
	};

	return (
		<button
			onClick={cycleTheme}
			className={`
				flex items-center justify-center p-1.5 rounded-md text-sm font-medium transition-all duration-200
				bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
				text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
				border border-gray-200 dark:border-gray-600
				${className}
			`}
			title={`Current: ${getCurrentLabel()} theme. Click to switch to ${getNextThemeLabel()}`}
		>
			{getCurrentIcon()}
		</button>
	);
}
