import { Cancellation, CancellationDB } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export { createCancellationRequest as newCancellation };

export const createCancellationRequest = (
    required: Pick<Cancellation, "userId" | "bookingId" | "businessId" | "reason" | "offerId" | "cancelledBy">,
    optional: Partial<Pick<Cancellation, "id" | "status" | "createdAt" | "adminNote">> = {}
): Cancellation => {
    const currentDate = new Date();

    if(!required.userId) {
        throw new Error("User ID is required to create a cancellation request.");
    }

    if(!required.bookingId) {
        throw new Error("Booking ID is required to create a cancellation request.");
    }

    if(!required.businessId) {
        throw new Error("Business ID is required to create a cancellation request.");
    }

    if(!required.offerId) {
        throw new Error("Offer ID is required to create a cancellation request.");
    }

    if(!required.reason || required.reason.trim() === "") {
        throw new Error("Reason is required to create a cancellation request.");
    }

    if(!required.cancelledBy) {
        throw new Error("Cancelled By is required to create a cancellation request.");
    }

    if(optional.status && optional.status === "rejected" && (!optional.adminNote || optional.adminNote.trim() === "")) {
        throw new Error("Admin note is required when flagging a cancellation request as rejected.");
    }

    return {
        id: "",
        status: "pending",
        updatedAt: currentDate,
        createdAt: currentDate,
        ...required,
        ...optional,
    }
}

export const cancellationFromFirestore = (id: string, data: CancellationDB): Cancellation => {
    const request: Cancellation = {
        id,
        userId: data.userId,
        cancelledBy: data.cancelledBy,
        bookingId: data.bookingId,
        offerId: data.offerId,
        businessId: data.businessId,
        reason: data.reason,
        status: data.status,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
    }

    if(data.adminNote) {
        request.adminNote = data.adminNote;
    }

    return request;
}

export const cancellationToFirestore = (cancellation: Cancellation): CancellationDB => {
    const request: CancellationDB = {
        id: cancellation.id,
        userId: cancellation.userId,
        cancelledBy: cancellation.cancelledBy,
        bookingId: cancellation.bookingId,
        offerId: cancellation.offerId,
        businessId: cancellation.businessId,
        reason: cancellation.reason,
        status: cancellation.status,
        createdAt: cancellation.createdAt ? Timestamp.fromDate(cancellation.createdAt) : serverTimestamp(),
        updatedAt: cancellation.updatedAt ? Timestamp.fromDate(cancellation.updatedAt) : serverTimestamp(),
    }

    if(cancellation.adminNote) {
        request.adminNote = cancellation.adminNote;
    }

    return request;
}

export const cancellationConverter: FirestoreDataConverter<Cancellation> = {
    toFirestore: (cancellation: Cancellation): CancellationDB => {
        return cancellationToFirestore(cancellation)
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot<CancellationDB>): Cancellation => {
        const data = snapshot.data()
        return cancellationFromFirestore(snapshot.id, data)
    }
}