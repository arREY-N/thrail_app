import { IBusinessSummary } from "@/src/core/models/Business/Business";
import { IOfferSummary } from "@/src/core/models/Offer/Offer";
import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export interface IReceipt<T> {
    id?: string;
    date: T;
    amount: number;
    refundedAmount?: number;
    gateway: string;
    referenceCode?: string;
}

export interface IPaymentBase<T> {
    id: string;
    bookingId?: string;
    gatewayId?: string;
    gateway?: string;
    method?: string;
    status?: 'captured' | 'refunded';
    createdAt: T;
    updatedAt: T;
    refundedAt?: T;
    refundReason?: string;
    receipt: IReceipt<T>;
    offer: IOfferSummary<T>;
    business: IBusinessSummary;
    user: IUserSummary;
}

export type IPaymentDB = IPaymentBase<Timestamp | FieldValue>;
export type Payment = IPaymentBase<Date>;
export type IPayment = Payment;

export interface IPaymentSummary<T> {
    id: string;
    date: T;
    amount: number;
}
