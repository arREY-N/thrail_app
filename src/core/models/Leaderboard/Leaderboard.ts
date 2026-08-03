import { Leaderboard, RankedUserInfo, UserHikingRecords } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import { generateLeaderboardId, generateUserHikingRecord, setUserRanking } from "@/src/core/models/Leaderboard/utils/Leaderboard.utils";
import { HikeRepository } from "@/src/core/repositories/hikeRepository";
import { UserRepository } from "@/src/core/repositories/userRepository";
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export async function generateLeaderboard(date: Date): Promise<Leaderboard<Date>> {
    // collect all users
    let userHikingRecords: UserHikingRecords<Date>[] = [];

    const users = await UserRepository.fetchAll();

    // collect hike per user
    for (const user of users) {
        const userId = user.id;

        const userHikes = await HikeRepository.fetchAll(userId);

        const userInfo: RankedUserInfo = {
            userId: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            profileImage: user.profileImage
        };
    
        const userHikingRecord = generateUserHikingRecord(userInfo, userHikes, date);

        if (userHikingRecord) {
            userHikingRecords.push(userHikingRecord);
        }
    }

    // set ranking
    const rankedUsers = setUserRanking(userHikingRecords);

    const leaderboard: Leaderboard<Date> = {
        id: generateLeaderboardId(date),
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userRankings: rankedUsers
    }
    
    // create leaderboard 
    
    const leaderboardDB: Leaderboard<Timestamp> = leaderboardToDB(leaderboard);
    
    console.log(`Leaderboard: for ${date.toISOString()}`, leaderboard);
    return leaderboard;
}

export const leaderboardToDB = (leaderboard: Leaderboard<Date>): Leaderboard<Timestamp> => {
    const rankedUsersWithTimestamp = leaderboard.userRankings.map(user => ({
        ...user,
        hikingRecords: user.hikingRecords.map(record => ({
            ...record,
            hikeDate: Timestamp.fromDate(record.hikeDate)
        }))
    }));

    return {
        id: leaderboard.id,
        date: Timestamp.fromDate(leaderboard.date),
        createdAt: Timestamp.fromDate(leaderboard.createdAt),
        updatedAt: Timestamp.fromDate(leaderboard.updatedAt),
        userRankings: rankedUsersWithTimestamp
    }
}

export const leaderboardFromDB = (leaderboard: Leaderboard<Timestamp>): Leaderboard<Date> => {
    const rankedUsersWithDate = leaderboard.userRankings.map(user => ({
        ...user,
        hikingRecords: user.hikingRecords.map(record => ({
            ...record,
            hikeDate: record.hikeDate.toDate()
        }))
    }));
 
    return {
        id: leaderboard.id,
        date: leaderboard.date.toDate(),
        createdAt: leaderboard.createdAt.toDate(), 
        updatedAt: leaderboard.updatedAt.toDate(),
        userRankings: rankedUsersWithDate
    }
}

export const LeaderboardConverter: FirestoreDataConverter<Leaderboard<Date>> = {
    toFirestore: (leaderboard: Leaderboard<Date>) => {
        return leaderboardToDB(leaderboard);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Leaderboard<Date> => {
        const data = snapshot.data() as Leaderboard<Timestamp>;
        return leaderboardFromDB(data);
    }
}