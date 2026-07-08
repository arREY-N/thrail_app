import { Hike } from "@/src/core/models/Hike/Hike";
import { User } from "@/src/core/models/User/User";
import { IUser } from "@/src/core/models/User/User.types";

export interface LeaderboardEntry {
    userId: string;
    score: number;
    totalLength: number;
    numberOfHikes: number;
    rank?: number;
}

export interface Leaderboard {
    id: string;
    ranking: LeaderboardEntry[];
    date: Date;
}

export interface HikerRecord {
    userId: string;
    hikes: Hike[];
}

export const createHikerRecord = (user: IUser, hikes: Hike[]): HikerRecord => {
    if(!user) throw new Error("User is required to create a hiker record.");
 
    return {
        userId: user.id,
        hikes: hikes
    };
}

export const onCreateMonthlyLeaderboard = (users: User[], hikes: Hike[]): Leaderboard => {
    const scored = users.map(u => {
        const userHikes = hikes.filter(h => h.userId === u.id);
        return createLeaderboardEntry({user: u, hiking: userHikes});
    });

    const ranked = rankEntries(scored);

    return {
        id: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        date: new Date(),
        ranking: ranked
    };
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

    record.totalLength = validHiking.reduce((total, hike) => total + (hike.distance || 0), 0);
    record.numberOfHikes = validHiking.length;
    record.score = record.totalLength / record.numberOfHikes;

    return record; 
};

export const rankEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
    const ranked = entries.sort((a, b) => b.score - a.score);
    let currentRank = 1;
    for (let i = 0; i < ranked.length; i++) {
        if (i > 0 && ranked[i].score < ranked[i - 1].score) {
            currentRank += 1;
        }
        ranked[i].rank = currentRank;
    }

    return ranked;
}