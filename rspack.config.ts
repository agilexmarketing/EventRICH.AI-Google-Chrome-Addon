import { defineConfig } from "@rspack/cli";
import path from "node:path";
import rspack from "@rspack/core";

export default defineConfig({
	mode: "production",
	devtool: false, // Disable source maps to avoid eval() usage
	entry: {
		popup: "./src/popup.tsx",
		background: "./src/background.ts",
		content: "./src/content.tsx",
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
		chunkLoadingGlobal: "webpackChunkEventRichAI", // Custom global to avoid conflicts
	},
	performance: {
		hints: false, // Disable performance warnings for Chrome extension
		maxAssetSize: 1000000, // 1MB
		maxEntrypointSize: 1000000, // 1MB
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
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
