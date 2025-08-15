import { defineConfig } from "@rspack/cli";
import path from "node:path";
import rspack from "@rspack/core";

export default defineConfig({
	mode: "production", // Test production mode
	devtool: false, // Disable source maps (production setting)
	entry: {
		popup: "./src/popup.tsx",
		background: "./src/background.ts",
		content: "./src/content.tsx",
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
		chunkLoadingGlobal: "webpackChunkEventRichAI", // Custom global to avoid conflicts
		library: {
			type: "umd", // Universal Module Definition for better compatibility
		},
	},
	performance: {
		hints: false, // Disable performance warnings for Chrome extension
		maxAssetSize: 1000000, // 1MB
		maxEntrypointSize: 1000000, // 1MB
	},
	optimization: {
		minimize: true, // Keep minification for smaller file size
		splitChunks: false, // Disable chunk splitting for Chrome extension compatibility
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: [
					{
						loader: "esbuild-loader",
						options: {
							loader: "tsx",
							target: "es2015",
						},
					},
				],
				exclude: /node_modules/,
			},
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader", "postcss-loader"],
			},
		],
	},
	plugins: [
		new rspack.CopyRspackPlugin({
			patterns: [
				{ from: "public" },
				{ from: "src/assets/images", to: "images" },
			],
		}),
	],
});
