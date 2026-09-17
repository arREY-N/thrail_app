import { FieldValue, Timestamp } from "firebase/firestore";

export type Status = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface IOwner {
    id: string;
    name: string;
    email: string;
    validId: string;
}

export interface IBusinessInfo<T> {
    name: string;
    establishedOn: T;
    address: string;
    servicedLocation: string[];
}

export interface IPermit {
    bir: string;
    dti: string;
    denr: string;
}

export interface IApplicationBase<T> extends IBusinessInfo<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    status: Status;
    message: string;
    owner: IOwner;
    permits: IPermit;
}

export type IApplicationDB = IApplicationBase<Timestamp | FieldValue>;
export type Application = IApplicationBase<Date>;
export type IApplication = Application;
