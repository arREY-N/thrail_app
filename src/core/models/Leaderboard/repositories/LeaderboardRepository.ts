import { db } from "@/src/core/config/Firebase";
import { Leaderboard } from "@/src/core/models/Leaderboard/interfaces/Leaderboard.types";
import { leaderboardConverter } from "@/src/core/models/Leaderboard/utils/LeaderboardFactory";
import { generateLeaderboardId } from "@/src/core/models/Leaderboard/utils/Leaderboard.utils";
import { doc, Firestore, getDoc, setDoc } from "firebase/firestore";

export const LeaderboardRepository = (db: Firestore) => ({
    async fetchLeaderboard(date: Date = new Date()): Promise<Leaderboard | null> {
        const leaderboardId = generateLeaderboardId(date);

        const docref = doc(db, 'leaderboards', leaderboardId).withConverter(leaderboardConverter);
        const snap = await getDoc(docref);

        if (!snap.exists()) {
            return null;
        }

        return snap.data();
    },

    async fetchById(id: string): Promise<Leaderboard | null> {
        const docref = doc(db, 'leaderboards', id).withConverter(leaderboardConverter);
        const snap = await getDoc(docref);

        if (!snap.exists()) {
            return null;
        }

        return snap.data();
    },

    async write(leaderboard: Leaderboard): Promise<void> {
        try {
            const leaderboardId = leaderboard.id;
            const docref = doc(db, 'leaderboards', leaderboardId).withConverter(leaderboardConverter);
            await setDoc(docref, leaderboard, { merge: true });
        } catch (error) {
            console.error("Error writing leaderboard:", error);
            throw new Error(`Failed to write leaderboard: ${error}`);
        }
    },
});

export const LeaderboardRepo = LeaderboardRepository(db);
