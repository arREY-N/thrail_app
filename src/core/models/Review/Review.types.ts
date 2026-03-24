import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { FieldValue, Timestamp } from "firebase/firestore";

export type DifficultyRating = "Easy" | "Just Right" | "Moderate" | "Hard" | "Extreme";

export interface IHikeTrail<T, TRating> extends ITrailSummary{
    date: T;
    overallRating: number;
    perceivedDifficulty: TRating;
    predictedDifficulty: TRating;
    trailMaintenance: TRating;
    difficultyFactors: Array<string>;
    favoredFactors: Array<string>;
    review: string;
    image: Array<string>;
}

export interface IReviewBase<T, TRating> {
    id: string;
    createdAt: T;
    updatedAt: T;
    user: IUserSummary;
    hike: IHikeTrail<T, TRating>;
    likes: number;
}

export interface IReviewDB extends IReviewBase<Timestamp | FieldValue, number> {}
export interface IReview extends IReviewBase<Date, DifficultyRating> {}