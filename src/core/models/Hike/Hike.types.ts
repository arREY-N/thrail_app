import { DifficultyRating, IHikeSurvey } from "@/src/core/models/Review/Review.types";
import { GeoPoint, Timestamp } from "firebase/firestore";

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
    timestamp: Timestamp;
}

export interface IHikeBase<T, TRating, TCoordinates> extends IHikeSurvey<T, TRating>{
    status: Status;
    mode: 'booked' | 'direct';
    bookingId?: string | undefined;
    startTime?: T | undefined;
    endTime?: T | undefined;
    coordinates: TCoordinates[];
}

export interface IHikeDB extends IHikeBase<Timestamp, number, CoordinatesDB>{}
export interface IHike extends IHikeBase<Date, DifficultyRating, Coordinates>{}