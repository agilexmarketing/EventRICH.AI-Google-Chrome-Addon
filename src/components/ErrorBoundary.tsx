import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Bug, Copy } from "lucide-react";
import { ErrorHandler, NotificationManager } from "../utils";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	errorId: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
			errorId: null
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const errorId = ErrorHandler.logError(error, 'React Error Boundary');
		
		this.setState({
			error,
			errorInfo,
			errorId
		});

		NotificationManager.error(
			"Application Error",
			"An unexpected error occurred. Please try refreshing the page."
		);
	}

	private handleReload = () => {
		window.location.reload();
	};

	private handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null
		});
	};

	private handleCopyError = () => {
		const { error, errorInfo, errorId } = this.state;
		const errorData = {
			errorId,
			timestamp: new Date().toISOString(),
			error: {
				name: error?.name,
				message: error?.message,
				stack: error?.stack
			},
			errorInfo: {
				componentStack: errorInfo?.componentStack
			},
			userAgent: navigator.userAgent,
			url: window.location.href
		};

		navigator.clipboard.writeText(JSON.stringify(errorData, null, 2)).then(() => {
			NotificationManager.success("Copied", "Error details copied to clipboard");
		}).catch(() => {
			NotificationManager.error("Copy Failed", "Could not copy error details");
		});
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
					<div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="flex-shrink-0">
								<AlertTriangle className="h-8 w-8 text-red-500" />
							</div>
							<div>
								<h1 className="text-lg font-semibold text-gray-900 dark:text-white">
									Something went wrong
								</h1>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									EventRICH.AI encountered an unexpected error
								</p>
							</div>
						</div>

						{this.state.error && (
							<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
								<p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
									Error Details:
								</p>
								<p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
									{this.state.error.message}
								</p>
								{this.state.errorId && (
									<p className="text-xs text-red-600 dark:text-red-400 mt-1">
										Error ID: {this.state.errorId}
									</p>
								)}
							</div>
						)}

						<div className="space-y-3">
							<button
								onClick={this.handleReset}
								className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
							>
								<RefreshCw className="h-4 w-4" />
								Try Again
							</button>

							<button
								onClick={this.handleReload}
								className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
							>
								<RefreshCw className="h-4 w-4" />
								Reload Page
							</button>

							<button
								onClick={this.handleCopyError}
								className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-md transition-colors"
							>
								<Copy className="h-4 w-4" />
								Copy Error Details
							</button>

							<div className="text-center">
								<button
									onClick={() => window.chrome?.tabs?.create({ url: 'https://eventrich.ai/support' })}
									className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
								>
									<Bug className="inline h-4 w-4 mr-1" />
									Report this issue
								</button>
							</div>
						</div>

						{process.env.NODE_ENV === 'development' && this.state.errorInfo && (
							<details className="mt-4">
								<summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
									Component Stack (Development)
								</summary>
								<pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32 text-gray-700 dark:text-gray-300">
									{this.state.errorInfo.componentStack}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}




