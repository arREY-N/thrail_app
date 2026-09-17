import { FieldValue, Timestamp } from "firebase/firestore";

export interface INotificationBase<T> {
    id: string;
    title: string;
    message: string;
    createdAt: T;
    read: boolean;
    metadata?: Record<string, any>;
}

export type INotificationDB = INotificationBase<FieldValue | Timestamp>;
export type Notification = INotificationBase<Date>;
export type INotification = Notification;
