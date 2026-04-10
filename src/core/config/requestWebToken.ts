import { getFirebaseMessaging } from "@/src/core/config/Firebase";
import { getToken } from "firebase/messaging";

const requestWebToken = async () => {
  const messaging = await getFirebaseMessaging();

  if (!messaging) return;

  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.EXPO_PUBLIC_VAPID_KEY 
    });

    if (currentToken) {
      console.log("Web FCM Token:", currentToken);
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
};