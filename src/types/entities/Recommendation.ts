import { RecommendationStatus } from "../Enum";

export interface RecommendedTrailDB {
    id?: string;
    trail: {
        id: string; 
        name: string;
    },
    score: number;
    status: RecommendationStatus;
}

export interface RecommendedTrailUI {
    id?: string;
    trailId: string;
    trailName: string;
    score: number;
    status: RecommendationStatus;
}

export interface RecommendationDB {
    id?: string;
    trails: RecommendedTrailDB[];
}

export interface RecommendationUI {
    id?: string;
    trails: RecommendedTrailUI[];
}