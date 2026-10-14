import { db } from "@/src/core/config/Firebase";
import { Notification } from "@/src/core/models/Notification/interfaces/Notification.types";
import { newNotification, notificationConverter } from "@/src/core/models/Notification/utils/NotificationFactory";
import {
    collection,
    deleteDoc,
    doc,
    Firestore,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    Unsubscribe,
    updateDoc,
} from "firebase/firestore";

export const NotificationRepository = (db: Firestore) => {
    const createNotificationsCollection = (userId: string) => {
        return collection(db, 'users', userId, 'notifications').withConverter(notificationConverter);
    };

    return {
        listenToNotifications(userId: string, onUpdate: (notifications: Notification[]) => void): Unsubscribe {
            try {
                const colRef = createNotificationsCollection(userId);
                const q = query(colRef, orderBy('createdAt', 'desc'));

                return onSnapshot(q, (snapshot) => {
                    onUpdate(snapshot.docs.map(doc => doc.data()));
                }, (error) => {
                    console.error("Failed to listen to notifications:", error);
                });
            } catch (error) {
                console.error("Failed to listen to notifications:", error);
                throw error;
            }
        },

        async readNotification(userId: string, notifId: string): Promise<void> {
            try {
                const docRef = doc(db, 'users', userId, 'notifications', notifId).withConverter(notificationConverter);
                await updateDoc(docRef, { read: true });
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
                throw error;
            }
        },

        async fetchByUserId(userId: string): Promise<Notification[]> {
            try {
                const colRef = createNotificationsCollection(userId);
                const q = query(colRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => d.data());
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                throw error;
            }
        },

        async write(userId: string, data: Notification): Promise<Notification> {
            try {
                let notification = data;
                const colRef = createNotificationsCollection(userId);
                const docRef = data.id ? doc(colRef, data.id) : doc(colRef);

                if (!data.id) {
                    notification = newNotification({ ...data, id: docRef.id });
                }

                await setDoc(docRef, notification, { merge: true });
                return notification;
            } catch (error) {
                console.error("Failed to write notification:", error);
                throw error;
            }
        },

        async delete(userId: string, notifId: string): Promise<void> {
            try {
                const docRef = doc(db, 'users', userId, 'notifications', notifId);
                await deleteDoc(docRef);
            } catch (error) {
                console.error("Failed to delete notification:", error);
                throw error;
            }
        },
    };
};

export const NotificationRepo = NotificationRepository(db);

