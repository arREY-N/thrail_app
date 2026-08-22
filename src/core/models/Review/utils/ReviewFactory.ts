import { IReviewDB, Review } from "@/src/core/models/Review/interfaces/Review.types";
import { toNumerical, toTextual } from "@/src/core/models/Review/utils/Review.converter";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newReview = (init?: Partial<Review>): Review => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
            id: '',
            username: '',
            firstname: '',
            lastname: '',
            email: '',
        },
        likes: [],
        hikeDate: new Date(),
        trail: {
            id: '',
            name: '',
            location: '',
        },
        overallRating: 0,
        trailMaintenance: 'Easy',
        difficultyFactors: [],
        favoredFactors: [],
        review: '',
        image: [],
        predictedDifficulty: 'Easy',
        perceivedDifficulty: 'undefined',
        distance: 0,
        duration: 0,
        elevation: 0,
        ...init,
        ...(init?.createdAt ? { createdAt: toDate(init.createdAt) } : {}),
        ...(init?.updatedAt ? { updatedAt: toDate(init.updatedAt) } : {}),
        ...(init?.hikeDate ? { hikeDate: toDate(init.hikeDate) } : {}),
    };
};

const reviewFromFirestore = (id: string, data: IReviewDB): Review => {
    return {
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        user: data.user ?? { id: '', username: '', firstname: '', lastname: '', email: '' },
        likes: Array.isArray(data.likes) ? data.likes : [],
        hikeDate: toDate(data.hikeDate),
        trail: data.trail ?? { id: '', name: '', location: '' },
        overallRating: data.overallRating ?? 0,
        trailMaintenance: (data.trailMaintenance && data.trailMaintenance > 0) ? toTextual(data.trailMaintenance) : 'undefined',
        difficultyFactors: Array.isArray(data.difficultyFactors) ? data.difficultyFactors : [],
        favoredFactors: Array.isArray(data.favoredFactors) ? data.favoredFactors : [],
        review: data.review ?? '',
        image: Array.isArray(data.image) ? data.image : [],
        predictedDifficulty: (data.predictedDifficulty && data.predictedDifficulty > 0) ? toTextual(data.predictedDifficulty) : 'undefined',
        perceivedDifficulty: (data.perceivedDifficulty && data.perceivedDifficulty > 0) ? toTextual(data.perceivedDifficulty) : 'undefined',
        distance: data.distance || 0,
        duration: data.duration || 0,
        elevation: data.elevation || 0,
    };
};

const reviewToFirestore = (review: Review): IReviewDB => {
    const isNew = review.id === '';

    return {
        id: review.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(toDate(review.createdAt)),
        updatedAt: serverTimestamp(),
        user: review.user,
        likes: review.likes ?? [],
        hikeDate: Timestamp.fromDate(toDate(review.hikeDate)),
        trail: review.trail,
        overallRating: review.overallRating ?? 0,
        trailMaintenance: review.trailMaintenance ? toNumerical(review.trailMaintenance) : 0,
        difficultyFactors: review.difficultyFactors ?? [],
        favoredFactors: review.favoredFactors ?? [],
        review: review.review ?? '',
        image: review.image ?? [],
        predictedDifficulty: (review.predictedDifficulty !== 'undefined') ? toNumerical(review.predictedDifficulty) : 0,
        perceivedDifficulty: (review.perceivedDifficulty !== 'undefined') ? toNumerical(review.perceivedDifficulty) : 0,
        distance: review.distance || 0,
        duration: review.duration || 0,
        elevation: review.elevation || 0,
    };
};

export const reviewConverter: FirestoreDataConverter<Review> = {
    toFirestore: (review: Review) => {
        return reviewToFirestore(review);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Review => {
        const data = snapshot.data() as IReviewDB;
        return reviewFromFirestore(snapshot.id, data);
    },
};