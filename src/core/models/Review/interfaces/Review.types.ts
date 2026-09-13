import { IHikeBase } from "@/src/core/models/Hike/Hike";
import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export type DifficultyRating = "Easy" | "Just Right" | "Moderate" | "Hard" | "Extreme" | "undefined";
export type DifficultyFactors = "d1" | "d2" | "d3";
export type FavoredFactors = "f1" | "f2" | "f3";

export interface ReviewInformation<T, TRating> extends IHikeBase<T> {
    overallRating: number;
    trailMaintenance: TRating;
    difficultyFactors: DifficultyFactors[];
    favoredFactors: FavoredFactors[];
    review: string;
    image: string[];

    predictedDifficulty: TRating;
    perceivedDifficulty: TRating;
}
export interface IHikeSurvey<T, TRating> extends ReviewInformation<T, TRating> {
    id: string;
    likes: IUserSummary[];
}


export type IReviewDB = IHikeSurvey<Timestamp | FieldValue, number>;
export type Review = IHikeSurvey<Date, DifficultyRating>;
export type IReview = Review;