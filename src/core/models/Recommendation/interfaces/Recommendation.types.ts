import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { FieldValue, Timestamp } from "firebase/firestore";

export type RecommendationStatus = 'recommended' | 'hiked' | 'liked' | 'disliked'

export interface IRecommendationBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    trails: IRecommendedTrail[];
}

export interface IRecommendedTrail extends ITrailSummary {
    score: number;
    status: RecommendationStatus;
}

export type IRecommendationDB = IRecommendationBase<Timestamp | FieldValue>;
export type Recommendation = IRecommendationBase<Date>;
export type IRecommendation = Recommendation;
