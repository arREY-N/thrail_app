import { Profile } from "@/src/recommendation/interfaces/Profile";
import { FieldValue, Timestamp } from "firebase/firestore";

export type RecommendationCategory = 'easy' | 'difficult';

export interface IRecommendedTrailItem {
    id: string;               // Trail ID as saved in Firestore
    trailName: string;        // Trail name (from trail.general.name)
    category: RecommendationCategory;
    haveHiked: boolean;
    score: number;            // Recommendation score (0.0 = closest match)
    cbfScore?: number;        // CBF distance component
    cfScore?: number;         // CF distance component
}

export interface IEngineConfig {
    cbf: string;
    cf: string;
    alpha: number;
    userCount: number;
}

export interface IRecommendationProfiles {
    easy: Profile | null;
    difficult: Profile | null;
}

export interface IRecommendationBase<T> {
    id: string;                                // Month code: 'YYYY-MM'
    createdAt: T;
    updatedAt: T;
    profile: IRecommendationProfiles;          // User easy & difficult anchor profiles used
    easy: IRecommendedTrailItem[];             // All candidate trails scored for easy profile
    difficult: IRecommendedTrailItem[];        // All candidate trails scored for difficult profile
    engineConfig?: IEngineConfig;
    trails?: IRecommendedTrailItem[];          // Compatibility alias
}

export type IRecommendationDB = IRecommendationBase<Timestamp | FieldValue>;
export type Recommendation = IRecommendationBase<Date>;
export type IRecommendation = Recommendation;

// Legacy compatibility types
export type RecommendationStatus = 'recommended' | 'hiked' | 'liked' | 'disliked';
export interface IRecommendedTrail extends IRecommendedTrailItem {
    status?: RecommendationStatus;
}
