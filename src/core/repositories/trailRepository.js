import { db } from '@/src/core/config/Firebase';
import { TrailMapper } from '@/src/core/mapper/trailMapper';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const trailsCollection = collection(db, 'trails');

export async function fetchAllTrails(){
    try {
        const snapshot = await getDocs(trailsCollection);

        return snapshot.docs.map((docsnap) => TrailMapper.toUI(docsnap.data()));
    } catch (err) {
        throw new Error(err);
    }
}

export async function fetchTrailById(id){
    try {
        const ref = doc(db, 'trail', id);
        const snap = await getDoc(ref);

        if(!snap.exists()) return null;
        
        return TrailMapper.toUI(snap.data());
    } catch (err) {
        throw new Error(err)
    }
}

export async function saveTrail(trailData){
    try {
        const docRef = trailData.id 
        ? doc(db, 'trails', trailData.id)
        : doc(collection(db, 'trails'));

        const trail = TrailMapper.toDB({id: docRef.id, ...trailData});
        console.log('Trail in repo: ', trail);
        
        await setDoc(docRef, trail, { merge: true });

        return TrailMapper.toUI(trail);
    } catch (err) {
        throw new Error(err);
    }
}

export async function deleteTrail(id){
    try {
        const docRef = doc(db, 'trails', id);
        await deleteDoc(docRef);
        return id;
    } catch (err) {
        throw new Error(err);
    }
}

export async function getTrailMap(id){
    console.log('Map for ', id);

    return { map: 'Map to be added'}
}