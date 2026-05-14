import { DifficultyRating, IHikeSurvey } from "@/src/core/models/Review/Review.types";
import { Timestamp } from "firebase/firestore";

export type Status = 'unhiked' | 'started' | 'paused' | 'completed'

export interface IHikeBase<T, TRating> extends IHikeSurvey<T, TRating>{
    status: Status;
    mode: 'booked' | 'direct';
    bookingId?: string | undefined;
    startTime?: T | undefined;
    endTime?: T | undefined;
}

export interface IHikeDB extends IHikeBase<Timestamp, number>{}
export interface IHike extends IHikeBase<Date, DifficultyRating>{}