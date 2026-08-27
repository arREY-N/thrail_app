import { CircularityType, DifficultyPointsType, TrailQualityType, ViewpointType } from "@/src/core/types/Enum";
import { Hours, Kilometers, Meters, Percentage } from "@/src/core/types/Unit";
import { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export interface ITrailSummary {
    id: string;
    name: string;
    location?: string;
}

export interface ITrailBase<T> {
    id: string;
    coverImage: string | null;
    routeMapImage: string | null;
    offlinePoints?: IOfflinePoint[];
    general: IGeneral;
    difficulty: IDifficulty;
    tourism: ITourism;
    description: IDescription;
    createdAt: T;
    updatedAt: T;
}

export interface IDescription {
    classificationDescription?: string;
    lascoRatingDescription?: string;
}

export interface IGeographyDB {
    masl: Meters;
    start: GeoPoint;
    end: GeoPoint;
}

export interface IGeographyUI {
    masl: Meters;
    startLat: number;
    startLong: number;
    endLat: number;
    endLong: number;
}

export interface IGeneral {
    active: boolean;
    name: string;
    address: string;
    province: string[];
    mountain: string[];
    rating: number;
    reviewCount: number;
    description: string;
    guidelines: string[];
    safety_tips?: string[];
    lgu_rules?: string[];
    critical_info?: string;
}

export interface IDifficulty {
    lascoRating: number;
    classification?: 'minor' | 'major' | string;
    length: Kilometers;
    gain: Meters;
    slope: Percentage;
    obstacles: Meters;
    hours: Hours;
    circularity: CircularityType;
    quality: TrailQualityType[];
    difficulty_points: DifficultyPointsType[];
    elevation?: number;
}

export interface ITourism {
    shelter: boolean | null;
    resting: boolean | null;
    information_board: boolean | null;
    clean_water: boolean | null;
    river: boolean | null;
    lake: boolean | null;
    waterfall: boolean | null;
    monument: boolean | null;
    community: boolean | null;
    viewpoint: ViewpointType[] | [];
    network_connection: boolean;
}

export interface ICoordinate {
    latitude: number;
    longitude: number;
    altitude: number;
}

export interface ITrailStats {
    distance: number;        // in meters
    elevationGain: number;   // in meters
    elevationLoss: number;   // in meters
}

export interface IOfflinePoint {
    id: string;
    name: string;
    type: 'checkpoint' | 'viewpoint' | 'water' | 'shelter' | 'summit' | 'hazard';
    description: string;
    x: number; // horizontal percentage coordinate (0-100)
    y: number; // vertical percentage coordinate (0-100)
}

export interface ITrailDB extends ITrailBase<Timestamp | FieldValue> {
    geography: IGeographyDB;
}

export interface ITrail extends ITrailBase<Date> {
    geography: IGeographyUI;
}

export type Trail = ITrail;
