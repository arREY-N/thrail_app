import { DifficultyRating, IHikeSurvey } from "@/src/core/models/Review/Review.types";
import { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export type Status = 'unhiked' | 'started' | 'paused' | 'completed'

export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: Date;
}

export interface CoordinatesDB {
    point: GeoPoint;
    altitude: number;
    timestamp: Timestamp | FieldValue;
}

export interface IHikeBase<T, TRating> extends IHikeSurvey<T, TRating>{
    status: Status;
    mode: 'booked' | 'direct';
    bookingId?: string | undefined;
    startTime?: T | undefined;
    endTime?: T | undefined;
}

export interface IHikeDB extends IHikeBase<Timestamp, number>{}
export interface IHike extends IHikeBase<Date, DifficultyRating>{}