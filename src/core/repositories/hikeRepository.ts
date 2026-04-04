import { db } from "@/src/core/config/Firebase";
import { BaseRepository } from "@/src/core/interface/repositoryInterface";
import { Hike, hikeConverter } from "@/src/core/models/Hike/Hike";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

const createHikesCollection = (userId: string) => {
    return collection(db, 'users', userId, 'hikes').withConverter(hikeConverter);
}

class HikeRepositoryImpl implements BaseRepository<Hike>{
    async fetchAll(userId: string): Promise<Hike[]> {
        try {
            const userHikesRef = createHikesCollection(userId);
            
            const snapshot = await getDocs(userHikesRef);

            if(snapshot.empty) return [];

            return snapshot.docs.map(doc => doc.data());
        } catch (err) {
            console.error('Error fetching hikes: ', err);
            throw new Error(err instanceof Error ? err.message : 'Failed fetching hikes');
        }
    }

    async fetchById(userId: string, hikeId: string): Promise<Hike | null> {
        try {
            const docRef = doc(createHikesCollection(userId), hikeId);
            const snapshot = await getDoc(docRef);

            return snapshot.data() || null;
        } catch (err) {
            console.error('Error fetching hike by ID: ', err);
            throw new Error(err instanceof Error ? err.message : 'Failed fetching hike');
        }
    }

    async write(hike: Hike, userId: string): Promise<Hike> {
        try {
            const docRef = hike.id
                ? doc(createHikesCollection(userId), hike.id)
                : doc(createHikesCollection(userId));

            hike.id = docRef.id;

            await setDoc(
                docRef,
                hike,
                { merge: true }
            );

            return hike;
        } catch (error) {
            console.error('Error writing hike: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed writing hike');
        }
    }

    async delete(id: string, userId: string): Promise<void> {
        try {
            const docRef = doc(createHikesCollection(userId), id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting hike: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed deleting hike');
        }
    }
}

export const HikeRepository = new HikeRepositoryImpl();