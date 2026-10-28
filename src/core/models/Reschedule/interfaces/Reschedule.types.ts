import { FieldValue, Timestamp } from "firebase/firestore";

export interface IRescheduleBase<T> {
    id: string;
    bookingId: string;
    businessId: string;
    oldOfferId: string;
    newOfferId: string;
    userId: string;
    status: "pending" | "approved" | "rejected";
    cancellationId?: string;
    reason?: string;
    adminNote?: string;
    createdAt: T;
    updatedAt: T;
}

export type IRescheduleDB = IRescheduleBase<Timestamp | FieldValue>;
export type RescheduleDB = IRescheduleDB;
export type Reschedule = IRescheduleBase<Date>;
export type IReschedule = Reschedule;
