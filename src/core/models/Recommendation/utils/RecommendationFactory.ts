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

const normalizeRecoItem = (item: any, defaultCategory: 'easy' | 'difficult'): IRecommendedTrailItem => {
    if (!item) {
        return {
            id: '',
            trailName: '',
            category: defaultCategory,
            haveHiked: false,
            score: 0,
        };
    }

    const id = item.id || item.trailId || item.trail_id || item.trail?.id || '';
    const trailName = item.trailName || item.name || item.general?.name || '';
    const category = (item.category === 'easy' || item.category === 'difficult') ? item.category : defaultCategory;
    const haveHiked = Boolean(item.haveHiked);
    const score = typeof item.score === 'number' ? item.score : 0;
    const cbfScore = typeof item.cbfScore === 'number' ? item.cbfScore : (typeof item.cbf === 'number' ? item.cbf : undefined);
    const cfScore = typeof item.cfScore === 'number' ? item.cfScore : (typeof item.cf === 'number' ? item.cf : undefined);

    return {
        id,
        trailName,
        category,
        haveHiked,
        score,
        cbfScore,
        cfScore,
    };
};

const recommendationFromFirestore = (id: string, data: any): Recommendation => {
    const rawTrails = Array.isArray(data.trails) ? data.trails : [];
    const rawEasy = Array.isArray(data.easy) ? data.easy : [];
    const rawDiff = Array.isArray(data.difficult) ? data.difficult : [];

    // Fallback: If 'easy' is empty but 'trails' exists, use 'trails' for easy list
    const sourceEasy = rawEasy.length > 0 ? rawEasy : rawTrails;
    const sourceDiff = rawDiff.length > 0 ? rawDiff : rawTrails.filter((t: any) => t.category === 'difficult');

    const easyList: IRecommendedTrailItem[] = sourceEasy.map((i: any) => normalizeRecoItem(i, 'easy'));
    const diffList: IRecommendedTrailItem[] = sourceDiff.map((i: any) => normalizeRecoItem(i, 'difficult'));

    return {
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        profile: data.profile || { easy: null, difficult: null },
        easy: easyList,
        difficult: diffList,
        engineConfig: data.engineConfig,
        trails: easyList.length > 0 ? easyList : (rawTrails.length > 0 ? rawTrails.map((i: any) => normalizeRecoItem(i, 'easy')) : []),
        aiReasonings: data.aiReasonings || {},
    };
};

const recommendationToFirestore = (recommendation: Recommendation): IRecommendationDB => {
    const isNew = recommendation.id === '';

    return {
        id: recommendation.id,
        createdAt: isNew 
            ? serverTimestamp() 
            : (recommendation.createdAt instanceof Date 
                ? Timestamp.fromDate(recommendation.createdAt) 
                : (recommendation.createdAt ? Timestamp.fromDate(new Date(recommendation.createdAt)) : serverTimestamp())),
        updatedAt: serverTimestamp(),
        profile: recommendation.profile || { easy: null, difficult: null },
        easy: recommendation.easy || [],
        difficult: recommendation.difficult || [],
        ...(recommendation.engineConfig ? { engineConfig: recommendation.engineConfig } : {}),
        ...(recommendation.aiReasonings ? { aiReasonings: recommendation.aiReasonings } : {}),
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