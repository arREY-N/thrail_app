import { FieldValue, Timestamp } from "firebase/firestore";
import { ITrailSummary } from "../Trail/Trail.types";

export type RecommendationStatus = 'recommended' | 'hiked' | 'liked' | 'disliked' 

export interface IRecommendationBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    trails: IRecommendedTrail[];
}

export interface IRecommendedTrail extends ITrailSummary{
    score: number;
    status: RecommendationStatus;
}

export interface IRecommendationDB extends IRecommendationBase<Timestamp | FieldValue>{}
export interface IRecommendation extends IRecommendationBase<Date> {}
