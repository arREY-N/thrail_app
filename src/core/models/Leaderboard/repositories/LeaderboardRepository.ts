import { Leaderboard } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import { LeaderboardConverter } from "@/src/core/models/Leaderboard/Leaderboard";
import { generateLeaderboardId } from "@/src/core/models/Leaderboard/utils/Leaderboard.utils";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const LeaderboardRepository = (db: any) => ({
    async fetchLeaderboard(date: Date = new Date()): Promise<Leaderboard<Date> | null> {
        const leaderboardId = generateLeaderboardId(date);

        const docref = doc(db, 'leaderboards', leaderboardId).withConverter(LeaderboardConverter);
        const snap = await getDoc(docref);

        if (!snap.exists()) {
            return null;
        }

        return snap.data();
    },

    async write(leaderboard: Leaderboard<Date>): Promise<void> {
        try {
            const leaderboardId = leaderboard.id;
            const docref = doc(db, 'leaderboards', leaderboardId).withConverter(LeaderboardConverter);
            await setDoc(docref, leaderboard, { merge: true });
        } catch (error) {
            console.error("Error writing leaderboard:", error);
            throw new Error(`Failed to write leaderboard: ${error}`);
        }
    }
});