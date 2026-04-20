import { ICoordinate, ITrailStats } from "@/src/core/models/Trail/Trail.types";
import computeTotalLength, { geoJSONToCoordinate } from "./TrailComputation";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

// --- Types for raw GeoJSON structure ---
interface GeoJSONFeature {
    properties: {
        assigned_mountain?: string;
        name?: string;
        highway?: string;
        [key: string]: any;
    };
    geometry: {
        type: string;
        coordinates: number[][] | number[][][];
    };
}

interface GeoJSONCollection {
    features: GeoJSONFeature[];
}

// Highway types that represent actual hiking trails (not roads/highways)
const HIKING_HIGHWAY_TYPES = new Set(["path", "footway"]);

// Only include segments where at least one point is within this radius (meters)
// of the trailhead. Compromise: 2000m works across most mountains.
// Tagapo (island trail) needs ~2500m, Batulao (multi-trail) needs ~1500m.
const TRAILHEAD_RADIUS_M = 2000;

// The raw require returns an asset ID (number) in Metro
const rawGeoJSONAsset = require("@/src/assets/map_data/trails_3D_final_v2.geojson");

// --- Singleton state ---
let mountainIndex: Map<string, ICoordinate[][]> | null = null;
let indexBuildPromise: Promise<void> | null = null;
const statsCache = new Map<string, ITrailStats>();

/**
 * Quick haversine for filtering (returns meters).
 */
function quickHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (d: number) => d * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Reads the GeoJSON asset from the device filesystem.
 */
async function loadGeoJSON(): Promise<GeoJSONCollection> {
    const asset = Asset.fromModule(rawGeoJSONAsset);
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error("GeoJSON asset has no localUri after download");
    const jsonString = await FileSystem.readAsStringAsync(asset.localUri);
    return JSON.parse(jsonString) as GeoJSONCollection;
}

/**
 * Extracts individual line segments from a GeoJSON feature geometry.
 */
function extractSegments(geom: GeoJSONFeature["geometry"]): ICoordinate[][] {
    const segments: ICoordinate[][] = [];
    if (geom.type === "LineString") {
        const coords = (geom.coordinates as number[][]).map(geoJSONToCoordinate);
        if (coords.length >= 2) segments.push(coords);
    } else if (geom.type === "MultiLineString") {
        for (const line of geom.coordinates as number[][][]) {
            const coords = line.map(geoJSONToCoordinate);
            if (coords.length >= 2) segments.push(coords);
        }
    }
    return segments;
}

/**
 * Checks if a segment has at least one point within `radius` meters of (lat, lon).
 */
function segmentNearPoint(segment: ICoordinate[], lat: number, lon: number, radius: number): boolean {
    for (const coord of segment) {
        if (quickHaversine(coord.latitude, coord.longitude, lat, lon) <= radius) {
            return true;
        }
    }
    return false;
}

/**
 * Builds the mountain index. Runs once on first use.
 */
async function buildIndex(): Promise<void> {
    try {
        console.log("⏳ Building GeoJSON index...");
        const rawData = await loadGeoJSON();
        const index = new Map<string, ICoordinate[][]>();
        let totalSegments = 0;

        for (const feature of rawData.features) {
            const mountain = feature.properties?.assigned_mountain;
            if (!mountain) continue;

            const highway = feature.properties?.highway;
            if (!highway || !HIKING_HIGHWAY_TYPES.has(highway)) continue;

            const key = mountain.toLowerCase().trim();
            if (!index.has(key)) index.set(key, []);

            const segments = extractSegments(feature.geometry);
            index.get(key)!.push(...segments);
            totalSegments += segments.length;
        }

        mountainIndex = index;
        console.log(`✅ GeoJSON index built: ${index.size} mountains, ${totalSegments} trail segments`);
    } catch (err) {
        console.error("❌ Failed to build GeoJSON index:", err);
        mountainIndex = new Map();
    }
}

async function ensureIndex(): Promise<void> {
    if (mountainIndex) return;
    if (indexBuildPromise) return indexBuildPromise;
    indexBuildPromise = buildIndex();
    await indexBuildPromise;
    indexBuildPromise = null;
}

/**
 * Gets trail stats for a given mountain.
 * 
 * @param mountainName - e.g., "Mount Tagapo". Case-insensitive.
 * @param startLat - Optional trailhead latitude for proximity filtering.
 * @param startLon - Optional trailhead longitude for proximity filtering.
 *                   When provided, only segments within 2.5km of this point are included.
 *                   This filters out village footpaths far from the actual hiking trail.
 */
export async function getStatsForMountain(
    mountainName: string,
    startLat?: number,
    startLon?: number
): Promise<ITrailStats | null> {
    // Build a unique cache key that includes coordinates when provided
    const coordKey = (startLat && startLon) ? `_${startLat.toFixed(4)}_${startLon.toFixed(4)}` : "";
    const key = mountainName.toLowerCase().trim() + coordKey;

    if (statsCache.has(key)) return statsCache.get(key)!;

    await ensureIndex();
    if (!mountainIndex) return null;

    const allSegments = mountainIndex.get(mountainName.toLowerCase().trim());
    if (!allSegments || allSegments.length === 0) {
        console.warn(`⚠️ No trail data found for: "${mountainName}"`);
        return null;
    }

    // Filter segments by proximity to trailhead if coordinates provided
    let segments = allSegments;
    if (startLat && startLon) {
        segments = allSegments.filter(seg =>
            segmentNearPoint(seg, startLat, startLon, TRAILHEAD_RADIUS_M)
        );
        console.log(`🎯 Proximity filter: ${segments.length}/${allSegments.length} segments within ${TRAILHEAD_RADIUS_M}m of trailhead`);
    }

    if (segments.length === 0) {
        console.warn(`⚠️ No segments near trailhead for: "${mountainName}"`);
        return null;
    }

    // Compute stats per-segment and sum them
    let totalDistance = 0;
    let totalGain = 0;
    let totalLoss = 0;

    for (const segment of segments) {
        const segStats = computeTotalLength(segment);
        totalDistance += segStats.distance;
        totalGain += segStats.elevationGain;
        totalLoss += segStats.elevationLoss;
    }

    const stats: ITrailStats = {
        distance: totalDistance,
        elevationGain: totalGain,
        elevationLoss: totalLoss,
    };

    statsCache.set(key, stats);
    console.log(`📊 "${mountainName}": ${(stats.distance / 1000).toFixed(1)}km, +${stats.elevationGain.toFixed(0)}m, -${stats.elevationLoss.toFixed(0)}m`);
    return stats;
}

export async function getIndexedMountains(): Promise<string[]> {
    await ensureIndex();
    if (!mountainIndex) return [];
    return Array.from(mountainIndex.keys());
}

export function clearStatsCache(): void {
    statsCache.clear();
}
