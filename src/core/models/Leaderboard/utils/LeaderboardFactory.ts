import { HikingRecord, ILeaderboardDB, Leaderboard, RankedUsers } from "@/src/core/models/Leaderboard/interfaces/Leaderboard.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export const newHikingRecord = (init?: Partial<HikingRecord<Date>>): HikingRecord<Date> => {
    return {
        hikeId: '',
        distance: 0,
        elevation: 0,
        hikeDate: new Date(),
        ...init,
        ...(init?.hikeDate ? { hikeDate: toDate(init.hikeDate) } : {}),
    };
};

export const newRankedUsers = (init?: Partial<RankedUsers<Date>>): RankedUsers<Date> => {
    return {
        userId: '',
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        profileImage: null,
        hikingRecords: [],
        totalDistance: 0,
        totalElevation: 0,
        totalHikes: 0,
        rank: 0,
        ...init,
    };
};

export const newLeaderboard = (init?: Partial<Leaderboard>): Leaderboard => {
    return {
        id: '',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userRankings: [],
        ...init,
        ...(init?.date ? { date: toDate(init.date) } : {}),
        ...(init?.createdAt ? { createdAt: toDate(init.createdAt) } : {}),
        ...(init?.updatedAt ? { updatedAt: toDate(init.updatedAt) } : {}),
    };
};

const leaderboardFromFirestore = (id: string, data: ILeaderboardDB): Leaderboard => {
    const userRankings: RankedUsers<Date>[] = (data.userRankings || []).map(user => ({
        ...user,
        hikingRecords: (user.hikingRecords || []).map(record => ({
            ...record,
            hikeDate: toDate(record.hikeDate),
        })),
    }));

    return {
        id,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        userRankings,
    };
};

const leaderboardToFirestore = (leaderboard: Leaderboard): ILeaderboardDB => {
    const userRankings = leaderboard.userRankings.map(user => ({
        ...user,
        hikingRecords: user.hikingRecords.map(record => ({
            ...record,
            hikeDate: Timestamp.fromDate(toDate(record.hikeDate)),
        })),
    }));

    return {
        id: leaderboard.id,
        date: Timestamp.fromDate(toDate(leaderboard.date)),
        createdAt: Timestamp.fromDate(toDate(leaderboard.createdAt)),
        updatedAt: Timestamp.fromDate(toDate(leaderboard.updatedAt)),
        userRankings,
    };
};

export const leaderboardConverter: FirestoreDataConverter<Leaderboard> = {
    toFirestore: (leaderboard: Leaderboard) => {
        return leaderboardToFirestore(leaderboard);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Leaderboard => {
        const data = snapshot.data() as ILeaderboardDB;
        return leaderboardFromFirestore(snapshot.id, data);
    },
};
