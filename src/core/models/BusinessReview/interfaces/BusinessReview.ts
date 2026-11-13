import { IBusinessSummary } from "@/src/core/models/Business/Business";
import { ReviewSummary } from "@/src/core/models/Review/Review";
import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export interface IBusinessReview<T> {
    id: string;
    business: IBusinessSummary;
    user: IUserSummary;
    review: string;
    trail: ITrailSummary;
    offerId: string;
    hikeDate: T;
    hikeReview: ReviewSummary;
    rating: number;
    likes: number;
    createdAt: T;
    updatedAt: T;
}

export type BusinessReviewDB = IBusinessReview<Timestamp | FieldValue>
export type BusinessReview = IBusinessReview<Date>