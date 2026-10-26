import { useNotificationsStore } from "@/src/core/models/Notification/stores/notificationStore";
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';


export const useNotifications = () => {
    const notifications = useNotificationsStore(s => s.notifications);

    const onViewNotification = (notificationId: string) => {
        if (notificationId) {
            router.push({
                pathname: '/(app)/(main)/notification/view',
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

// Configure foreground notification handling (shows banner & plays sound when app is in foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#2E7D32',
                enableLights: true,
                enableVibrate: true,
            });
        }

        const { status } = await Notifications.requestPermissionsAsync();

        if (status === 'granted') {
            const token = (await Notifications.getDevicePushTokenAsync()).data;
            return token;
        }
    }
    return null;
};


