import { FieldValue, Timestamp } from "firebase/firestore";
import { IBusinessSummary } from "../Business/Business.types";
import { ITrailSummary } from "../Trail/Trail.types";

export interface IOfferInfo<T> {
    date: T,
    price: number,
    maxPax: number,
    minPax: number,
    reservedPax: number,
    documents: string[],
    inclusions: string[],
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
}

export interface IOfferDB extends IOfferBase<Timestamp | FieldValue> {}
export interface IOffer extends IOfferBase<Date>{}

export interface IOfferSummary<T> {
    date: T;
    price: number;
}