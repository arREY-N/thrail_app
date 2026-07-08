import { IHike, IHikeDB, Status } from "@/src/core/models/Hike/Hike.types";
import { toNumerical, toTextual } from "@/src/core/models/Review/Logic/Review.converter";
import { DifficultyFactors, DifficultyRating, FavoredFactors } from "@/src/core/models/Review/Review.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
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
    perceivedDifficulty: DifficultyRating = 'undefined';
    distance?: number;
    duration?: number
    elevation?: number;

    constructor(init?: Partial<IHike>) {
        // 1. Perform the shallow copy first
        Object.assign(this, init);

        // 2. Guarantee that dates are true Date instances, not raw strings
        if (this.hikeDate && typeof this.hikeDate === 'string') {
            this.hikeDate = toDate(this.hikeDate);
        }
        if (this.startTime && typeof this.startTime === 'string') {
            this.startTime = toDate(this.startTime);
        }
        if (this.endTime && typeof this.endTime === 'string') {
            this.endTime = toDate(this.endTime);
        }
    }

    static fromFirestore(id: string, data: IHikeDB): Hike {
        const mapped: IHike = {
            ...data,
            id,
            hikeDate: toDate(data.hikeDate),
            predictedDifficulty: toTextual(data.predictedDifficulty),
            perceivedDifficulty: (data.perceivedDifficulty && data.perceivedDifficulty > 0) ? toTextual(data.perceivedDifficulty) : 'undefined',
            startTime: data.startTime ? toDate(data.startTime) : undefined,
            endTime: data.endTime ? toDate(data.endTime) : undefined,
            trailMaintenance: toTextual(data.trailMaintenance),

            distance: data.distance || 0,
            duration: data.duration || 0,
            elevation: data.elevation || 0,
        }
        
        return new Hike(mapped);
    }

    toFirestore(): IHikeDB {
        const mapped: IHikeDB = {
            id: this.id,
            hikeDate: this.hikeDate ? Timestamp.fromDate(this.hikeDate) : Timestamp.fromDate(new Date()),
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
            perceivedDifficulty: this.perceivedDifficulty !== 'undefined' ? toNumerical(this.perceivedDifficulty) : 0,

            distance: this.distance || 0,
            duration: this.duration || 0,
            elevation: this.elevation || 0,
        }

        if(this.mode === 'booked' && this.bookingId) {
            mapped.bookingId = this.bookingId;
        }

        if(this.status !== 'unhiked' && this.startTime){
            try {
                console.log('mapping startTime: ', this.startTime);
                mapped.startTime = Timestamp.fromDate(this.startTime ?? new Date());
            } catch (error){
                console.log('in line 84: ', error);
            }
        }

        if(this.status === 'completed' && this.endTime){
            try {
                console.log('mapping endTime: ', this.endTime);
                mapped.endTime = Timestamp.fromDate(this.endTime ?? new Date());
            } catch (error){
                console.log('in line 92: ', error);
            }
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