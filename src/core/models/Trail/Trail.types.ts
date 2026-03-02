import { CircularityType, DifficultyPointsType, TrailQualityType, ViewpointType } from "@/src/types/Enum";
import { Hours, Kilometers, Meters, Percentage } from "@/src/types/Unit";
import { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export interface ITrailSummary {
    id: string;
    name: string;
}

export interface ITrailDB extends ITrailBase<Timestamp | FieldValue>{
    geography: IGeographyDB;
}

export interface ITrail extends ITrailBase<Date>{
    geography: IGeographyUI;
}

export interface ITrailBase<T> {
    id: string;
    general: IGeneral;
    difficulty: IDifficulty;
    tourism: ITourism;
    createdAt: T;
    updatedAt: T;
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
    name: string;
    address: string;
    province: string[];
    mountain: string[];
    rating: number;
    reviewCount: number;
}

export interface IDifficulty {
    length: Kilometers;
    gain: Meters;
    slope: Percentage;
    obstacles: Meters;
    hours: Hours;
    circularity: CircularityType;
    quality: TrailQualityType[];
    difficulty_points: DifficultyPointsType[];
}

export interface ITourism {
    shelter: boolean | null;
    resting: boolean | null;
    information_board: boolean | null;
    clean_water: boolean | null;
    river: boolean | null;
    lake: boolean | null;
    waterfall: boolean| null;
    monument: boolean | null;
    community: boolean | null;
    viewpoint: ViewpointType[] | [];
}

