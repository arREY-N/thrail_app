import { FieldValue, Timestamp } from "firebase/firestore";

interface IRescheduleBase<T> {
    id: string;
    cancellationId: string;
    businessId: string;
    oldOfferId: string;
    newOfferId: string;
    userId: string;
    status: "pending" | "approved" | "rejected";
    createdAt: T;
    updatedAt: T;
}

export interface RescheduleDB extends IRescheduleBase<Timestamp | FieldValue> {}
export interface Reschedule extends IRescheduleBase<Date> {}