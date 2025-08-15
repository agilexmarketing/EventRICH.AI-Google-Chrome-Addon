import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, ThemeManager } from '../utils';

interface ThemeContextType {
	theme: ThemeMode;
	setTheme: (theme: ThemeMode) => Promise<void>;
	isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<ThemeMode>(ThemeMode.SYSTEM);
	const [isDark, setIsDark] = useState(false);

	// Load initial theme
	useEffect(() => {
		const loadTheme = async () => {
			const currentTheme = await ThemeManager.getThemeAsync();
			setThemeState(currentTheme);
			
			// Calculate if dark mode should be active
			const shouldBeDark = calculateIsDark(currentTheme);
			setIsDark(shouldBeDark);
		};
		
		loadTheme();
	}, []);

	// Calculate if theme should be dark
	const calculateIsDark = (themeMode: ThemeMode): boolean => {
		if (themeMode === ThemeMode.DARK) return true;
		if (themeMode === ThemeMode.LIGHT) return false;
		// For SYSTEM, check browser preference
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	};

	// Update theme
	const setTheme = async (newTheme: ThemeMode) => {
		setThemeState(newTheme);
		
		// Calculate if dark mode should be active
		const shouldBeDark = calculateIsDark(newTheme);
		setIsDark(shouldBeDark);
		
		// Apply to DOM and save to storage
		await ThemeManager.setTheme(newTheme);
		ThemeManager.applyTheme(newTheme);
	};

	// Listen for system theme changes
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		const handleSystemThemeChange = () => {
			if (theme === ThemeMode.SYSTEM) {
				const shouldBeDark = mediaQuery.matches;
				console.log('[ThemeProvider] System theme changed, isDark:', shouldBeDark);
				setIsDark(shouldBeDark);
				ThemeManager.applyTheme(ThemeMode.SYSTEM);
			}
		};

		mediaQuery.addEventListener('change', handleSystemThemeChange);
		return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
	}, [theme]);

	const contextValue: ThemeContextType = {
		theme,
		setTheme,
		isDark
	};

	return (
		<ThemeContext.Provider value={contextValue}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextType {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
