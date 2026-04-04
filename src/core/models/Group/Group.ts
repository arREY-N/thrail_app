import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IGroup, IGroupDB } from "@/src/core/models/Group/Group.types";
import { IMessageBase } from "@/src/core/models/Message/Message.types";
import { IOfferBase } from "@/src/core/models/Offer/Offer.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Group implements IGroup {
    [key: string]: any;
    [immerable] = true;

    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    members: IUserSummary[] = [];
    memberIds: string[] = [];
    admins: IUserSummary[] = [];
    adminIds: string[] = [];
    business: IBusinessSummary = {
        id: '',
        name: '',
    };
    trail: ITrailSummary = {
        id: '',
        name: '',
    };
    offer: Omit<IOfferBase<Date>, 'business' | 'trail' | 'createdAt' | 'updatedAt'> = {
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
    };
    status: "active" | "archived" = "active";
    lastMessage: IMessageBase<Date> = {
        id: '',
        content: '',
        senderId: '',
        senderName: '',
        timesent: new Date(),
        status: 'sent',
        readBy: []
    };
    image: string = '';

    get GroupName(): string {
        return `${this.trail.name}_${this.business.name}_${this.offer.date.toISOString().split('T')[0]}`;
    }   

    constructor(init?: Partial<IGroup>) {
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IGroupDB): Group {
        const mapped: IGroup = {
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
            memberIds: data.memberIds ?? [],
            adminIds: data.adminIds ?? []
        };
        
        return new Group(mapped);
    }

    toFirestore(): IGroupDB {
        const isNew = this.id === '';

        const mapped: IGroupDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            members: this.members,
            memberIds: this.memberIds,
            admins: this.admins,
            adminIds: this.adminIds,
            business: this.business,
            trail: this.trail,
            offer: {
                id: this.offer.id,
                duration: this.offer.duration,
                price: this.offer.price,
                maxPax: this.offer.maxPax,
                minPax: this.offer.minPax,
                reservedPax: this.offer.reservedPax,
                documents: this.offer.documents,
                inclusions: this.offer.inclusions,
                thingsToBring: this.offer.thingsToBring,
                reminders: this.offer.reminders,
                description: this.offer.description,
                date: Timestamp.fromDate(this.offer.date),
                endDate: isNew ? serverTimestamp() : Timestamp.fromDate(this.offer.endDate),
                schedule: this.offer.schedule.map(s => ({
                    day: s.day,
                    activities: s.activities.map(a => ({
                        event: a.event,
                        time: Timestamp.fromDate(a.time)
                    }))
                }))
            },
            lastMessage: {
                id: this.lastMessage.id,
                content: this.lastMessage.content,
                senderId: this.lastMessage.senderId,
                senderName: this.lastMessage.senderName,
                status: this.lastMessage.status,
                readBy: this.lastMessage.readBy,
                timesent: Timestamp.fromDate(this.lastMessage.timesent)
            },
            status: this.status,
            image: this.image,
        };

        return mapped;
    }
}

export const GroupConverter: FirestoreDataConverter<Group> = {
    toFirestore: (group: Group) => {
        return group.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Group => {
        const data = snapshot.data() as IGroupDB;
        return Group.fromFirestore(snapshot.id, data);
    }
}