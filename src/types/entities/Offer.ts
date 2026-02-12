import { FieldValue, Timestamp } from "firebase/firestore";
import { Hours } from "../Unit";

type OfferTrail = {
    id: string;
    name: string;
}

export type OfferBusiness =  {
    id: string;
    name: string;
}

export interface OfferUI {
    id?: string;
    description: string;
    documents: string[];
    price: number;
    hikeDate: Date;
    hikeDuration: Hours;
    inclusions: string[];
    business: OfferBusiness 
    trail: OfferTrail;
    createdAt: Date;
}

export interface OfferDB{
    id?: string;
    business: {
        id: string;
        name: string;
    }, 
    general: {
        description: string;
        documents: string[];
        price: number;
    },
    hike: {
        date: Timestamp;
        duration: number;
        inclusions: string[];
    },
    trail: OfferTrail;
    createdAt: Timestamp | FieldValue;
}

export class OfferUI{
    description: string = '';
    documents: string[] = [];
    price: number = 0;
    hikeDate: Date = new Date();
    hikeDuration: Hours = 0;
    inclusions: string[] = [];
    business: OfferBusiness = { id: '', name: '' }
    trail: OfferTrail = { id: '', name: '' };
    createdAt: Date = new Date();

    constructor(init?: Partial<OfferUI>){
        Object.assign(this, init)
    }
   
}

export type UseOfferParams = {
    trailId: string | null,
    businessId: string | null,
    offerId: string | null,
    mode: string | null,
}