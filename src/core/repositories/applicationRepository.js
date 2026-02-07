import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

export async function fetchApplications(){
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

export async function createApplication(businessData){
    try{
        const appRef = doc(db, 'applications', businessData.userId);
        
        const docsnap = await getDoc(appRef);

        if(docsnap.exists())
            throw new Error('You have already submitted an application.');

        await setDoc(appRef, {
            ...businessData,
            approved: null,
            createdAt: serverTimestamp()
        },{merge: true});

        return businessData.userId;
    } catch (err) {
        throw new Error(err.message);
    }
}