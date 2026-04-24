import { INotification, INotificationDB } from "@/src/core/models/Notification/Notification.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export class Notification implements INotification {
    id: string = '';
    title: string = '';
    message: string = '';
    createdAt: Date = new Date();
    read: boolean = false;
    metadata?: {} | undefined;

    constructor(init?: Partial<INotification>) {
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: INotificationDB): Notification {
        const mapped: INotification = {
            ...data,
            createdAt: toDate(data.createdAt),
            id,
        }

        return new Notification(mapped);
    }

    toFirestore(): INotificationDB {
        const isNew = this.id === ''
        
        const mapped: INotificationDB = {
            id: this.id,
            title: this.title,
            message: this.message,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            read: this.read,
        }

        if(this.metadata){
            mapped.metadata = this.metadata
        }

        return mapped;
    }
}

export const NotificationConverter: FirestoreDataConverter<Notification> = {
    toFirestore: (notification: Notification) => {
        return notification.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Notification => {
        const data = snapshot.data() as INotificationDB;
        return Notification.fromFirestore(snapshot.id, data);
    }
}