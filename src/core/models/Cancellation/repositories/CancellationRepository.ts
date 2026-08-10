
import { cancellationConverter } from "@/src/core/models/Cancellation/CancellationFactory";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { collection, collectionGroup, deleteDoc, doc, Firestore, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const createCancellationCollection = (db: Firestore, businessId: string) => {
    return collection(db, 'businesses', businessId, 'cancellations').withConverter(cancellationConverter);
}

export const CancellationRepository = (db: Firestore) => ({
    /**
     * Writes a cancellation to Firestore. If the cancellation has an empty ID, it will create a new document; otherwise, it will update the existing document.
     * @param businessId - The ID of the business to which the cancellation belongs. 
     * @param cancellation - The cancellation object to be written to Firestore.
     * @returns The written cancellation object, including its ID if it was newly created.
     */
    async write(businessId: string, cancellation: Cancellation) {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);
            
            const isNew = cancellation.id === "";

            const docRef = isNew
                ? doc(cancellationsRef)
                : doc(cancellationsRef, cancellation.id);

            const updated: Cancellation = {
                ...cancellation,
                id: isNew ? docRef.id : cancellation.id,
            }

            await setDoc(
                docRef,
                updated,
                { merge: true }
            )

            return updated;
        } catch(error) {
            console.error("Error writing cancellation to Firestore:", error);
            throw error;
        }
    },

    /**
     * Fetches a cancellation by its ID from Firestore.
     * @param businessId - The ID of the business to which the cancellation belongs.
     * @param id - The ID of the cancellation to be fetched.
     * @returns The fetched cancellation object if it exists, or null if it does not exist. 
     */
    async fetchCancellation(businessId: string, id: string): Promise<Cancellation | null> {
        try {
            const cancellationRef = createCancellationCollection(db, businessId);
            const docRef = doc(cancellationRef, id);
            const snapshot = await getDoc(docRef);

            return snapshot.exists() ? snapshot.data() : null;
        } catch(error) {
            console.error("Error fetching cancellation by ID from Firestore:", error);
            throw error;
        }
    },
    
    /**
     * Fetches all cancellations for a specific user from Firestore.
     * @param userId - The ID of the user whose cancellations are to be fetched.
     * @returns A list of cancellation objects associated with the specified user.
     */
    async fetchAllUserCancellations(userId: string): Promise<Cancellation[]> {
        try {
            const cancellationsRef = collectionGroup(db, 'cancellations').withConverter(cancellationConverter);
            const q = query(
                cancellationsRef, 
                where("userId", "==", userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (error) {
            console.error("Error fetching all user cancellations from Firestore:", error);
            throw error;
        }
    },

    /**
     * Deletes a cancellation by its ID from Firestore.
     * @param businessId - The ID of the business to which the cancellation belongs.
     * @param id - The ID of the cancellation to be deleted.
     */
    async delete(businessId: string, id: string): Promise<void> {
        try {
            console.log(`businesses/${businessId}/cancellations/${id}`);
            const cancellationsRef = createCancellationCollection(db, businessId);
            const docRef = doc(cancellationsRef, id);
            await deleteDoc(docRef);
        } catch(error) {
            console.error("Error deleting cancellation from Firestore:", error);
            throw error;
        }
    },
    
    /**
     * Fetches all cancellations for a specific business from Firestore. 
     * @param businessId - The ID of the business whose cancellations are to be fetched.
     * @returns A list of cancellation objects associated with the specified business.
     */
    async fetchAllBusinessCancellations(businessId: string): Promise<Cancellation[]> {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);

            const snapshot = await getDocs(cancellationsRef);

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch(error) {
            console.error("Error fetching cancellations by business ID from Firestore:", error);
            throw error;
        }
    },

    /**
     * Fetches all cancellations for a specific offer from Firestore.
     * @param businessId - The ID of the business to which the offer belongs.
     * @param offerId - The ID of the offer whose cancellations are to be fetched.
     * @returns A list of cancellation objects associated with the specified offer.
     */
    async fetchAllOfferCancellations(businessId: string, offerId: string): Promise<Cancellation[]> {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);

            const q = query(
                cancellationsRef, 
                where("offerId", "==", offerId)
            );

            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch(error) {
            console.error("Error fetching cancellations by offer ID from Firestore:", error);
            throw error;
        }
    },
})