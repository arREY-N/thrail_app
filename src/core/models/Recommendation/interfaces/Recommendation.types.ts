import { Profile } from "@/src/recommendation/interfaces/Profile";
import { FieldValue, Timestamp } from "firebase/firestore";

export type RecommendationCategory = 'easy' | 'difficult';

export interface IRecommendedTrailItem {
    id: string;               // Trail ID as saved in Firestore
    trailName: string;        // Trail name (from trail.general.name)
    category: RecommendationCategory;
    haveHiked: boolean;
    score: number;            // Recommendation score (0.0 = closest match)
    easyScore?: number;       // Distance to easy anchor
    diffScore?: number;       // Distance to difficult anchor
    cbfScore?: number;        // CBF distance component
    cfScore?: number;         // CF distance component
    isChallengeOfMonth?: boolean; // True if featured as Challenge of the Month due to lack of easy trails
}

export interface IAITrailReasoning {
    summary: string;
    physicalFit: string;
    terrainFit: string;
    provinceFit: string;
    safetyTips: string;
    generatedAt: string;
    source?: 'gemini' | 'algorithmic';
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
    aiReasonings?: Record<string, IAITrailReasoning>; // Cached AI reasoning per trailId
}

export type IRecommendationDB = IRecommendationBase<Timestamp | FieldValue>;
export type Recommendation = IRecommendationBase<Date>;
export type IRecommendation = Recommendation;

// Legacy compatibility types
export type RecommendationStatus = 'recommended' | 'hiked' | 'liked' | 'disliked';
export interface IRecommendedTrail extends IRecommendedTrailItem {
    status?: RecommendationStatus;
}

/**
 * Data contracts for Adaptive Profile Updating (Presentation & API)
 */
export interface IHikeUpdateInput {
    trailId: string;
    trailFeatures?: number[] | Record<string, any>; // 32-dimensional normalized float vector [0, 1]
    score: number;                                  // R_tu in [0, 1]
    isMatch: boolean;                               // true = match, false = mismatch
    targetAnchor: RecommendationCategory;           // looked up from user's recommendation record
    featureWeights?: Record<string, number> | number[]; // Distinct factors selected by hiker for this hike
}

export interface IProfileUpdateBatchRequest {
    userId: string;
    currentEasyProfile?: number[] | Record<string, any>;
    currentDifficultProfile?: number[] | Record<string, any>;
    hikes: IHikeUpdateInput[];
    featureWeights?: Record<string, number>;
    commitToFirestore?: boolean;
}

export interface IProfileUpdateBatchResult {
    status: 'success' | 'error';
    userId: string;
    easyHikesCount: number;
    difficultHikesCount: number;
    profile: IRecommendationProfiles;
    easyVector: number[];
    difficultVector: number[];
    committedToFirestore: boolean;
    updatedAt: string;
}
