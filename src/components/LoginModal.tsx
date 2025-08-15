import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, X, User, UserPlus, Key } from 'lucide-react';
import { LoginResponse } from '../types';

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLoginSuccess: (response: LoginResponse) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isLoading) return;

		setIsLoading(true);
		setError('');

		try {
			// Generate device ID if not exists
			let deviceId: string;
			const storedDeviceId = await chrome.storage.local.get(['eventrich_device_id']);
			if (storedDeviceId.eventrich_device_id) {
				deviceId = storedDeviceId.eventrich_device_id;
			} else {
				deviceId = 'chrome_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
				await chrome.storage.local.set({ eventrich_device_id: deviceId });
			}

			// Get addon version from manifest
			const manifest = chrome.runtime.getManifest();
			const addonVersion = manifest.version || '1.0.0';

			console.log('EventRICH.AI Login: Attempting login to dash.eventrich.ai');
			console.log('EventRICH.AI Login: Device ID:', deviceId);
			console.log('EventRICH.AI Login: Addon Version:', addonVersion);

			const response = await fetch('https://dash.eventrich.ai/applications/google_chrome_addon/login.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					email, 
					password,
					addon_version: addonVersion,
					device_id: deviceId
				}),
			});

			console.log('EventRICH.AI Login: Response status:', response.status);
			console.log('EventRICH.AI Login: Response headers:', response.headers);

			const data = await response.json();
			console.log('EventRICH.AI Login: Response data:', data);

			if (response.ok && data.success) {
				// Store authentication data according to updated API spec
				await chrome.storage.local.set({
					eventrich_auth: {
						token: data.data.user.api_token,
						user: data.data.user,
						timestamp: Date.now()
					}
				});

				console.log('EventRICH.AI Login: Successfully stored auth data');
				console.log('EventRICH.AI Login: Token:', data.data.user.api_token);
				onLoginSuccess(data);
				setEmail('');
				setPassword('');
				onClose();
			} else {
				// Handle specific error codes according to API spec
				switch (response.status) {
					case 400:
						setError(data.error || 'Invalid data provided. Please check your input.');
						break;
					case 401:
						setError('Invalid email or password. Please try again.');
						break;
					case 402:
						setError('Insufficient credits. Please upgrade your plan.');
						break;
					case 403:
						setError('Your account has been deactivated. Please contact support.');
						break;
					case 500:
						setError('Server error. Please try again later.');
						break;
					default:
						setError(data.error || 'Login failed. Please check your credentials.');
				}
			}
		} catch (error) {
			setError('Network error. Please check your connection and try again.');
			console.error('Login error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUpClick = () => {
		window.chrome.tabs.create({ url: 'https://dash.eventrich.ai/register' });
	};

	const handleForgotPasswordClick = () => {
		window.chrome.tabs.create({ url: 'https://dash.eventrich.ai/forgot-password' });
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				{/* Modal */}
				<div 
					className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
								Login to EventRICH.AI
							</h2>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-4">
						<form onSubmit={handleLogin} className="space-y-4">
							{/* Email */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Email
								</label>
								<input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								/>
							</div>

							{/* Password */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Password
								</label>
								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password (min. 6 characters)"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										minLength={6}
										className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							{/* Error */}
							{error && (
								<div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
									{error}
								</div>
							)}

							{/* Login Button */}
							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors duration-200"
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<LogIn className="h-4 w-4" />
								)}
								{isLoading ? "Signing in..." : "Sign In"}
							</button>
						</form>
					</div>

					{/* Footer */}
					<div className="px-4 pb-4 space-y-3">
						{/* Divider */}
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-200 dark:border-gray-700" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
									Need an account?
								</span>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="grid grid-cols-2 gap-2">
							<button
								onClick={handleSignUpClick}
								className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
							>
								<UserPlus className="h-3 w-3" />
								Sign Up
							</button>
							<button
								onClick={handleForgotPasswordClick}
								className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
							>
								<Key className="h-3 w-3" />
								Forgot Password
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
