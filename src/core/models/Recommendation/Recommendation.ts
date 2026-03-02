import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { toDate } from "../../utility/date";
import { IRecommendation, IRecommendationDB, IRecommendedTrail } from "./Recommendation.types";

export class Recommendation implements IRecommendation {
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    trails: IRecommendedTrail[] = [];
    
    constructor(init?: Partial<IRecommendation>){
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IRecommendationDB): Recommendation{
        const mapped: IRecommendation = {
            id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            trails: data.trails,
        }

        return new Recommendation(mapped)
    }

    toFirestore(): IRecommendationDB {
        const isNew = this.id === '';

        const mapped: IRecommendationDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            trails: this.trails,
        }

        return mapped;
    }
}

export const recommendationConverter: FirestoreDataConverter<Recommendation> = {
    toFirestore: (recommendation: Recommendation) => {
        return recommendation.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Recommendation => {
        const data = snapshot.data() as IRecommendationDB;
        return Recommendation.fromFirestore(snapshot.id, data);
    }
}