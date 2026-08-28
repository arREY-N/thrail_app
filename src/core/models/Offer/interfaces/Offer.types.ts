import { IBusinessSummary } from "@/src/core/models/Business/Business";
import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { FieldValue, Timestamp } from "firebase/firestore";

export interface IOfferInfo<T> {
    date: T,
    endDate: T; // New
    duration: string; // New
    price: number,
    maxPax: number,
    minPax: number,
    reservedPax: number,
    documents: string[],
    inclusions: string[],
    thingsToBring: string[]; // New
    reminders: string[]; // New
    description: string,
}

export interface IActivity<T> {
    time: T,
    event: string;
}

export interface ISchedule<T> {
    day: number;
    activities: IActivity<T>[]
}

export interface IOfferBase<T> extends IOfferInfo<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    business: IBusinessSummary;
    trail: ITrailSummary;
    schedule: ISchedule<T>[];
    status?: string;
    hikeDate?: Date | Timestamp | FieldValue | null;
}

export type IOfferDB = IOfferBase<Timestamp | FieldValue>
export type IOffer = IOfferBase<Date>
export type Offer = IOffer

export interface IOfferSummary<T> {
    date: T;
    price: number;
}

export type OfferParams = {
    id: string,
    businessId: string,
}
