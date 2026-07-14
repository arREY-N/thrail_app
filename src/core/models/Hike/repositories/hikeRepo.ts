import { hikeFromDB } from "@/src/core/models/Hike/Hike";
import { IHike } from "@/src/core/models/Hike/Hike.types";
import { collection, getDocs } from "firebase/firestore";

export const HikeRepo = (db: any) => ({
    async fetchAllUserHike(userId: string): Promise<IHike[]> {
        try {
            const userHikesRef = collection(db, 'users', userId, 'hikes');
            
            const snapshot = await getDocs(userHikesRef);

            if(snapshot.empty) return [];

            return snapshot.docs.map(doc => hikeFromDB(doc.id, doc.data()));
        } catch (err) {
            console.error('Error fetching hikes: ', err);
            throw new Error(err instanceof Error ? err.message : 'Failed fetching hikes');
        }
    }
});