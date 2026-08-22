import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export type DifficultyRating = "Easy" | "Just Right" | "Moderate" | "Hard" | "Extreme" | "undefined";
export type DifficultyFactors = "d1" | "d2" | "d3"
export type FavoredFactors = "f1" | "f2" | "f3"

export interface IHikeSurvey<T, TRating> {
    id: string;
    hikeDate: T;
    trail: ITrailSummary;

    overallRating: number;
    trailMaintenance: TRating;
    difficultyFactors: DifficultyFactors[];
    favoredFactors: FavoredFactors[];
    review: string;
    image: string[];

    predictedDifficulty: TRating;
    perceivedDifficulty: TRating;

    distance?: number;
    duration?: number;
    elevation?: number;
}

export interface IReviewBase<T, TRating> extends IHikeSurvey<T, TRating> {
    createdAt: T;
    updatedAt: T;
    user: IUserSummary;
    likes: IUserSummary[];
}

export type IReviewDB = IReviewBase<Timestamp | FieldValue, number>
export type IReview = IReviewBase<Date, DifficultyRating>