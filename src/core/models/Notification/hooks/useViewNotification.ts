import { useNotificationsStore } from "@/src/core/models/Notification/stores/notificationStore";

export const useViewNotification = (notificationId?: string) => {
    const notifications = useNotificationsStore(s => s.notifications);
    const readNotification = useNotificationsStore(s => s.readNotification);
    const notification = () => {
        const notification = notifications.find(n => n.id === notificationId) ?? null;
        if (notification) {
            readNotification(notification.id);
        }
        return notification
    }

    return {
        notification,
    };
};

export const useNotificationItem = useViewNotification;
