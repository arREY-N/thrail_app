import { IRecommendationDB, Recommendation } from "@/src/core/models/Recommendation/interfaces/Recommendation.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newRecommendation = (init?: Partial<Recommendation>): Recommendation => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        trails: [],
        ...init,
    };
};

const recommendationFromFirestore = (id: string, data: IRecommendationDB): Recommendation => {
    return {
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        trails: data.trails || [],
    };
};

const recommendationToFirestore = (recommendation: Recommendation): IRecommendationDB => {
    const isNew = recommendation.id === '';

    return {
        id: recommendation.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(recommendation.createdAt),
        updatedAt: serverTimestamp(),
        trails: recommendation.trails || [],
    };
};

export const recommendationConverter: FirestoreDataConverter<Recommendation> = {
    toFirestore: (recommendation: Recommendation) => {
        return recommendationToFirestore(recommendation);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Recommendation => {
        const data = snapshot.data() as IRecommendationDB;
        return recommendationFromFirestore(snapshot.id, data);
    },
};