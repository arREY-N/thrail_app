import { ReviewLogic } from "@/src/core/models/Review/Logic/Review.logic";
import { DifficultyRating, IHikeTrail, IReview, IReviewDB } from "@/src/core/models/Review/Review.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Review implements IReview {
    [key: string]: any;
    [immerable] = true
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    likes: number = 0;

    user: IUserSummary = {
        id: "",
        username: "",
        firstname: "",
        lastname: "",
        email: ""
    };
    hike: IHikeTrail<Date, DifficultyRating> = {
        id: "",
        name: "",
        predictedDifficulty: "Just Right",
        perceivedDifficulty: "Just Right",
        date: new Date(),
        overallRating: 0,
        trailMaintenance: "Just Right",
        difficultyFactors: [],
        favoredFactors: [],
        review: "",
        image: []
    }

    constructor(init?: Partial<IReview>) {
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IReviewDB): Review {
        const mapped: IReview = {
            ...data,
            id,
            hike: {
                ...data.hike,
                predictedDifficulty: ReviewLogic.toTextual(data.hike.predictedDifficulty),
                perceivedDifficulty: ReviewLogic.toTextual(data.hike.perceivedDifficulty),
                trailMaintenance: ReviewLogic.toTextual(data.hike.trailMaintenance),
                date: toDate(data.hike.date),
            },
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        }

        return new Review(mapped);
    }

    toFirestore(): IReviewDB {
        const isNew = this.id === '';

        const mapped: IReviewDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            likes: this.likes,
            user: this.user,
            hike: {
                ...this.hike,
                predictedDifficulty: ReviewLogic.toNumerical(this.hike.predictedDifficulty),
                perceivedDifficulty: ReviewLogic.toNumerical(this.hike.perceivedDifficulty),
                trailMaintenance: ReviewLogic.toNumerical(this.hike.trailMaintenance),
                date: Timestamp.fromDate(this.hike.date),
            },
        }

        return mapped;
    }
}

export const reviewConverter : FirestoreDataConverter<Review> = {
    toFirestore: (review: Review) => {
        return review.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Review => {
        const data = snapshot.data() as IReviewDB;
        return Review.fromFirestore(snapshot.id, data);
    }
}