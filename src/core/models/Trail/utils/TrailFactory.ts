import { ITrailDB, Trail } from "@/src/core/models/Trail/interfaces/Trail.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, GeoPoint, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newTrail = (init?: Partial<Trail>): Trail => {
    return {
        id: '',
        coverImage: null,
        routeMapImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: {
            classificationDescription: "",
            lascoRatingDescription: "",
        },
        offlinePoints: [],
        geography: {
            masl: 0,
            startLat: 0,
            startLong: 0,
            endLat: 0,
            endLong: 0,
        },
        general: {
            active: true,
            name: "",
            address: "",
            province: [],
            mountain: [],
            rating: 0,
            reviewCount: 0,
            description: "",
            guidelines: [],
            safety_tips: [],
            lgu_rules: [],
            critical_info: "",
        },
        difficulty: {
            length: 0,
            gain: 0,
            slope: 0,
            obstacles: 0,
            hours: 0,
            circularity: "Circular",
            quality: [],
            difficulty_points: [],
            lascoRating: 0,
            classification: undefined,
        },
        tourism: {
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
            network_connection: false,
        },
        ...init,
    };
};

const trailFromFirestore = (id: string, data: ITrailDB): Trail => {
    return {
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
    };
};

const trailToFirestore = (trail: Trail): ITrailDB => {
    const isNew = trail.id === '';

    const data: ITrailDB = {
        id: trail.id,
        coverImage: trail.coverImage,
        routeMapImage: trail.routeMapImage,
        description: trail.description,
        offlinePoints: trail.offlinePoints,
        updatedAt: serverTimestamp(),
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(trail.createdAt),
        general: trail.general,
        difficulty: trail.difficulty,
        tourism: trail.tourism,
        geography: {
            masl: trail.geography?.masl || 0,
            start: new GeoPoint(trail.geography?.startLat ?? 0, trail.geography?.startLong ?? 0),
            end: new GeoPoint(trail.geography?.endLat ?? 0, trail.geography?.endLong ?? 0),
        },
    };

    return data;
};

export const trailConverter: FirestoreDataConverter<Trail> = {
    toFirestore: (trail: Trail) => {
        return trailToFirestore(trail);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Trail => {
        const data = snapshot.data() as ITrailDB;
        return trailFromFirestore(snapshot.id, data);
    },
};