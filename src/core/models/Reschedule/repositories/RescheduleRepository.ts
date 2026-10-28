import { db } from "@/src/core/config/Firebase";
import { BookingStatus } from "@/src/core/models/Booking/interfaces/Booking.types";
import { Reschedule } from "@/src/core/models/Reschedule/interfaces/Reschedule.types";
import { rescheduleConverter } from "@/src/core/models/Reschedule/utils/RescheduleFactory";
import {
    collection,
    collectionGroup,
    deleteField,
    doc,
    Firestore,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

const createRescheduleCollection = (db: Firestore, businessId: string) => {
    return collection(db, 'businesses', businessId, 'reschedules').withConverter(rescheduleConverter);
};

export const RescheduleRepository = (db: Firestore) => ({
    async write(reschedule: Reschedule): Promise<Reschedule> {
        try {
            const isNew = !reschedule.id;

            const rescheduleRef = isNew
                ? doc(createRescheduleCollection(db, reschedule.businessId))
                : doc(createRescheduleCollection(db, reschedule.businessId), reschedule.id);

            if (isNew) {
                reschedule.id = rescheduleRef.id;
            }

            await setDoc(
                rescheduleRef,
                reschedule,
                { merge: true }
            );

            return reschedule;
        } catch (err) {
            throw err;
        }
    },

    /**
     * Submits a user reschedule request atomically:
     * 1. Creates/updates the Reschedule document under businesses/{businessId}/reschedules
     * 2. Updates the Booking document under users/{userId}/bookings/{bookingId} to status 'for-reschedule'
     */
    async submitUserRescheduleRequest(reschedule: Reschedule): Promise<Reschedule> {
        try {
            console.log(reschedule);
            const batch = writeBatch(db);

            const rescheduleCol = createRescheduleCollection(db, reschedule.businessId);
            const rescheduleRef = reschedule.id ? doc(rescheduleCol, reschedule.id) : doc(rescheduleCol);
            reschedule.id = rescheduleRef.id;

            // 1. Set Reschedule document
            batch.set(rescheduleRef, reschedule, { merge: true });

            // 2. Update Booking status to 'for-reschedule'
            const bookingRef = doc(db, 'users', reschedule.userId, 'bookings', reschedule.bookingId);
            batch.update(bookingRef, {
                status: 'for-reschedule',
                rescheduleRequestId: reschedule.id,
                rescheduledToOfferId: reschedule.newOfferId,
                updatedAt: serverTimestamp(),
            });

            await batch.commit();
            return reschedule;
        } catch (err) {
            throw err;
        }
    },

    /**
     * Allows a user to withdraw/cancel their pending reschedule request:
     * 1. Deletes or marks the Reschedule document as cancelled
     * 2. Reverts the Booking status back to previous status (e.g. 'paid' or 'downpayment')
     */
    async withdrawUserRescheduleRequest(
        businessId: string,
        rescheduleId: string,
        userId: string,
        bookingId: string,
        revertStatus: BookingStatus = 'paid'
    ): Promise<void> {
        try {
            const batch = writeBatch(db);

            const rescheduleRef = doc(createRescheduleCollection(db, businessId), rescheduleId);
            batch.delete(rescheduleRef);

            const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
            batch.update(bookingRef, {
                status: revertStatus,
                rescheduleRequestId: deleteField(),
                rescheduledToOfferId: deleteField(),
                updatedAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (err) {
            throw err;
        }
    },

    /**
     * Declines a reschedule request from an admin:
     * 1. Updates Reschedule document status to 'rejected' and records adminNote
     * 2. Reverts Booking status back to revertStatus (e.g. 'completed' or 'downpayment')
     *    and records rescheduleDeclineReason
     */
    async rejectRescheduleRequest(
        businessId: string,
        rescheduleId: string,
        userId: string,
        bookingId: string,
        reason: string,
        revertStatus: BookingStatus = 'completed'
    ): Promise<void> {
        try {
            const batch = writeBatch(db);

            const rescheduleRef = doc(createRescheduleCollection(db, businessId), rescheduleId);
            batch.update(rescheduleRef, {
                status: 'rejected',
                adminNote: reason,
                updatedAt: serverTimestamp(),
            });

            const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
            batch.update(bookingRef, {
                status: revertStatus,
                rescheduleRequestId: rescheduleId,
                rescheduledToOfferId: deleteField(),
                rescheduleDeclineReason: reason,
                updatedAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (err) {
            throw err;
        }
    },

    /**
     * Hiker dismisses the declined reschedule request notice:
     * Clears the reschedule reference and decline reason from the booking document.
     */
    async dismissRescheduleDecline(
        userId: string,
        bookingId: string
    ): Promise<void> {
        try {
            const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                rescheduleRequestId: deleteField(),
                rescheduleDeclineReason: deleteField(),
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            throw err;
        }
    },

    async fetchById(businessId: string, rescheduleId: string): Promise<Reschedule | null> {
        try {
            const rescheduleRef = doc(createRescheduleCollection(db, businessId), rescheduleId);
            const rescheduleSnap = await getDoc(rescheduleRef);

            if (!rescheduleSnap.exists()) {
                return null;
            }

            return rescheduleSnap.data();
        } catch (err) {
            throw err;
        }
    },

    async fetchAllByBusinessId(businessId: string): Promise<Reschedule[]> {
        try {
            const rescheduleCollection = createRescheduleCollection(db, businessId);
            const rescheduleSnapshot = await getDocs(rescheduleCollection);
            return rescheduleSnapshot.docs.map(docSnap => docSnap.data());
        } catch (err) {
            throw err;
        }
    },

    async fetchAll(): Promise<Reschedule[]> {
        try {
            const rescheduleCollection = collectionGroup(db, 'reschedules').withConverter(rescheduleConverter);
            const rescheduleSnapshot = await getDocs(rescheduleCollection);
            return rescheduleSnapshot.docs.map(docSnap => docSnap.data());
        } catch (err) {
            throw err;
        }
    },

    async fetchAllUserReschedules(userId: string): Promise<Reschedule[]> {
        try {
            const rescheduleCollection = collectionGroup(db, 'reschedules').withConverter(rescheduleConverter);

            const q = query(
                rescheduleCollection,
                where('userId', '==', userId)
            );

            const rescheduleSnapshot = await getDocs(q);
            return rescheduleSnapshot.docs.map(docSnap => docSnap.data());
        } catch (err) {
            throw err;
        }
    },

    listenToUserReschedules(
        userId: string,
        onUpdate: (reschedules: Reschedule[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        const rescheduleCollection = collectionGroup(db, 'reschedules').withConverter(rescheduleConverter);
        const q = query(rescheduleCollection, where('userId', '==', userId));

        return onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map(docSnap => docSnap.data());
                onUpdate(list);
            },
            (error) => {
                console.error("Error listening to user reschedules:", error);
                if (onError) onError(error);
            }
        );
    },

    listenToBusinessReschedules(
        businessId: string,
        onUpdate: (reschedules: Reschedule[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        if (!businessId) {
            throw new Error('Business ID missing');
        }

        const rescheduleCollection = createRescheduleCollection(db, businessId);
        return onSnapshot(
            rescheduleCollection,
            (snapshot) => {
                const list = snapshot.docs.map(docSnap => docSnap.data());
                onUpdate(list);
            },
            (error) => {
                console.error("Error listening to business reschedules:", error);
                if (onError) onError(error);
            }
        );
    },

    listenToRescheduleById(
        businessId: string,
        rescheduleId: string,
        onUpdate: (reschedule: Reschedule | null) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        if (!businessId || !rescheduleId) return () => {};

        const rescheduleRef = doc(createRescheduleCollection(db, businessId), rescheduleId);
        return onSnapshot(
            rescheduleRef,
            (snap) => {
                if (snap.exists()) {
                    onUpdate(snap.data());
                } else {
                    onUpdate(null);
                }
            },
            (error) => {
                console.error("Error listening to reschedule document:", error);
                if (onError) onError(error);
            }
        );
    },
});

export const RescheduleRepo = RescheduleRepository(db);