import { FieldValue, Timestamp } from "firebase/firestore";

export interface ICancellationBase<T> {
    id: string;
    userId: string;
    cancelledBy: 'user' | 'admin';
    bookingId: string;
    offerId: string;
    businessId: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    createdAt: T;
    updatedAt: T;
}

export type Cancellation = ICancellationBase<Date>;
export type ICancellation = Cancellation;

export type ICancellationDB = ICancellationBase<Timestamp | FieldValue>;
export type CancellationDB = ICancellationDB;

export type CancellationRequest = Required<Pick<Cancellation, 'reason' | 'offerId' | 'businessId' | 'bookingId'>>;
