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
				return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
			case NotificationType.ERROR:
				return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
			case NotificationType.WARNING:
				return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
			case NotificationType.INFO:
				return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
		}
	};

	if (notifications.length === 0) {
		return null;
	}

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
			{notifications.map((notification) => (
				<div
					key={notification.id}
					className={`
						${getBackgroundColor(notification.type)}
						border rounded-lg p-3 shadow-lg animate-in slide-in-from-right-full duration-300
					`}
				>
					<div className="flex items-start gap-3">
						{getIcon(notification.type)}
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-white">
								{notification.title}
							</p>
							<p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
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



