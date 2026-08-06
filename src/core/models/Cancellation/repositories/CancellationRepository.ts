import { cancellationConverter } from "@/src/core/models/Cancellation/Cancellation";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const createCancellationCollection = (db: any, businessId: string) => {
    return collection(db, 'businesses', businessId, 'cancellations').withConverter(cancellationConverter);
}

export const CancellationRepository = (db: any) => ({
    async write(businessId: string, cancellation: Cancellation) {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);
            
            const docRef = cancellation.id
                ? doc(cancellationsRef, cancellation.id)
                : doc(cancellationsRef);

            const cancellationData: Cancellation = {
                ...cancellation,
                id: docRef.id,
            }

            console.log("Writing cancellation to Firestore: ", cancellationData);
            await setDoc(
                docRef,
                cancellationData,
                { merge: true }
            )

            return cancellationData;
        } catch(error) {
            console.error("Error writing cancellation to Firestore:", error);
            throw error;
        }
    },

    async delete(businessId: string, id: string): Promise<void> {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);
            const docRef = doc(cancellationsRef, id);
            await deleteDoc(docRef);
        } catch(error) {
            console.error("Error deleting cancellation from Firestore:", error);
            throw error;
        }
    },

    async fetchById(businessId: string, id: string): Promise<Cancellation | null> {
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

    async fetchByBusinessId(businessId: string): Promise<Cancellation[]> {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);

            const snapshot = await getDocs(cancellationsRef);

            return snapshot.empty ? [] : snapshot.docs.map(docsnap => docsnap.data());
        } catch(error) {
            console.error("Error fetching cancellations by business ID from Firestore:", error);
            throw error;
        }
    },

    async fetchByOfferId(businessId: string, offerId: string): Promise<Cancellation[]> {
        try {
            const cancellationsRef = createCancellationCollection(db, businessId);

            const q = query(
                cancellationsRef, 
                where("offerId", "==", offerId)
            );

            const snapshot = await getDocs(q);
            
            return snapshot.empty ? [] : snapshot.docs.map(docsnap => docsnap.data());
        } catch(error) {
            console.error("Error fetching cancellations by offer ID from Firestore:", error);
            throw error;
        }
    },

    async fetchAll(): Promise<Cancellation[]> {
        try {
            const cancellationsRef = collectionGroup(db, 'cancellations').withConverter(cancellationConverter);
            const snapshot = await getDocs(cancellationsRef);
            return snapshot.empty ? [] : snapshot.docs.map(docsnap => docsnap.data());
        } catch(error) {
            console.error("Error fetching all cancellations from Firestore:", error);
            throw error;
        }
    }
})