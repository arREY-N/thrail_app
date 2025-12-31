import { db } from '@/src/core/config/Firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function fetchAllApplications(){
    try{
        const ref = collection(db, 'applications');

        const snapshot = await getDocs(ref);

        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        }));
    } catch (err) {
        throw new Error(err);
    }
}