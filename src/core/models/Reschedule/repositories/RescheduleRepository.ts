import { Reschedule } from "@/src/core/models/Reschedule/interfaces/Reschedule.types";
import { rescheduleConverter } from "@/src/core/models/Reschedule/utils/RescheduleFactory";
import { collection, collectionGroup, doc, Firestore, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

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
});