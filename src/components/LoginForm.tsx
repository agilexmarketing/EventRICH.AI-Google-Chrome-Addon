import { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { LoginResponse, LoginRequest } from "../types";

interface LoginFormProps {
	onLoginSuccess?: (userData: LoginResponse["user"]) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [userData, setUserData] = useState<LoginResponse["user"] | null>(null);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("https://dash.eventrich.ai/applications/google_chrome_addon/login.php", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
					addon_version: "1.0.0",
					device_id: "chrome_addon_device_" + Date.now(),
				} as LoginRequest),
			});

			const data: LoginResponse = await response.json();

			if (response.ok && data.success) {
				setIsLoggedIn(true);
				setUserData(data.data?.user || null);
				onLoginSuccess?.(data.data?.user || null);
				// Store login state in chrome storage
				window.chrome.storage.local.set({
					eventrich_login: {
						isLoggedIn: true,
						userData: data.data?.user,
						addonConfig: data.data?.addon_config,
						apiToken: data.data?.user.api_token,
						timestamp: Date.now(),
					},
				});
			} else {
				setError(data.message || "Login failed. Please check your credentials.");
			}
		} catch (err) {
			setError("Network error. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		setUserData(null);
		setEmail("");
		setPassword("");
		// Clear login state from chrome storage
		window.chrome.storage.local.remove(["eventrich_login"]);
	};

	// Check for existing login on component mount
	useEffect(() => {
		window.chrome.storage.local.get(["eventrich_login"], (result) => {
			if (result.eventrich_login?.isLoggedIn) {
				setIsLoggedIn(true);
				setUserData(result.eventrich_login.userData);
			}
		});
	}, []);

	if (isLoggedIn) {
		return (
			<div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
							<span className="text-white text-sm font-medium">
								{userData?.name?.charAt(0) || userData?.email?.charAt(0) || "U"}
							</span>
						</div>
						<div>
							<p className="text-sm font-medium text-gray-900 dark:text-white">
								{userData?.name || "User"}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{userData?.email}
							</p>
						</div>
					</div>
					<button
						onClick={handleLogout}
						className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
					>
						Logout
					</button>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-xs text-gray-600 dark:text-gray-300">Credits:</span>
						<span className="text-sm font-semibold text-green-600 dark:text-green-400">
							{userData?.credits || 0}
						</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							({userData?.subscription_status?.plan || 'free'})
						</span>
					</div>
					<button
						onClick={() => window.chrome.tabs.create({ url: 'https://dash.eventrich.ai/dashboard' })}
						className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
					>
						Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
			<form onSubmit={handleLogin} className="space-y-2">
				<div className="flex gap-1.5">
					<div className="flex-1 min-w-0">
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>
					
					<div className="flex-1 min-w-0 relative">
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-2 py-1.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
						>
							{showPassword ? (
								<EyeOff className="h-3 w-3" />
							) : (
								<Eye className="h-3 w-3" />
							)}
						</button>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors duration-200 whitespace-nowrap shrink-0"
					>
						{isLoading ? (
							<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
						) : (
							<LogIn className="h-3 w-3" />
						)}
						{isLoading ? "..." : "Login"}
					</button>
				</div>

				{error && (
					<div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
						{error}
					</div>
				)}
			</form>
			
			<div className="mt-2 text-center">
				<p className="text-xs text-gray-500 dark:text-gray-400">
					Don't have an account?{" "}
					<button
						onClick={() => window.chrome.tabs.create({ url: 'https://dash.eventrich.ai/register' })}
						className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
					>
						Sign up
					</button>
					{" • "}
					<button
						onClick={() => window.chrome.tabs.create({ url: 'https://dash.eventrich.ai/forgot-password' })}
						className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
					>
						Forgot password?
					</button>
				</p>
			</div>
		</div>
	);
}
