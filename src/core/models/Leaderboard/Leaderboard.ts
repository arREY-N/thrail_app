import { HikeRepository } from "@/src/core/hook/repo/init";
import { HikeSummaryInDB, HikeSummaryPreRankings } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import { UserRepository } from "@/src/core/models/User/hooks/initalizeUserRepo";

export type LeaderboardRecords = Record<string, HikeSummaryInDB>;

export const generateLeaderboard = async (): Promise<LeaderboardRecords> => {
    const userHikingData = await collectUserHikingData();

    // sort

    // rank

    // leaderboard repo


    return {}; 
};

export const collectUserHikingData = async (): Promise<HikeSummaryPreRankings[]> => {
    const users = await UserRepository.fetchAll();

    const records: HikeSummaryPreRankings[] = [];

    for (const user of users) {
        const userHikes = await HikeRepository.fetchAllUserHike(user.id);
        
        const hikeRecords: { totalDistance: number; totalElevation: number; totalHikes: number } = userHikes
            .filter(hike => 
                hike.status === 'completed' && 
                hike.distance !== undefined && 
                hike.elevation !== undefined &&
                hike.startTime && hike.startTime.getMonth() === new Date().getMonth() - 1 &&
                hike.startTime.getFullYear() === new Date().getFullYear())    
            .reduce((acc, hike) => {
                const { distance, elevation } = hike;

                acc.totalDistance += distance ? distance : 0;
                acc.totalElevation += elevation ? elevation : 0;
                acc.totalHikes += 1;

                return acc;
            }, { totalDistance: 0, totalElevation: 0, totalHikes: 0 }
        )

        if(hikeRecords.totalHikes === 0) continue;

        records.push({ 
            userId: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            profileImage: user.profileImage ? user.profileImage : '',
            totalDistance: hikeRecords.totalDistance,
            totalElevation: hikeRecords.totalElevation,
            totalHikes: hikeRecords.totalHikes,
        });
    }

    return records;
};