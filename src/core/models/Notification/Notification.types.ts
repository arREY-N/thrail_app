import { FieldValue, Timestamp } from "firebase/firestore";

export interface NotificationBase<T> {
    id: string;
    title: string;
    message: string;
    createdAt: T;
    read: boolean;
    metadata?: {};
}

export interface INotificationDB extends NotificationBase<FieldValue | Timestamp>{}
export interface INotification extends NotificationBase<Date>{}