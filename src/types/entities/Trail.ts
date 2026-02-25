import { CircularityType, DifficultyPointsType, TrailQualityType, ViewpointType } from "@/src/types/Enum";
import { Hours, Kilometers, Meters, Percentage } from "@/src/types/Unit";
import { GeoPoint } from "firebase/firestore";
import { FieldConfig } from "../Property";

export interface TrailDB{
    id?: string;
    general: {
        name: string;
        address: string;
        province: string[];
        mountain: string[];
        rating: number;
        reviewCount: number;
    },
    geography: {
        masl: Meters;
        start: GeoPoint;
        end: GeoPoint;
    },
    difficulty: {
        length: Kilometers;
        gain: Meters;
        slope: Percentage;
        obstacles: Meters;
        hours: Hours;
        circularity: CircularityType;
        quality: TrailQualityType[];
        difficulty_points: DifficultyPointsType[];
    },
    tourism: {
        shelter: boolean | null;
        resting: boolean | null;
        information_board: boolean | null;
        clean_water: boolean | null;
        river: boolean | null;
        lake: boolean | null;
        waterfall: boolean| null;
        monument: boolean | null;
        community: boolean | null;
        viewpoint: ViewpointType[];
    }
}

export interface TrailUI{
    id?: string;
    name: string;
    address: string;
    province: string[];
    mountain: string[];
    rating: number;
    reviewCount: number;
    masl: Meters;
    startLat: number;
    startLong: number;
    endLat: number;
    endLong: number;
    length: Kilometers;
    gain: Meters;
    slope: Percentage;
    obstacles: Meters;
    hours: Hours;
    circularity: CircularityType;
    quality: TrailQualityType[];
    difficulty_points: DifficultyPointsType[];
    shelter: boolean | null;
    resting: boolean | null;
    information_board: boolean | null;
    clean_water: boolean | null;
    river: boolean | null;
    lake: boolean | null;
    waterfall: boolean| null;
    monument: boolean | null;
    community: boolean | null;
    viewpoint: ViewpointType[];
}

export class TrailUI{
    name: string = '';
    address: string = '';
    province: string[] = [];
    mountain: string[] = [];
    masl: Meters = 0;
    rating: number = 0;
    reviewCount: number = 0;
    startLat: number = 0;
    startLong: number = 0;
    endLat: number = 0;
    endLong: number = 0;
    length: Kilometers = 0;
    gain: Meters = 0;
    slope: Percentage = 0;
    obstacles: Meters = 0;
    hours: Hours = 0;
    circularity: CircularityType = 'Circular';
    quality: TrailQualityType[] = [];
    difficulty_points: DifficultyPointsType[] = [];
    shelter: boolean | null = null;
    resting: boolean | null = null;
    information_board: boolean | null = null;
    clean_water: boolean | null = null;
    river: boolean | null = null;
    lake: boolean | null = null;
    waterfall: boolean| null = null;
    monument: boolean | null = null;
    community: boolean | null = null;
    viewpoint: ViewpointType[] = [];

    constructor(init?: Partial<TrailUI>){
        Object.assign(this, init);
    }
}

export interface TrailFormStructure {
    general: Record<string, FieldConfig>;
    geography: Record<string, FieldConfig>;
    difficulty: Record<string, FieldConfig>;
    tourism: Record<string, FieldConfig>;
}

export const TRAIL_CONFIG: TrailFormStructure = {
    general: {
        name: {
            text: 'Name', 
            type: 'text',
            required: true,
        },
        address: {
            text: 'Address', 
            type: 'text',
            required: true,
        },
        province: {
            text: 'Province', 
            type: 'multi-select', 
            options: 'provinces',
            required: true,
        },
        mountain: {
            text: 'Mountain',
            type: 'object-select',
            options: 'mountains',
            key: 'name',
            required: true,
        }
    },
    geography: {
        longitude: {
            text: 'Longitude', 
            type: 'numerical',
            required: true,
        },
        latitude: {
            text: 'Latitude', 
            type: 'numerical',
            required: true,
        },
        masl: {
            text: 'MASL', 
            type: 'numerical',
            required: true,
        },
        start: {
            text: 'Start', 
            type: 'numerical',
            required: true,
        },
        end: {
            text: 'End', 
            type: 'numerical',
            required: true,
        },
    },
    difficulty: {
        length: {
            text: 'Length (km)', 
            type: 'numerical',
            required: true,
        },
        gain: {
            text: 'Elevation Gain (km)', 
            type: 'numerical',
            required: true,
        },
        slope: {
            text: 'Slope (%)', 
            type: 'numerical',
            required: true,
        },
        obstacles: {
            text: 'Slope obstacles (km)', 
            type: 'numerical',
            required: true,
        },
        hours: {
            text: 'Hours to summit (hr)', 
            type: 'numerical',
            required: true,
        },
        circularity: {
            text: 'Trail Circularity', 
            type: 'single-select', 
            options: 'circularity',
            required: true,
        },
        quality: {
            text: 'Trail Quality', 
            type: 'multi-select', 
            options: 'quality',
            required: true,
        },
        difficulty_points: {
            text: 'Difficulty points', 
            type: 'multi-select', 
            options: 'difficulty_points',
            required: false,
        },
    },
    tourism: {
        shelter: {
            text: 'Shelter', 
            type: 'boolean',
            required: false,
        },
        resting: {
            text: 'Resting areas', 
            type: 'boolean',
            required: false,
        },
        information_board: {
            text: 'Information Board', 
            type: 'boolean',
            required: false,
        },
        clean_water: {
            text: 'Drinking Water', 
            type: 'boolean',
            required: false,
        },
        river: {
            text: 'Rivers', 
            type: 'boolean',
            required: false,
        },
        lake: {
            text: 'Lakes', 
            type: 'boolean',
            required: false,
        },
        waterfall: {
            text: 'Waterfalls', 
            type: 'boolean',
            required: false,
        },
        monument: {
            text: 'Monuments', 
            type: 'boolean',
            required: false,
        },
        community: {
            text: 'Communities', 
            type: 'boolean',
            required: false,
        },
        viewpoint: {
            text: 'Viewpoints', 
            type: 'multi-select', 
            options: 'viewpoints',
            required: false,
        },
    }
}