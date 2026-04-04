import { IUserSummary } from "@/src/core/models/User/User.types";
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

export interface IMessageDB extends IMessageBase<Timestamp | FieldValue>{}
export interface IMessage extends IMessageBase<Date>{}