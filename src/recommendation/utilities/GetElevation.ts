import { Location } from "@/src/core/models/Location/Location";

export interface ElevationResponse {
    latitude: number;
    longitude: number;
    elevation: number[]; // Open-Meteo returns an array matching input order
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation_unit: string;
}

export type CoordinateLike = Location | { latitude: number; longitude: number };

export async function fetchElevations(coords: CoordinateLike[]): Promise<number[]> {
    if (coords.length === 0) return [];

    // Join latitudes and longitudes with commas for bulk querying
    const lats = coords.map((c) => c.latitude).join(',');
    const lons = coords.map((c) => c.longitude).join(',');

    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch elevation: ${response.statusText}`);
        }

        const data: ElevationResponse = await response.json();
        const elevation = data.elevation;
        return Array.isArray(elevation) ? elevation : (typeof elevation === "number" ? [elevation] : []);
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        throw error;
    }
}