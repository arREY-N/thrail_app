import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export type Status = 'unhiked' | 'started' | 'paused' | 'completed';
export type HikeMode = 'booked' | 'direct';

export interface IHikeBase<T> {
    hikeDate: T;
    trail: ITrailSummary;
    user: IUserSummary;
    status: Status;
    mode: HikeMode;
    bookingId?: string;
    startTime?: T;
    endTime?: T;
    distance: number;
    duration: number;
    elevation: number;
    createdAt: T;
    updatedAt: T;
}

export interface HikeRecord<T> extends IHikeBase<T> {
    id: string;
}

export type IHikeDB = HikeRecord<Timestamp | FieldValue>;
export type Hike = HikeRecord<Date>;
export type IHike = Hike;
