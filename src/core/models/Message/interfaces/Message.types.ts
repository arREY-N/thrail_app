import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export interface IMessageBase<T> {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timesent: T;
    status: MessageStatus;
    readBy: IUserSummary[];
}

export type IMessageDB = IMessageBase<Timestamp | FieldValue>;
export type Message = IMessageBase<Date>;
export type IMessage = Message;
