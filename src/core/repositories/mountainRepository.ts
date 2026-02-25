import { db } from '@/src/core/config/Firebase';
import { MountainDB, MountainUI } from '@/src/types/entities/Mountain';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { BaseRepository } from '../interface/repositoryInterface';
import { MountainMapper } from '../mapper/mountainMapper';

const mountainCollection = collection(db, 'mountains').withConverter({
    toFirestore: (mountain: MountainDB) => mountain,
    fromFirestore: (snapshot): MountainDB => snapshot.data() as MountainDB,
});

class MountainRepositoryImpl implements BaseRepository<MountainUI>{
    async fetchAll(...args: any[]): Promise<MountainUI[] | []> {
        try {
            const snapshot = await getDocs(mountainCollection);

            if(snapshot.empty) return [];

            return snapshot.docs.filter(d => d.id !== 'init').map((docs) => MountainMapper.toUI(docs.data()));
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error((err as Error).message || 'Failed fetching all mountains')
        }
    }
    
    async fetchById(id: string, ...args: any[]): Promise<MountainUI | null> {
        try {
            const docRef = doc(mountainCollection, id);
            const snapshot = await getDoc(docRef);

            if(!snapshot.exists()) return null;

            return MountainMapper.toUI(snapshot.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error((err as Error).message || 'Failed fetching mountain');
        }
    }
    
    async write(data: MountainUI, ...args: any[]): Promise<MountainUI> {
        try {
            const docRef = data.id 
                ? doc(mountainCollection, data.id)
                : doc(mountainCollection);

            const mountainInfo = data.id 
                ? {id: docRef.id, ...data, updatedAt: serverTimestamp()}
                : {id: docRef.id, ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp()}

            const mountain = MountainMapper.toDB(mountainInfo)
            await setDoc(docRef, mountain, { merge: true });
            return MountainMapper.toUI(mountain);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error((err as Error).message || 'Failed writing mountain')
        }
    }
    
    async delete(id: string, ...args: any[]): Promise<void> {
        try {
            const docRef = doc(mountainCollection, id);
            await deleteDoc(docRef);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error((err as Error).message || 'Failed deleting mountain')
        }
    }

    async fetchMountainByProvince(): Promise<MountainUI[] | []>{
        throw new Error('TO IMPLEMENT');        
    }
}

export const MountainRepository = new MountainRepositoryImpl();