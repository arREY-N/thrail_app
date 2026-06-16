import { Hike } from "@/src/core/models/Hike/Hike";
import { User } from "@/src/core/models/User/User";

export interface LeaderboardEntry {
    userId: string;
    score: number;
    totalLength: number;
    numberOfHikes: number;
    rank?: number;
}

export interface Leaderboard<T> {
    id: string;
    ranking: LeaderboardEntry[];
}

export const OnCreateMonthlyLeaderboard = () => {
    const user: User[] = [];

    const scored = user.map(u => createLeaderboardEntry({user: u, hiking: u.hiking}));

    const ranked = rankEntries(scored);

    console.log('Monthly Leaderboard:', ranked);
}

export const createLeaderboardEntry = ({user, hiking}: {user: User, hiking: Hike[]}): LeaderboardEntry => {
    if(!user) throw new Error("User is required to create a leaderboard entry.");
    
    let record = {
        userId: user.id,
        score: 0,
        totalLength: 0,
        numberOfHikes: 0 
    }

    const validHiking = hiking.filter(hike => 
        (hike.status === "completed" && (hike.endTime && hike.endTime.getMonth() === new Date().getMonth()))
    );

    if(!validHiking || validHiking.length === 0) return record; 

    record.totalLength = validHiking.reduce((total, hike) => total + hike.length, 0);
    record.numberOfHikes = validHiking.length;
    record.score = record.totalLength / record.numberOfHikes;

    return record; 
};

export const rankEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
    const ranked = entries.sort((a, b) => b.score - a.score);

    let currentRank = 1;
    for (let i = 0; i < ranked.length; i++) {
        if (i > 0 && ranked[i].score < ranked[i - 1].score) {
            currentRank = i + 1;
        }
        ranked[i].rank = currentRank;
    }

    return ranked;
}