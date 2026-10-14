import { useNotificationsStore } from "@/src/core/models/Notification/stores/notificationStore";
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';


export const useNotifications = () => {
    const notifications = useNotificationsStore(s => s.notifications);

    const onViewNotification = (notificationId: string) => {
        if (notificationId) {
            router.push({
                pathname: '/(main)/notification/view',
                params: {
                    notificationId,
                },
            });
        }
    };

    return {
        notifications,
        onViewNotification,
    };
};

export const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync();

        if (status === 'granted') {
            const token = (await Notifications.getDevicePushTokenAsync()).data;
            return token;
        }
    }
    return null;
};


