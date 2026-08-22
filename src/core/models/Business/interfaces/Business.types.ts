import { FieldValue, Timestamp } from "firebase/firestore";
import { IApplicationBase } from "@/src/core/models/Application/Application";

export interface IBusinessBase<T> extends Omit<IApplicationBase<T>, 'status' | 'message'> {
    active: boolean;
}

export type IBusinessDB = IBusinessBase<Timestamp | FieldValue>;
export type Business = IBusinessBase<Date>;
export type IBusiness = Business;

export interface IBusinessSummary {
    id: string;
    name: string;
}
