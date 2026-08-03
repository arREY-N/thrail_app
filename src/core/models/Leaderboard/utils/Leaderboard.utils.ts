import { Hike } from "@/src/core/models/Hike/Hike";
import { RankedUserInfo, RankedUsers, UserHikingRecords } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";

export const generateUserHikingRecord = (
    user: RankedUserInfo, 
    allHikes: Hike[],
    now: Date,
): UserHikingRecords<Date> | null=> {
    if(!allHikes || allHikes.length === 0) {
        console.log(`No hikes found for user ${user.userId}`);
        return null
    };

    const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const hikes = allHikes.filter(hike => 
        hike.status === 'completed' && 
        hike.endTime &&
        hike.endTime.getMonth() === targetMonth && 
        hike.endTime.getFullYear() === targetYear
    );

    if(hikes.length === 0) {
        console.log(`No valid hikes found for user ${user.userId}`);
        return null;
    }

    const hikingRecords = hikes.map(hike => ({
        hikeId: hike.id,
        distance: hike.distance,
        elevation: hike.elevation,
        hikeDate: hike.hikeDate
    }));

    const totalDistance = hikingRecords.reduce((acc, record) => acc + record.distance, 0);
    const totalElevation = hikingRecords.reduce((acc, record) => acc + record.elevation, 0);
    const totalHikes = hikingRecords.length;

    if(totalDistance === 0) return null;

    return {
        ...user,
        hikingRecords,
        totalDistance,
        totalElevation,
        totalHikes,
    }
};

export const setUserRanking = (userRecords: UserHikingRecords<Date>[]): RankedUsers<Date>[] => {
    const sortedRecords = [...userRecords].sort((a, b) => b.totalDistance - a.totalDistance);

    let rankedUsers: RankedUsers<Date>[] = [];

    let currentRank = 1;

    for (let i = 0; i < sortedRecords.length; i++) {
        if (i > 0 && sortedRecords[i].totalDistance < sortedRecords[i - 1].totalDistance) {
            currentRank += 1;
        }
        rankedUsers.push({
            ...sortedRecords[i],
            rank: currentRank
        });
    }

    return rankedUsers;
}

export const generateLeaderboardId = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;  
 
    return `leaderboard-${year}-${month}`;
}