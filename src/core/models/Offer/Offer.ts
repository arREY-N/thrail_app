import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";
import { toDate } from "../../utility/date";
import { IBusinessSummary } from "../Business/Business.types";
import { ITrailSummary } from "../Trail/Trail.types";
import { IOffer, IOfferDB, ISchedule } from "./Offer.types";

export class Offer implements IOffer {
    [key: string]: any;
    [immerable] = true
    id: string =  '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    date: Date = new Date();
    endDate: Date = new Date(); // New
    duration: string = ''; // New
    description: string = '';
    price: number = 0;
    maxPax: number = 0;
    minPax: number = 0;
    reservedPax: number = 0;
    documents: string[] = [];
    inclusions: string[] = [];
    thingsToBring: string[] = []; // New
    reminders: string[] = []; // New
    business: IBusinessSummary = {
        id: "",
        name: ""
    };
    trail: ITrailSummary = {
        id: "",
        name: ""
    };
    schedule: ISchedule<Date>[] = [];

    constructor(init?: Partial<IOffer>){
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IOfferDB): Offer {
        const mapped: IOffer = {
            id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            business: data.business,
            trail: data.trail,
            date: toDate(data.date),
            endDate: toDate(data.endDate || data.date), // New
            duration: data.duration || '', // New
            price: data.price,
            maxPax: data.maxPax,
            minPax: data.minPax,
            reservedPax: data.reservedPax,
            documents: data.documents,
            inclusions: data.inclusions,
            thingsToBring: data.thingsToBring || [], // New
            reminders: data.reminders || [], // New
            description: data.description,
            schedule: data.schedule.map(sched => {
                return {
                    day: sched.day,
                    activities: sched.activities.map(activity => {
                        return {
                            ...activity,
                            time: toDate(activity.time),
                        }
                    })
                }
            }),
        }

        return new Offer(mapped);
    }

    toFirestore(): IOfferDB {
        const isNew = this.id === '';

        const mapped: IOfferDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            business: this.business,
            trail: this.trail,
            date: Timestamp.fromDate(this.date),
            endDate: Timestamp.fromDate(this.endDate), // New
            duration: this.duration, // New
            price: this.price,
            maxPax: this.maxPax,
            minPax: this.minPax,
            reservedPax: this.reservedPax,
            documents: this.documents,
            inclusions: this.inclusions,
            thingsToBring: this.thingsToBring, // New
            reminders: this.reminders, // New
            description: this.description,
            schedule: this.schedule.map(schedule => {
                return {
                    ...schedule,
                    activities: schedule.activities.map(activity => {
                        return {
                            ...activity,
                            time: Timestamp.fromDate(activity.time),
                        }
                    })                    
                }
            })
        } 

        return mapped;
    }
}

export const offerConverter: FirestoreDataConverter<Offer> = {
    toFirestore: (offer: Offer) => {
        return offer.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Offer => {
        const data = snapshot.data() as IOfferDB;
        return Offer.fromFirestore(snapshot.id, data);
    }
}
