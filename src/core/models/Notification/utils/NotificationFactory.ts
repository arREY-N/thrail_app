import { INotificationDB, Notification } from "@/src/core/models/Notification/interfaces/Notification.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newNotification = (init?: Partial<Notification>): Notification => {
    return {
        id: '',
        title: '',
        message: '',
        createdAt: new Date(),
        read: false,
        metadata: undefined,
        ...init,
        ...(init?.createdAt ? { createdAt: toDate(init.createdAt) } : {}),
    };
};

const notificationFromFirestore = (id: string, data: INotificationDB): Notification => {
    return {
        id,
        title: data.title ?? '',
        message: data.message ?? '',
        createdAt: toDate(data.createdAt),
        read: data.read ?? false,
        metadata: data.metadata,
    };
};

const notificationToFirestore = (notification: Notification): INotificationDB => {
    const isNew = notification.id === '';

    const mapped: INotificationDB = {
        id: notification.id,
        title: notification.title ?? '',
        message: notification.message ?? '',
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(toDate(notification.createdAt)),
        read: notification.read ?? false,
    };

    if (notification.metadata) {
        mapped.metadata = notification.metadata;
    }

    return mapped;
};

export const notificationConverter: FirestoreDataConverter<Notification> = {
    toFirestore: (notification: Notification) => {
        return notificationToFirestore(notification);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Notification => {
        const data = snapshot.data() as INotificationDB;
        return notificationFromFirestore(snapshot.id, data);
    },
};
