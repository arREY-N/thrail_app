import { IDescription, IDifficulty, IGeneral, IGeographyUI, IOfflinePoint, ITourism, ITrail, ITrailDB } from "@/src/core/models/Trail/Trail.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, GeoPoint, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Trail implements ITrail {
    [key: string]: any;
    [immerable] = true;
    id: string = '';
    coverImage: string | null = null;
    routeMapImage: string | null = null;
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    description: IDescription = {
        classificationDescription: "",
        lascoRatingDescription: "",
    };
    offlinePoints: IOfflinePoint[] = [];
    geography: IGeographyUI = {
        masl: 0,
        startLat: 0,
        startLong: 0,
        endLat: 0,
        endLong: 0,
    };
    general: IGeneral = {
        active: true,
        name: "",
        address: "",
        province: [],
        mountain: [],
        rating: 0,
        reviewCount: 0,
        description: "",
        guidelines: []
    }; 
    difficulty: IDifficulty = {
        length: 0,
        gain: 0,
        slope: 0,
        obstacles: 0,
        hours: 0,
        circularity: "Circular",
        quality: [],
        difficulty_points: [],
        lascoRating: 0,
        classification: 'major'
    };
    tourism: ITourism = {
        shelter: null,
        resting: null,
        information_board: null,
        clean_water: null,
        river: null,
        lake: null,
        waterfall: null,
        monument: null,
        community: null,
        viewpoint: [],
        network_connection: false
    };
    offlinePoints: IOfflinePoint[] = [];
    
    constructor(init?: Partial<ITrail>){
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: ITrailDB): Trail {
        const mappped: ITrail = {
            ...data,
            id,
            coverImage: data.coverImage || null,
            routeMapImage: data.routeMapImage || null,
            description: data.description || {},
            offlinePoints: data.offlinePoints || [],
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            geography: {
                masl: data.geography?.masl || 0,
                startLat: data.geography?.start?.latitude ?? 0,
                startLong: data.geography?.start?.longitude ?? 0,
                endLat: data.geography?.end?.latitude ?? 0,
                endLong: data.geography?.end?.longitude ?? 0,
            },
            offlinePoints: data.offlinePoints || [],
        }

        return new Trail(mappped);
    }

    toFirestore(): ITrailDB {
        const isNew = this.id === ''

        const mapped: ITrailDB = {
            id: this.id,
            coverImage: this.coverImage,
            routeMapImage: this.routeMapImage,
            description: this.description,
            offlinePoints: this.offlinePoints,
            updatedAt: serverTimestamp(),
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt), 
            general: this.general,
            difficulty: this.difficulty,
            tourism: this.tourism,
            geography: {
                masl: this.geography?.masl || 0,
                start: new GeoPoint(this.geography?.startLat ?? 0, this.geography?.startLong ?? 0),
                end: new GeoPoint(this.geography?.endLat ?? 0, this.geography?.endLong ?? 0)
            },
            offlinePoints: this.offlinePoints || [],
        }

        return mapped;
    }
}

export const trailConverter: FirestoreDataConverter<Trail> = {
    toFirestore: (trail: Trail) => {
        return trail.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Trail => {
        const data = snapshot.data() as ITrailDB;
        return Trail.fromFirestore(snapshot.id, data);
    }
}