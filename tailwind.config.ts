/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/**/*.{js,ts,jsx,tsx}", // Scans all your src files for Tailwind usage
	],
	darkMode: 'class', // Enable class-based dark mode
	theme: {
		extend: {
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				fadeOut: {
					"0%": { opacity: "1" },
					"100%": { opacity: "0" },
				},
			},
			animation: {
				fadeIn: "fadeIn 0.3s forwards",
				fadeOut: "fadeOut 0.3s forwards",
			},
			colors: {
				// Custom colors
				background: "hsla(var(--background))",
				mainText: "hsla(var(--mainText))",
				mainTextUnchanged: "hsla(var(--mainTextUnchanged))",
				bodyText: "hsla(var(--bodyText))",
				primary: "hsla(var(--primary))",
				card: "hsla(var(--card))",
				topSideMenu: "hsla(var(--topSideMenu))",
				lightBodyColor: "hsla(var(--lightBodyColor))",
				borderColor: "hsla(var(--borderColor))",
				backgroundWithBlur: "hsla(var(--backgroundWithBlur))",
				listText: "hsla(var(--listText))",
				tableColorGray: "hsla(var(--tableColorGray))",
				customGray: "hsla(var(--customGray))",
				borderLight: "hsla(var(--borderLight))",
				royalBlueHover: "hsla(var(--royalBlueHover))",
				gray: "hsla(var(--gray))",
				orange: "hsla(var(--orange))",
				borderOrange: "hsla(var(--borderOrange))",
				green: "hsla(var(--green))",
				borderGreen: "hsla(var(--borderGreen))",
				outlineColor: "hsla(var(--outlineColor))",
				modalBackground: "hsla(var(--modalBackground))",
				royalBlueHover2: "hsla(var(--royalBlueHover2))",
				primary2: "hsla(var(--primary2))",
				accent: "hsla(var(--accent))",
				borderSuperLight: "hsla(var(--borderSuperLight))",

				success: "hsla(var(--success))",
				successLight: "hsla(var(--successLight))",
			},
		},
	},
	plugins: [],
};
