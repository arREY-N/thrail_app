import { db } from '@/src/core/config/Firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { MountainMapper } from '../mapper/mountainMapper';

const col = collection(db, 'mountains');

export async function fetchAllMountains(){
    try {
        const snapshot = await getDocs(col);

        if(snapshot.empty) return [];

        return snapshot.docs.filter(d => d.id !== 'init').map((docs) => MountainMapper.toUI(docs.data()));
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message || 'Failed fetching all mountains')
    }
}

export async function fetchMountain(id){
    try {
        const docRef = doc(col, id);
        const snapshot = await getDoc(docRef);

        if(!snapshot.exists()) return null;

        return MountainMapper.toUI(snapshot.data());
    } catch (err) {
        console.error(err.messsage);
        throw new Error(err.message || 'Failed fetching mountain', id)
    }
}

export async function fetchMountainByProvince(province){
    console.log('IMPLEMENT SOON')
}

export async function writeMountain(mountainData){
    try {
        const docRef = mountainData.id 
            ? doc(col, mountainData.id)
            : doc(col);

        const data = mountainData.id 
            ? {id: docRef.id, ...mountainData, updatedAt: serverTimestamp()}
            : {id: docRef.id, ...mountainData, createdAt: serverTimestamp(), updatedAt: serverTimestamp()}

        const mountain = MountainMapper.toDB(data)

        await setDoc(docRef, mountain, { merge: true });

        return data
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message || 'Failed writing mountain')
    }
}

export async function deleteMountain(id){
    try {
        const docRef = doc(col, id);
        await deleteDoc(docRef);
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message || 'Failed deleting mountain', id)
    }
}