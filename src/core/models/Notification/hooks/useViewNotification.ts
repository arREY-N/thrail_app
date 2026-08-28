import { Notification } from "@/src/core/models/Notification/interfaces/Notification.types";
import { useNotificationsStore } from "@/src/core/models/Notification/stores/notificationStore";
import { useEffect, useState } from "react";

export const useViewNotification = (notificationId?: string) => {
    const notifications = useNotificationsStore(s => s.notifications);
    const [notification, setNotification] = useState<Notification | null>(null);
    const readNotification = useNotificationsStore(s => s.readNotification);

    useEffect(() => {
        try {
            if (notificationId) {
                const found = notifications.find(n => n.id === notificationId);

                if (found) {
                    setNotification(found);
                    readNotification(notificationId);
                }
            }
        } catch (error) {
            console.error("Failed to view notification:", error);
        }
    }, [notificationId, notifications]);

    return {
        notification,
    };
};

export const useNotificationItem = useViewNotification;
