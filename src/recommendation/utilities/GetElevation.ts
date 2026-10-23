import { Location } from "@/src/core/models/Location/Location";
import { Trail } from "@/src/core/models/Trail/Trail";

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

// In-memory elevation cache across app lifetime / hot reload
export const elevationCache: Record<string, number> = {};

/**
 * Validates whether latitude and longitude are valid non-zero GPS coordinates.
 */
export function isValidCoordinate(lat?: number, lon?: number): boolean {
    return (
        typeof lat === "number" &&
        typeof lon === "number" &&
        !isNaN(lat) &&
        !isNaN(lon) &&
        (lat !== 0 || lon !== 0) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );
}

/**
 * Raw bulk elevation fetcher from Open-Meteo.
 * Automatically chunks requests into batches of 50 to avoid URL length constraints.
 */
export async function fetchElevations(coords: CoordinateLike[]): Promise<number[]> {
    if (coords.length === 0) return [];

    const BATCH_SIZE = 50;
    const allElevations: number[] = [];

    for (let i = 0; i < coords.length; i += BATCH_SIZE) {
        const batch = coords.slice(i, i + BATCH_SIZE);
        const lats = batch.map((c) => c.latitude).join(',');
        const lons = batch.map((c) => c.longitude).join(',');
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Open-Meteo elevation error: ${response.statusText}`);
            }
            const rawText = await response.text();
            // Sanitize unquoted nan/NaN emitted by Open-Meteo for invalid/ocean coordinates
            const sanitizedText = rawText
                .replace(/:\s*nan\b/gi, ': null')
                .replace(/,\s*nan\b/gi, ', null')
                .replace(/\[\s*nan\b/gi, '[ null');
            const data: ElevationResponse = JSON.parse(sanitizedText);
            const elevations = Array.isArray(data.elevation)
                ? data.elevation.map((v) => (typeof v === "number" && !isNaN(v) ? v : 0))
                : typeof data.elevation === "number" && !isNaN(data.elevation)
                ? [data.elevation]
                : [];
            allElevations.push(...elevations);
        } catch (error) {
            console.warn("Error fetching batch elevation data:", error);
            // Push zeroes as fallback for the failed batch so indices align
            allElevations.push(...new Array(batch.length).fill(0));
        }
    }

    return allElevations;
}

/**
 * Retrieves trailhead start elevations for a list of trails, using cache when available.
 * Returns a map of trailId -> startElevation in meters.
 */
export async function getTrailStartElevations(trails: Trail[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const trailsToQuery: { trailId: string; coord: { latitude: number; longitude: number } }[] = [];

    for (const trail of trails) {
        if (!trail.id) continue;

        if (elevationCache[trail.id] !== undefined) {
            results[trail.id] = elevationCache[trail.id];
            continue;
        }

        const sLat = trail.geography?.startLat;
        const sLon = trail.geography?.startLong;

        if (isValidCoordinate(sLat, sLon)) {
            trailsToQuery.push({
                trailId: trail.id,
                coord: { latitude: sLat as number, longitude: sLon as number },
            });
        } else {
            // Coordinate not available: fallback to estimating start elevation from masl - gain
            const masl = trail.geography?.masl || 0;
            const fallbackGain = trail.difficulty?.gain || 0;
            const estimatedStart = Math.max(0, masl - fallbackGain);
            elevationCache[trail.id] = estimatedStart;
            results[trail.id] = estimatedStart;
        }
    }

    if (trailsToQuery.length > 0) {
        const coords = trailsToQuery.map((t) => t.coord);
        const elevations = await fetchElevations(coords);

        trailsToQuery.forEach((item, idx) => {
            const elev = elevations[idx] ?? 0;
            elevationCache[item.trailId] = elev;
            results[item.trailId] = elev;
        });
    }

    return results;
}

/**
 * Computes trail elevation gain using the formula:
 * gain = geography.masl - startElevation
 * Fallback to difficulty.gain if startElevation is unavailable.
 */
export function calculateTrailGain(trail: Trail, startElevation?: number | null): number {
    const masl = trail.geography?.masl || 0;
    if (startElevation != null && !isNaN(startElevation)) {
        return Math.max(0, Math.round(masl - startElevation));
    }
    return Math.max(0, trail.difficulty?.gain || 0);
}