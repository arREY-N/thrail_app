import { IRescheduleDB, Reschedule } from "@/src/core/models/Reschedule/interfaces/Reschedule.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newReschedule = (
    required: Pick<Reschedule, "businessId" | "userId" | "cancellationId" | "oldOfferId" | "newOfferId">,
    optional: Partial<Pick<Reschedule, "id" | "status" | "createdAt" | "updatedAt">> = {}
): Reschedule => {
    if (!required.businessId) {
        throw new Error("Business ID is required to create a reschedule request.");
    }

    if (!required.userId) {
        throw new Error("User ID is required to create a reschedule request.");
    }

    if (!required.cancellationId) {
        throw new Error("Cancellation ID is required to create a reschedule request.");
    }

    if (!required.oldOfferId) {
        throw new Error("Old Offer ID is required to create a reschedule request.");
    }

    if (!required.newOfferId) {
        throw new Error("New Offer ID is required to create a reschedule request.");
    }

    return {
        id: '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...required,
        ...optional,
    };
};

const rescheduleFromFirestore = (id: string, data: IRescheduleDB): Reschedule => {
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
    };
};

const rescheduleToFirestore = (reschedule: Reschedule): IRescheduleDB => {
    return {
        id: reschedule.id,
        businessId: reschedule.businessId,
        cancellationId: reschedule.cancellationId,
        oldOfferId: reschedule.oldOfferId,
        newOfferId: reschedule.newOfferId,
        userId: reschedule.userId,
        status: reschedule.status,
        createdAt: reschedule.createdAt ? Timestamp.fromDate(toDate(reschedule.createdAt)) : serverTimestamp(),
        updatedAt: reschedule.updatedAt ? Timestamp.fromDate(toDate(reschedule.updatedAt)) : serverTimestamp(),
    };
};

export const rescheduleConverter: FirestoreDataConverter<Reschedule> = {
    toFirestore: (reschedule: Reschedule): IRescheduleDB => {
        return rescheduleToFirestore(reschedule);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Reschedule => {
        const data = snapshot.data() as IRescheduleDB;
        return rescheduleFromFirestore(snapshot.id, data);
    },
};