import { FieldValue, Timestamp } from "firebase/firestore";
import { IBusinessSummary } from "../Business/Business.types";
import { IOfferSummary } from "../Offer/Offer.types";
import { IUserSummary } from "../User/User.types";

export interface IReceipt<T>{
    id: string;
    date: T;
    amount: number;
    gateway: string;
    referenceCode?: string;
}

export interface IPaymentBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    receipt: IReceipt<T>;
    offer: IOfferSummary<T>,
    business: IBusinessSummary,
    user: IUserSummary
}

export interface IPaymentDB extends IPaymentBase<Timestamp | FieldValue>{}
export interface IPayment extends IPaymentBase<Date>{}

export interface IPaymentSummary<T> {
    id: string;
    date: T;
    amount: number;
}