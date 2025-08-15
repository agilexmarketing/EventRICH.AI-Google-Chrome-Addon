import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Notification, NotificationType, NotificationManager } from "../utils";

export default function NotificationCenter() {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	useEffect(() => {
		const unsubscribe = NotificationManager.subscribe(setNotifications);
		return unsubscribe;
	}, []);

	const getIcon = (type: NotificationType) => {
		switch (type) {
			case NotificationType.SUCCESS:
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case NotificationType.ERROR:
				return <XCircle className="h-4 w-4 text-red-500" />;
			case NotificationType.WARNING:
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
			case NotificationType.INFO:
				return <Info className="h-4 w-4 text-blue-500" />;
		}
	};

	const getBackgroundColor = (type: NotificationType) => {
		switch (type) {
			case NotificationType.SUCCESS:
				return "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600";
			case NotificationType.ERROR:
				return "bg-red-100 dark:bg-red-800 border-red-300 dark:border-red-600";
			case NotificationType.WARNING:
				return "bg-yellow-100 dark:bg-yellow-800 border-yellow-300 dark:border-yellow-600";
			case NotificationType.INFO:
				return "bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600";
		}
	};

	if (notifications.length === 0) {
		return null;
	}

	return (
		<div className="absolute top-2 right-2 z-50 space-y-2 max-w-xs">
			{notifications.map((notification) => (
				<div
					key={notification.id}
					className={`
						${getBackgroundColor(notification.type)}
						border rounded-lg p-3 shadow-xl animate-in slide-in-from-right-full duration-300
					`}
				>
					<div className="flex items-start gap-3">
						{getIcon(notification.type)}
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-gray-900 dark:text-white">
								{notification.title}
							</p>
							<p className="text-xs text-gray-700 dark:text-gray-100 mt-1">
								{notification.message}
							</p>
						</div>
						<button
							onClick={() => NotificationManager.removeNotification(notification.id)}
							className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				</div>
			))}
		</div>
	);
}




