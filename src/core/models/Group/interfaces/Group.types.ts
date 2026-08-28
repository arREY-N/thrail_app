import { IBusinessSummary } from "@/src/core/models/Business/Business";
import { IMessageBase } from "@/src/core/models/Message/Message";
import { IOfferBase } from "@/src/core/models/Offer/Offer";
import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export interface IGroupMember extends IUserSummary {
    bookingId?: string;
}

export interface IGroupBase<T> {
    id: string;
    createdAt: T;
    type: 'group' | 'chat';
    updatedAt: T;
    participantsIds: string[];
    members: IGroupMember[];
    admins: IUserSummary[];
    business: IBusinessSummary;
    trail: ITrailSummary;
    offer: Omit<IOfferBase<T>, 'business' | 'trail' | 'createdAt' | 'updatedAt'>;
    status: 'active' | 'archived';
    lastMessage: IMessageBase<T> | null;
    image: string;
}

export type IGroupDB = IGroupBase<Timestamp | FieldValue>;
export type Group = IGroupBase<Date>;
export type IGroup = Group;
