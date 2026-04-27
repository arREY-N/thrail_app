import { useNotificationsStore } from "@/src/core/stores/notificationsStore";
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from "react";
import { Platform } from 'react-native';


export const useNotifications = () => {
    const notifications = useNotificationsStore(s => s.notifications);
    
    const subscribeToNotifications = useNotificationsStore(s => s.subscribeToNotifications);

    useEffect(() => {
        const unsubscribe = subscribeToNotifications();

        return () => {
            if(unsubscribe) 
                unsubscribe();
        }
    },[subscribeToNotifications])

    const onViewNotification = (notificationId: string) => {
        if(notificationId){
            router.push({
                pathname: '/(main)/notification/view',
                params: {
                    notificationId
                }
            })
        }
    }

    return {
        notifications,
        onViewNotification
    }
}

export const requestNotificationPermission = async () => {
    console.log("Requesting notification permission...");
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log("Notification permission:", status);
        
        if (status === 'granted') {
            const token = (await Notifications.getDevicePushTokenAsync()).data;
            console.log("Device Push Token:", token);
            return token;
        }
    }
    return null;
};