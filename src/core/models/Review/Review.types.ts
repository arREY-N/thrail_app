import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
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
    image: Array<string>;

    predictedDifficulty: TRating;
    perceivedDifficulty: TRating;
}

export interface IReviewBase<T, TRating> extends IHikeSurvey<T, TRating> {
    createdAt: T;
    updatedAt: T;
    user: IUserSummary;
    likes: IUserSummary[];
}

export interface IReviewDB extends IReviewBase<Timestamp | FieldValue, number> {}
export interface IReview extends IReviewBase<Date, DifficultyRating> {}