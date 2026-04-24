import { db } from "@/src/core/config/Firebase";
import { Notification, NotificationConverter } from "@/src/core/models/Notification/Notification";
import { Unsubscribe } from "firebase/auth";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";

class NotificationRepositoryImpl {
    listenToNotifications(userId: string, onUpdate: (notifications: Notification[]) => void): Unsubscribe {
        try {
            const colRef = collection(db, 'users', userId, 'notifications').withConverter(NotificationConverter);
    
            return onSnapshot(colRef, (snapshot) => {
                onUpdate(snapshot.docs.map(doc => doc.data()));
            })
        } catch (error) {
            console.error("Failed to listen to notifications:", error);
            throw error;
        }
    }

    async readNotification(userId: string, notifId: string): Promise<void> {   
        try {
            const docRef = doc(db, 'users', userId, 'notifications', notifId).withConverter(NotificationConverter);
    
            await updateDoc(docRef, { read: true });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            throw error;
        }
    }
}

export const NotificationRepository = new NotificationRepositoryImpl();