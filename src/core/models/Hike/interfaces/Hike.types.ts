import { DifficultyRating, IHikeSurvey } from "@/src/core/models/Review/Review";
import { FieldValue, Timestamp } from "firebase/firestore";

export type Status = 'unhiked' | 'started' | 'paused' | 'completed';
export type HikeMode = 'booked' | 'direct';

export interface IHikeBase<T, TRating> extends IHikeSurvey<T, TRating> {
    status: Status;
    mode: HikeMode;
    bookingId?: string;
    startTime?: T;
    endTime?: T;

    distance?: number;
    duration?: number;
    elevation?: number;
}

export type IHikeDB = IHikeBase<Timestamp | FieldValue, number>;
export type Hike = IHikeBase<Date, DifficultyRating>;
export type IHike = Hike;
