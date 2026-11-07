import { IMessageDB, Message } from "@/src/core/models/Message/interfaces/Message.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newMessage = (init?: Partial<Message>): Message => {
    return {
        id: '',
        content: '',
        senderId: '',
        senderName: '',
        timesent: new Date(),
        status: 'sending',
        readBy: [],
        ...init,
        ...(init?.timesent ? { timesent: toDate(init.timesent) } : {}),
    };
};

const messageFromFirestore = (id: string, data: IMessageDB): Message => {
    return {
        id,
        content: data.content ?? '',
        senderId: data.senderId ?? '',
        senderName: data.senderName ?? '',
        timesent: toDate(data.timesent),
        status: data.status ?? 'sending',
        readBy: data.readBy ?? [],
        coordinates: data.coordinates
    };
};

const messageToFirestore = (message: Message): IMessageDB => {
    const isNew = message.id === '';

    const obj: IMessageDB = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        readBy: message.readBy || [],
        status: message.status,
        timesent: isNew ? serverTimestamp() : Timestamp.fromDate(toDate(message.timesent)),
    };

    if (message.coordinates && message.coordinates.lat && message.coordinates.long) obj.coordinates = message.coordinates

    return obj;
};

export const messageConverter: FirestoreDataConverter<Message> = {
    toFirestore: (message: Message) => {
        return messageToFirestore(message);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Message => {
        const data = snapshot.data() as IMessageDB;
        return messageFromFirestore(snapshot.id, data);
    },
};
