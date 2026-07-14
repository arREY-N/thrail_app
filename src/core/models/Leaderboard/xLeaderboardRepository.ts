import { Hike } from "@/src/core/models/Hike/Hike";
import { createHikerRecord, HikerRecord } from "@/src/core/models/Leaderboard/xLeaderboard";
import { userConverter, userFromDB } from "@/src/core/models/User/User";
import { collection, getDocs, query, where } from "firebase/firestore";

export const LeaderboardRepository = (db: any) => ({
    async fetchAllData(): Promise<HikerRecord[]> {
        const userCollection = collection(db, 'users').withConverter(userConverter);
        const userSnapshots = await getDocs(userCollection);

        const hikerRecords: HikerRecord[] = [];

        for (const userDoc of userSnapshots.docs) {
            const userId = userDoc.id;
            const hikesCollection = collection(db, 'users', userId, 'hikes');
            
            const q = query(hikesCollection, where('status', '==', 'completed'));
            
            const hikesSnapshot = await getDocs(q);
            
            hikerRecords.push(
                createHikerRecord(
                    userFromDB(userDoc.id, userDoc.data()), 
                    hikesSnapshot.docs.map(hikeDoc => hikeDoc.data() as Hike)
                )
            );
        }

        return hikerRecords;
    }
});