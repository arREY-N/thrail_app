import { toNumerical, toTextual } from "@/src/core/models/Review/Logic/Review.converter";
import { DifficultyFactors, DifficultyRating, FavoredFactors, IReview, IReviewDB } from "@/src/core/models/Review/Review.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Review implements IReview {
    [key: string]: any;
    [immerable] = true
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    user: IUserSummary = {
        id: "",
        username: "",
        firstname: "",
        lastname: "",
        email: ""
    };
    likes: IUserSummary[] = [];
    id: string = '';
    hikeDate: Date = new Date();
    trail: ITrailSummary = {
        id: "",
        name: ""
    };
    overallRating: number = 0;
    trailMaintenance: DifficultyRating = 'Easy';
    difficultyFactors: DifficultyFactors[] = [];
    favoredFactors: FavoredFactors[] = [];
    review: string = '';
    image: string[] = [];
    predictedDifficulty: DifficultyRating = 'Easy';
    perceivedDifficulty: DifficultyRating = 'undefined';
    
    
    constructor(init?: Partial<IReview>) {
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IReviewDB): Review {
        const mapped: IReview = {
            ...data,
            id,
            trailMaintenance: (data.trailMaintenance && data.trailMaintenance > 0) ? toTextual(data.trailMaintenance) : 'undefined',
            hikeDate: toDate(data.hikeDate),
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            predictedDifficulty: (data.predictedDifficulty && data.predictedDifficulty > 0) ? toTextual(data.predictedDifficulty) : 'undefined',
            perceivedDifficulty: (data.perceivedDifficulty && data.perceivedDifficulty > 0) ? toTextual(data.perceivedDifficulty) : 'undefined',
        }
        console.log('Mapped Review from Firestore: ', mapped);
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
            trailMaintenance: this.trailMaintenance ? toNumerical(this.hike.trailMaintenance) : 0,
            hikeDate: Timestamp.fromDate(this.hike.date),
            trail: this.trail,
            overallRating: this.overallRating,
            difficultyFactors: this.difficultyFactors,
            favoredFactors: this.favoredFactors,
            review: this.review,
            image: this.image,
            predictedDifficulty: (this.predictedDifficulty !== 'undefined') ? toNumerical(this.predictedDifficulty) : 0,
            perceivedDifficulty: (this.perceivedDifficulty !== 'undefined') ? toNumerical(this.perceivedDifficulty) : 0
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