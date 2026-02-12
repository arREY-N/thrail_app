import { db } from '@/src/core/config/Firebase';
import { TrailMapper } from '@/src/core/mapper/trailMapper';
import { TrailDB, TrailUI } from '@/src/types/entities/Trail';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { BaseRepository } from '../interface/repositoryInterface';

const trailsCollection = collection(db, 'trails').withConverter({
    toFirestore: (trail: TrailDB) => trail,
    fromFirestore: (snapshot): TrailDB => snapshot.data() as TrailDB
});

class TrailRepositoryImpl implements BaseRepository<TrailUI>{
    async fetchAll(): Promise<TrailUI[]> {
        try {
            const snapshot = await getDocs(trailsCollection);

            return snapshot.docs.map((docsnap) => TrailMapper.toUI({
                ...docsnap.data(),
                id: docsnap.id,
            }));
        } catch (err: unknown) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }    
    }

    async fetchById(id: string): Promise<TrailUI | null> {
        try {
            const ref = doc(trailsCollection, id);
            const snap = await getDoc(ref);

            if(!snap.exists()) return null;
            
            const data = snap.data() as TrailDB
            const trailWithId = { ...data, id: snap.id }

            return TrailMapper.toUI(trailWithId);
        } catch (err) {
            if(err instanceof Error )throw err;
            throw new Error('An error occurred');
        }    
    }

    async write(data: TrailUI): Promise<TrailUI> {
        try {
            const docRef = data.id 
            ? doc(trailsCollection, data.id)
            : doc(trailsCollection);

            const trail = TrailMapper.toDB({id: docRef.id, ...data});
            console.log('Trail in repo: ', trail);
            
            await setDoc(docRef, trail, { merge: true });

            return TrailMapper.toUI(trail);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred');
        }    
    }

    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(trailsCollection, id);
            await deleteDoc(docRef);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred');
        }    
    }

    async getMap(id: string): Promise<any> {
        console.log('Map for ', id);
        return { map: 'Map to be added'}
    }
}

export const TrailRepository = new TrailRepositoryImpl();

// export async function fetchAllTrails(){
//     try {
//         const snapshot = await getDocs(trailsCollection);

//         return snapshot.docs.map((docsnap) => TrailMapper.toUI({
//             ...docsnap.data(),
//             id: docsnap.id,
//         }));
//     } catch (err: unknown) {
//         if(err instanceof Error) throw err
//         throw new Error('An error occurred');
//     }
// }

// export async function fetchTrailById(id: string){
//     try {
//         const ref = doc(db, 'trail', id);
//         const snap = await getDoc(ref);

//         if(!snap.exists()) return null;
        
//         const data = snap.data() as TrailDB
//         const trailWithId = { ...data, id: snap.id }

//         return TrailMapper.toUI(trailWithId);
//     } catch (err) {
//         throw new Error(err)
//     }
// }

// export async function saveTrail(trailData){
//     try {
//         const docRef = trailData.id 
//         ? doc(db, 'trails', trailData.id)
//         : doc(collection(db, 'trails'));

//         const trail = TrailMapper.toDB({id: docRef.id, ...trailData});
//         console.log('Trail in repo: ', trail);
        
//         await setDoc(docRef, trail, { merge: true });

//         return TrailMapper.toUI(trail);
//     } catch (err) {
//         throw new Error(err);
//     }
// }

// export async function deleteTrail(id){
//     try {
//         const docRef = doc(db, 'trails', id);
//         await deleteDoc(docRef);
//         return id;
//     } catch (err) {
//         throw new Error(err);
//     }
// }

// export async function getTrailMap(id){
//     console.log('Map for ', id);

//     return { map: 'Map to be added'}
// }