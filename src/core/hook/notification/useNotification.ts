import { getFirebaseMessaging } from '@/src/core/config/Firebase';
import * as Notifications from 'expo-notifications';
import { getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';

export const requestNotificationPermission = async () => {
    console.log("Requesting notification permission...");
    if (Platform.OS === 'web') {
        const messaging = await getFirebaseMessaging();
              
        if (!messaging) return null;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log("Service Worker registered:", registration);

                await navigator.serviceWorker.ready; 
                console.log("Service Worker is now ACTIVE");

                const token = await getToken(messaging, { 
                    vapidKey: "BESRjEeG5ADY0nh4_i_LX1bJDgYgPYncjkTG13zBbIEN1EAXd_MUDK6h3m87aFT7aYqcnc3dWtcxjXrcuBLExPw",
                    serviceWorkerRegistration: registration 
                });
                
                return token;
            } catch (error) {
                console.error("Registration/Token failed:", error);
                return null;
            }
        }
    } else {
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


export const setupWebForegroundListener = async () => {
  if (Platform.OS === 'web') {
    const messagingInstance = await getFirebaseMessaging();

    if (messagingInstance) {
      onMessage(messagingInstance, (payload) => {
        console.log('Web Foreground Message:', payload);
        
        new Notification(payload.notification?.title || "Thrail Alert", {
          body: payload.notification?.body,
          icon: '/favicon.ico',
        });
      });
    }
  }
};

export const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: { someData: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}