import { Group, IGroup, IGroupDB } from "@/src/core/models/Group/interfaces/Group.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newGroup = (groupData: Partial<IGroup> = {}): Group => {
    return {
        id: '',
        type: 'group',
        createdAt: new Date(),
        updatedAt: new Date(),
        participantsIds: [],
        members: [],
        admins: [],
        business: {
            id: '',
            name: '',
        },
        trail: {
            id: '',
            name: '',
            location: ''
        },
        offer: {
            id: "",
            schedule: [],
            date: new Date(),
            endDate: new Date(),
            duration: "",
            price: 0,
            maxPax: 0,
            minPax: 0,
            reservedPax: 0,
            documents: [],
            inclusions: [],
            thingsToBring: [],
            reminders: [],
            description: ""
        },
        status: "active",
        lastMessage: {
            id: '',
            content: '',
            senderId: '',
            senderName: '',
            timesent: new Date(),
            status: 'sent',
            readBy: []
        },
        image: '',
        ...groupData
    }   
}

export const groupFromFirestore = (id: string, data: IGroupDB): Group => {
    return {
        ...data,
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        offer: {
            ...data.offer,
            date: toDate(data.offer.date),
            endDate: toDate(data.offer.endDate),
            schedule: (data.offer?.schedule ?? []).map(s => ({
                ...s,
                activities: (s.activities ?? []).map(a => ({
                    ...a,
                    time: toDate(a.time)
                }))
            }))
        },
        lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timesent: toDate(data.lastMessage.timesent)
        } : null,
        participantsIds: data.participantsIds ?? []
    }
}

export const groupToFirestore = (group: Group): IGroupDB => {
    const isNew = group.id === '';

    const mapped: IGroupDB = {
        id: group.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(group.createdAt),
        updatedAt: serverTimestamp(),
        type: group.type,
        members: group.members,
        participantsIds: group.participantsIds,
        admins: group.admins,
        business: group.business,
        trail: group.trail,
        offer: {
            id: group.offer.id,
            duration: group.offer.duration,
            price: group.offer.price,
            maxPax: group.offer.maxPax,
            minPax: group.offer.minPax,
            reservedPax: group.offer.reservedPax,
            documents: group.offer.documents,
            inclusions: group.offer.inclusions,
            thingsToBring: group.offer.thingsToBring,
            reminders: group.offer.reminders,
            description: group.offer.description,
            date: Timestamp.fromDate(group.offer.date || new Date()),
            endDate: isNew ? serverTimestamp() : Timestamp.fromDate(group.offer.endDate || new Date()),
            schedule: group.offer.schedule.map(s => ({
                day: s.day,
                activities: s.activities.map(a => ({
                    event: a.event,
                    time: Timestamp.fromDate(a.time || new Date())
                }))
            }))
        },
        lastMessage: group.lastMessage === null 
            ? null 
            : {
                ...group.lastMessage,
                timesent: Timestamp.fromDate(group.lastMessage.timesent)
            },
        status: group.status,
        image: group.image
    };

    return mapped;
}

export const GroupConverter: FirestoreDataConverter<Group> = {
    toFirestore: (group: Group) => {
        return groupToFirestore(group);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Group => {
        const data = snapshot.data() as IGroupDB;
        return groupFromFirestore(snapshot.id, data);
    }
}
