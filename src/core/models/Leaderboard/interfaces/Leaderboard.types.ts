import { FieldValue, Timestamp } from "firebase/firestore";

export interface RankedUserInfo {
    userId: string;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    profileImage: string | null;
}

export interface HikingRecord<T> {
    hikeId: string;
    distance: number;
    elevation: number;
    hikeDate: T;
}

export interface UserHikingRecords<T> extends RankedUserInfo {
    hikingRecords: HikingRecord<T>[];
    totalDistance: number;
    totalElevation: number;
    totalHikes: number;
}

export interface RankedUsers<T> extends UserHikingRecords<T> {
    rank: number;
}

export interface ILeaderboardBase<T> {
    id: string;
    date: T;
    createdAt: T;
    updatedAt: T;
    userRankings: RankedUsers<T>[];
}

export type ILeaderboardDB = ILeaderboardBase<Timestamp | FieldValue>;
export type Leaderboard<T = Date> = ILeaderboardBase<T>;
export type ILeaderboard = Leaderboard;
