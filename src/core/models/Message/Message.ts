import { IMessage, IMessageDB, MessageStatus } from "@/src/core/models/Message/Message.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Message implements IMessage{
    [key: string]: any;
    [immerable] = true;
    id: string = '';
    content: string = '';
    senderId: string = '';
    senderName: string = '';
    timesent: Date = new Date();
    status: MessageStatus = 'sending';
    readBy: IUserSummary[] = [];

    constructor(init?: Partial<IMessage>) {
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IMessageDB): Message {
        const mapped: IMessage = {
            ...data,
            id,
            timesent: toDate(data.timesent)
        }
        return new Message(mapped);
    }

    toFirestore(): IMessageDB {
        const isNew = this.id === '';

        const mapped: IMessageDB = {
            id: this.id,
            content: this.content,
            senderId: this.senderId,
            senderName: this.senderName,
            readBy: this.readBy,
            status: this.status,
            timesent: isNew ? serverTimestamp() : Timestamp.fromDate(this.timesent),
        }

        return mapped;
    }
}

export const MessageConverter: FirestoreDataConverter<Message> = {
    toFirestore: (message: Message) => {
        return message.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Message => {
        const data = snapshot.data() as IMessageDB;
        return Message.fromFirestore(snapshot.id, data);
    }
}