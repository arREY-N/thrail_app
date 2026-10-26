import { FieldValue, Timestamp } from "firebase/firestore";
import { IApplicationBase } from "@/src/core/models/Application/Application";

export interface IBusinessPaymentConfig<T = Date> {
    qrCodeUrl: string;
    accountName?: string;
    accountNumber?: string;
    providerName?: 'GCash' | 'Maya' | string;
    updatedAt: T;
    updatedBy: string;
}

export interface IBusinessBase<T> extends Omit<IApplicationBase<T>, 'status' | 'message'> {
    active: boolean;
    paymentConfig?: IBusinessPaymentConfig<T>;
}

export type IBusinessDB = IBusinessBase<Timestamp | FieldValue>;
export type Business = IBusinessBase<Date>;
export type IBusiness = Business;

export interface IBusinessSummary {
    id: string;
    name: string;
    paymentConfig?: IBusinessPaymentConfig<Date>;
}
