import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export type Status = 'active' | 'removed';
export type AdminStatus = Status;

export interface IAdminBase<T> extends IUserSummary {
    createdAt: T;
    updatedAt: T;
    status: Status;
}

export type IAdminDB = IAdminBase<Timestamp | FieldValue>;
export type Admin = IAdminBase<Date>;
export type IAdmin = Admin;
