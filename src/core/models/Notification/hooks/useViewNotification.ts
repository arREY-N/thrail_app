import { Notification } from "@/src/core/models/Notification/interfaces/Notification.types";
import { useNotificationsStore } from "@/src/core/models/Notification/stores/notificationStore";
import { useEffect, useMemo } from 'react';

export const useViewNotification = (notificationId?: string) => {
    const notifications = useNotificationsStore(s => s.notifications);
    const readNotification = useNotificationsStore(s => s.readNotification);

    const notification = useMemo((): Notification | null => {
        if (!notificationId) return null;
        return notifications.find(n => n.id === notificationId) ?? null;
    }, [notifications, notificationId]);

    useEffect(() => {
        if (notification && !notification.read) {
            readNotification(notification.id);
        }
    }, [notification, readNotification]);

    return {
        notification,
    };
};

export const useNotificationItem = useViewNotification;

