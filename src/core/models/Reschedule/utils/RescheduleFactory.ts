import { Reschedule, RescheduleDB } from "@/src/core/models/Reschedule/interfaces/IReschedule";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp, serverTimestamp } from "firebase/firestore";

export const newReschedule = (
    required: Pick<Reschedule, "businessId" | "userId" | "cancellationId" | "oldOfferId" | "newOfferId">,
    optional: Partial<Pick<Reschedule, "id" | "status" | "createdAt">> = {}
): Reschedule => {
    if(!required.businessId) {
        throw new Error("Business ID is required to create a reschedule request.");
    }

    if(!required.userId) {
        throw new Error("User ID is required to create a reschedule request.");
    }

    if(!required.cancellationId) {
        throw new Error("Cancellation ID is required to create a reschedule request.");
    }

    if(!required.oldOfferId) {
        throw new Error("Old Offer ID is required to create a reschedule request.");
    }

    if(!required.newOfferId) {
        throw new Error("New Offer ID is required to create a reschedule request.");
    }
    
    return {
        id: '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...required,
        ...optional
    }
}

export const rescheduleFromFirestore = (id: string, data: RescheduleDB): Reschedule => {
    return {
        id,
        businessId: data.businessId,
        cancellationId: data.cancellationId,
        oldOfferId: data.oldOfferId,
        newOfferId: data.newOfferId,
        userId: data.userId,
        status: data.status,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
    }
}

export const rescheduleToFirestore = (reschedule: Reschedule): RescheduleDB => {
    return {
        id: reschedule.id,
        businessId: reschedule.businessId,
        cancellationId: reschedule.cancellationId,
        oldOfferId: reschedule.oldOfferId,
        newOfferId: reschedule.newOfferId,
        userId: reschedule.userId,
        status: reschedule.status,
        createdAt: reschedule.createdAt ? Timestamp.fromDate(reschedule.createdAt) : serverTimestamp(),
        updatedAt: reschedule.updatedAt ? Timestamp.fromDate(reschedule.updatedAt) : serverTimestamp(),
    }
}

export const rescheduleConverter: FirestoreDataConverter<Reschedule> = {
    toFirestore: (reschedule: Reschedule): RescheduleDB => {
        return rescheduleToFirestore(reschedule)
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot<RescheduleDB>): Reschedule => {
        const data = snapshot.data();
        return rescheduleFromFirestore(snapshot.id, data);
    }
};