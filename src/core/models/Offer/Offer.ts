import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { toDate } from "../../utility/date";
import { IBusinessSummary } from "../Business/Business.types";
import { ITrailSummary } from "../Trail/Trail.types";
import { IOffer, IOfferDB } from "./Offer.types";

export class Offer implements IOffer {
    id: string =  '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    date: Date = new Date();
    description: string = '';
    price: number = 0;
    maxPax: number = 0;
    minPax: number = 0;
    reservedPax: number = 0;
    documents: string[] = [];
    inclusions: string[] = [];
    business: IBusinessSummary = {
        id: "",
        name: ""
    };
    trail: ITrailSummary = {
        id: "",
        name: ""
    };

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
            price: data.price,
            maxPax: data.maxPax,
            minPax: data.minPax,
            reservedPax: data.reservedPax,
            documents: data.documents,
            inclusions: data.inclusions,
            description: data.description
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
            price: this.price,
            maxPax: this.maxPax,
            minPax: this.minPax,
            reservedPax: this.reservedPax,
            documents: this.documents,
            inclusions: this.inclusions,
            description: this.description,
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
