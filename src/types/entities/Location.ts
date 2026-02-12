import { Meters } from "@/src/types/Unit";

export interface Location {
    name?: string;
    latitude: number;
    longitude: number;
    elevation: Meters;
}
export interface Province {
    id: string;
    name: string;
}

export interface Mountain {
    id: string;
    name: string;
    province: Province[];    
}