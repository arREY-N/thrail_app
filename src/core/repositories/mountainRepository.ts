import { db } from '@/src/core/config/Firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { BaseRepository } from '../interface/repositoryInterface';
import { Mountain, mountainConverter } from '../models/Mountain/Mountain';

const mountainCollection = collection(db, 'mountains').withConverter(mountainConverter);

class MountainRepositoryImpl implements BaseRepository<Mountain>{
    async fetchAll(): Promise<Mountain[] | []> {
        try {
            const snapshot = await getDocs(mountainCollection);

            if(snapshot.empty) return [];

            return snapshot.docs.filter(d => d.id !== 'init').map(docs => docs.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all mountains')
        }
    }
    
    async fetchById(id: string): Promise<Mountain | null> {
        try {
            const docRef = doc(mountainCollection, id);
            const snapshot = await getDoc(docRef);

            if(!snapshot.exists()) return null;

            return snapshot.data();
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching mountain');
        }
    }
    
    async write(data: Mountain): Promise<Mountain> {
        try {
            const docRef = data.id 
                ? doc(mountainCollection, data.id)
                : doc(mountainCollection);

            data.id = docRef.id;

            await setDoc(docRef, data, { merge: true });
            
            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed writing mountain')
        }
    }
    
    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(mountainCollection, id);
            await deleteDoc(docRef);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed deleting mountain')
        }
    }

    async fetchMountainByProvince(province: string): Promise<Mountain[] | []>{
        try {
            const q = query(mountainCollection, where('province', 'array-contains', province));
    
            const snapshot = await getDocs(q);
            
            if(snapshot.empty) return [];
    
            return snapshot.docs.map(doc => doc.data());
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error(`Failed to fetch mountains in ${province}`);    
        }
    }
}

export const MountainRepository = new MountainRepositoryImpl();