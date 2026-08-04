import { IOffer, IOfferDB } from "@/src/core/models/Offer/Offer.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export interface Offer extends IOffer {}

export const createOffer = (init?: Partial<IOffer>): IOffer => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        date: new Date(),
        endDate: new Date(),
        duration: '',
        description: '',
        price: 0,
        maxPax: 0,
        minPax: 0,
        reservedPax: 0,
        documents: [],
        inclusions: [],
        thingsToBring: [],
        reminders: [],
        business: { id: "", name: "" },
        trail: { id: "", name: "" },
        schedule: [],
        ...init,
    };
};

export const offerFromFirestore = (id: string, data: IOfferDB): Offer => {
    return {
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
        schedule: (data.schedule ?? []).map(sched => {
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
}

export const offerToFirestore = (offer: Offer): IOfferDB => {
    const isNew = offer.id === '';
    
    return {
        id: offer.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(offer.createdAt),
        updatedAt: serverTimestamp(),
        business: offer.business,
        trail: offer.trail,
        date: Timestamp.fromDate(offer.date),
        endDate: Timestamp.fromDate(offer.endDate), // New
        duration: offer.duration, // New
        price: offer.price,
        maxPax: offer.maxPax,
        minPax: offer.minPax,
        reservedPax: offer.reservedPax,
        documents: offer.documents,
        inclusions: offer.inclusions,
        thingsToBring: offer.thingsToBring, // New
        reminders: offer.reminders, // New
        description: offer.description,
        schedule: offer.schedule.map(schedule => {
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
}

export const offerConverter: FirestoreDataConverter<Offer> = {
    toFirestore: (offer: Offer) => {
        return offerToFirestore(offer);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Offer => {
        const data = snapshot.data() as IOfferDB;
        return offerFromFirestore(snapshot.id, data);
    }
}
