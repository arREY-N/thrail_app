import { Hike, HikeRepo } from "@/src/core/models/Hike/Hike";
import { Leaderboard, RankedUserInfo, RankedUsers, UserHikingRecords } from "@/src/core/models/Leaderboard/interfaces/Leaderboard.types";
import { newLeaderboard } from "@/src/core/models/Leaderboard/utils/LeaderboardFactory";
import { UserRepository } from "@/src/core/repositories/userRepository";

export const generateLeaderboardId = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return `leaderboard-${year}-${month}`;
};

export const generateUserHikingRecord = (
    user: RankedUserInfo,
    allHikes: Hike[],
    now: Date,
): UserHikingRecords<Date> | null => {
    if (!allHikes || allHikes.length === 0) {
        console.log(`No hikes found for user ${user.userId}`);
        return null;
    }

    const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const hikes = allHikes.filter(hike =>
        hike.status === 'completed' &&
        hike.endTime &&
        hike.endTime.getMonth() === targetMonth &&
        hike.endTime.getFullYear() === targetYear
    );

    if (hikes.length === 0) {
        console.log(`No valid hikes found for user ${user.userId}`);
        return null;
    }

    const hikingRecords = hikes.map(hike => ({
        hikeId: hike.id,
        distance: hike.distance ?? 0,
        elevation: hike.elevation ?? 0,
        hikeDate: hike.hikeDate,
    }));

    const totalDistance = hikingRecords.reduce((acc, record) => acc + record.distance, 0);
    const totalElevation = hikingRecords.reduce((acc, record) => acc + record.elevation, 0);
    const totalHikes = hikingRecords.length;

    if (totalDistance === 0) return null;

    return {
        ...user,
        hikingRecords,
        totalDistance,
        totalElevation,
        totalHikes,
    };
};

export const setUserRanking = (userRecords: UserHikingRecords<Date>[]): RankedUsers<Date>[] => {
    const sortedRecords = [...userRecords].sort((a, b) => b.totalDistance - a.totalDistance);

    const rankedUsers: RankedUsers<Date>[] = [];
    let currentRank = 1;

    for (let i = 0; i < sortedRecords.length; i++) {
        if (i > 0 && sortedRecords[i].totalDistance < sortedRecords[i - 1].totalDistance) {
            currentRank += 1;
        }
        rankedUsers.push({
            ...sortedRecords[i],
            rank: currentRank,
        });
    }

    return rankedUsers;
};

export async function generateLeaderboard(date: Date): Promise<Leaderboard> {
    const userHikingRecords: UserHikingRecords<Date>[] = [];
    const users = await UserRepository.fetchAll();

    for (const user of users) {
        const userId = user.id;
        const userHikes = await HikeRepo.fetchAll(userId);

        const userInfo: RankedUserInfo = {
            userId: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            profileImage: user.profileImage || null,
        };

        const userHikingRecord = generateUserHikingRecord(userInfo, userHikes, date);

        if (userHikingRecord) {
            userHikingRecords.push(userHikingRecord);
        }
    }

    const rankedUsers = setUserRanking(userHikingRecords);

    const leaderboard = newLeaderboard({
        id: generateLeaderboardId(date),
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userRankings: rankedUsers,
    });

    console.log(`Leaderboard: for ${date.toISOString()}`, leaderboard);

    return leaderboard;
}