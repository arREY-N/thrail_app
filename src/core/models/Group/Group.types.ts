import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IMessageBase } from "@/src/core/models/Message/Message.types";
import { IOfferBase } from "@/src/core/models/Offer/Offer.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { FieldValue, Timestamp } from "firebase/firestore";

export interface IGroupBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    memberIds: string[];
    members: IUserSummary[];
    adminIds: string[];
    admins: IUserSummary[];
    business: IBusinessSummary;
    trail: ITrailSummary;
    offer: Omit<IOfferBase<T>, 'business' | 'trail' | 'createdAt' | 'updatedAt'>;
    status: 'active' | 'archived';
    lastMessage: IMessageBase<T> | null;
    image: string;

}

export interface IGroupDB extends IGroupBase<Timestamp | FieldValue> {}
export interface IGroup extends IGroupBase<Date>{}