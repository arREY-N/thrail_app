import { FieldValue, Timestamp } from "firebase/firestore";

interface CancellationBase<T> {
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

export interface Cancellation extends CancellationBase<Date> {}

export interface CancellationDB extends CancellationBase<Timestamp | FieldValue> {}
