import { db } from '@/src/core/config/Firebase';
import { ApplicationMapper } from '@/src/core/mapper/applicationMapper';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

export async function fetchApplications(){
    try{
        const ref = collection(db, 'applications');

        const snapshot = await getDocs(ref);

        if(snapshot.empty) return [];

        return snapshot.docs.map((docsnap) => ApplicationMapper.toUI({
            id: docsnap.id,
            ...docsnap.data()
        }));
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message);
    }
}

export async function fetchApplication(id){
    try {
        const docRef = doc(collection(db, 'applications'), id);

        const docsnap = await getDoc(docRef);

        if(!docsnap.exists()) return null;

        return ApplicationMapper.toUI({
            id: docsnap.id,
            ...docsnap.data()
        });
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message)
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