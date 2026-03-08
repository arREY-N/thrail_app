import { FieldValue, Timestamp } from "firebase/firestore";
import { IApplicationBase } from "../Application/Application.types";

export interface IBusinessBase<T> extends Omit<IApplicationBase<T>, 'status' | 'message'>{
    active: boolean;
}

export interface IBusinessDB extends IBusinessBase<Timestamp | FieldValue>{}
export interface IBusiness extends IBusinessBase<Date>{}

export interface IBusinessSummary {
    id: string;
    name: string;
}