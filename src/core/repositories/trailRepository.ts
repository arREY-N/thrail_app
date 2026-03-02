import { db } from '@/src/core/config/Firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { BaseRepository } from '../interface/repositoryInterface';
import { Trail, trailConverter } from '../models/Trail/Trail';

const trailsCollection = collection(db, 'trails').withConverter(trailConverter);

class TrailRepositoryImpl implements BaseRepository<Trail>{
    async fetchAll(): Promise<Trail[]> {
        try {
            const snapshot = await getDocs(trailsCollection);
            if(snapshot.empty) return [];
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }    
    }

    async fetchById(id: string): Promise<Trail | null> {
        try {
            const ref = doc(trailsCollection, id);
            const snap = await getDoc(ref);

            if(!snap.exists()) return null;
            
            return snap.data()
        } catch (err) {
            if(err instanceof Error )throw err;
            throw new Error('An error occurred');
        }    
    }

    async write(data: Trail): Promise<Trail> {
        try {
            const create = data.id === ''

            const docRef = create  
                ? doc(trailsCollection)
                : doc(trailsCollection, data.id);

            if(create) data.id = docRef.id;

            await setDoc(docRef, data, { merge: true });

            return data;
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