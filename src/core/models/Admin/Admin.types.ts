import { FieldValue, Timestamp } from "firebase/firestore";
import { IUserSummary } from "../User/User.types";

export type Status = 'active' | 'removed';

export interface IAdminBase<T> extends IUserSummary{
    createdAt: T;
    updatedAt: T;
    status: Status;
}

export interface IAdminDB extends IAdminBase<Timestamp | FieldValue>{}
export interface IAdmin extends IAdminBase<Date>{}