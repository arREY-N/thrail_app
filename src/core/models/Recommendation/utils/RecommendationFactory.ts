import { IRecommendationDB, IRecommendedTrailItem, Recommendation } from "@/src/core/models/Recommendation/interfaces/Recommendation.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newRecommendation = (init?: Partial<Recommendation>): Recommendation => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: { easy: null, difficult: null },
        easy: [],
        difficult: [],
        trails: [],
        ...init,
    };
};

const recommendationFromFirestore = (id: string, data: any): Recommendation => {
    const easyList: IRecommendedTrailItem[] = Array.isArray(data.easy) ? data.easy : [];
    const diffList: IRecommendedTrailItem[] = Array.isArray(data.difficult) ? data.difficult : [];

    return {
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        profile: data.profile || { easy: null, difficult: null },
        easy: easyList,
        difficult: diffList,
        engineConfig: data.engineConfig,
        trails: easyList.length > 0 ? easyList : (Array.isArray(data.trails) ? data.trails : []),
    };
};

const recommendationToFirestore = (recommendation: Recommendation): IRecommendationDB => {
    const isNew = recommendation.id === '';

    return {
        id: recommendation.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(recommendation.createdAt),
        updatedAt: serverTimestamp(),
        profile: recommendation.profile || { easy: null, difficult: null },
        easy: recommendation.easy || [],
        difficult: recommendation.difficult || [],
        ...(recommendation.engineConfig ? { engineConfig: recommendation.engineConfig } : {}),
    };
};

export const recommendationConverter: FirestoreDataConverter<Recommendation> = {
    toFirestore: (recommendation: Recommendation) => {
        return recommendationToFirestore(recommendation);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Recommendation => {
        const data = snapshot.data();
        return recommendationFromFirestore(snapshot.id, data);
    },
};