import { Coordinates, IHike, IHikeDB, Status } from "@/src/core/models/Hike/Hike.types";
import { toNumerical, toTextual } from "@/src/core/models/Review/Logic/Review.converter";
import { DifficultyFactors, DifficultyRating, FavoredFactors } from "@/src/core/models/Review/Review.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, GeoPoint, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Hike implements IHike {
    [key: string]: any;
    [immerable] = true
    status: Status = 'unhiked';
    mode: "booked" | "direct" = 'direct';
    bookingId?: string | undefined;
    startTime?: Date | undefined;
    endTime?: Date | undefined;
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
    perceivedDifficulty?: DifficultyRating | undefined;
    coordinates: Coordinates[] = [];

    constructor(init?: Partial<IHike>) {
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IHikeDB): Hike {
        const mapped: IHike = {
            ...data,
            id,
            hikeDate: toDate(data.hikeDate),
            predictedDifficulty: toTextual(data.predictedDifficulty),
            perceivedDifficulty: data.perceivedDifficulty !== undefined ? toTextual(data.perceivedDifficulty) : undefined,
            startTime: data.startTime ? toDate(data.startTime) : undefined,
            endTime: data.endTime ? toDate(data.endTime) : undefined,
            trailMaintenance: toTextual(data.trailMaintenance),
            coordinates: data.coordinates.map(coord => ({
                latitude: coord.point.latitude,
                longitude: coord.point.longitude,
                altitude: coord.altitude,
                timestamp: toDate(coord.timestamp)
            }))
        }
        
        return new Hike(mapped);
    }

    toFirestore(): IHikeDB {
        const mapped: IHikeDB = {
            id: this.id,
            hikeDate: Timestamp.fromDate(this.hikeDate),
            trail: this.trail,
            predictedDifficulty: toNumerical(this.predictedDifficulty),
            mode: this.mode,
            status: this.status,
            trailMaintenance: toNumerical(this.trailMaintenance),
            overallRating: this.overallRating,
            difficultyFactors: this.difficultyFactors,
            favoredFactors: this.favoredFactors,
            review: this.review,
            image: this.image,
            coordinates: this.coordinates.map(coord => ({
                point: new GeoPoint(coord.latitude, coord.longitude),
                altitude: coord.altitude || 0,
                timestamp: Timestamp.fromDate(coord.timestamp)
            }))
        }

        if(this.perceivedDifficulty !== undefined) {
            mapped.perceivedDifficulty = toNumerical(this.perceivedDifficulty)
        }

        if(this.mode === 'booked' && this.bookingId) {
            mapped.bookingId = this.bookingId;
        }

        if(this.status !== 'unhiked' && this.startTime){
            mapped.startTime = Timestamp.fromDate(this.startTime)
        }

        if(this.status === 'completed' && this.endTime){
            mapped.endTime = Timestamp.fromDate(this.endTime);
        }

        return mapped;
    }
}

export const hikeConverter: FirestoreDataConverter<Hike> = {
    toFirestore: (hike: Hike) => {
        return hike.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Hike => {
        const data = snapshot.data() as IHikeDB;
        return Hike.fromFirestore(snapshot.id, data);    }
}