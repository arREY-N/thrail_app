import { ICoordinate, ITrailStats } from "@/src/core/models/Trail/interfaces/Trail.types";
import computeTotalLength, { geoJSONToCoordinate } from "@/src/core/models/Trail/utils/TrailComputation";

import {
  MOUNTAIN_TRAIL_REGISTRY,
  SupportedMountainId,
  getOrDownloadAllMountainsGeoJson,
  getOrDownloadTrailGeoJson,
  readGeoJsonFromUri,
  resolveMountainId,
  resolveMountainIdByCoords,
} from "@/src/features/Map/services/TrailOfflineManager";

// --- Types for raw GeoJSON structure ---
interface GeoJSONFeature {
    properties: {
        mountain_id?: string;
        mountain_name?: string;
        trail_id?: string;
        trail_name?: string;
        assigned_mountain?: string;
        name?: string;
        highway?: string;
        total_distance_m?: number;
        elevation_gain_m?: number;
        elevation_loss_m?: number;
        [key: string]: unknown;
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
const HIKING_HIGHWAY_TYPES = new Set(["path", "footway", "track"]);

// Only include segments where at least one point is within this radius (meters)
// of the trailhead. Compromise: 2000m works across most mountains.
const TRAILHEAD_RADIUS_M = 2000;

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
 * Reads the combined GeoJSON from offline storage or downloads from Firebase Storage (`trail_routes/`).
 */
async function loadGeoJSON(): Promise<GeoJSONCollection> {
    const uri = await getOrDownloadAllMountainsGeoJson();
    return (await readGeoJsonFromUri(uri)) as GeoJSONCollection;
}

/**
 * Extracts individual line segments (`ICoordinate[][]`) from a GeoJSON feature geometry.
 */
function extractSegments(geom: GeoJSONFeature["geometry"]): ICoordinate[][] {
    const segments: ICoordinate[][] = [];
    if (!geom || !geom.coordinates) return segments;

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
 * Checks if a segment (`ICoordinate[]`) has at least one point within `radius` meters of (lat, lon).
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
 * Supports both new modular `trail_routes` GeoJSON properties (`mountain_name`, `mountain_id`)
 * and legacy `assigned_mountain` properties.
 */
async function buildIndex(): Promise<void> {
    try {
        console.log("⏳ Building GeoJSON index...");
        const rawData = await loadGeoJSON();
        const index = new Map<string, ICoordinate[][]>();
        let totalSegments = 0;

        for (const feature of rawData.features || []) {
            const props = feature.properties || {};
            const mountain =
                props.mountain_name ||
                props.assigned_mountain ||
                props.mountain_id;
            if (!mountain) continue;

            // For legacy features that specify `highway`, filter to hiking types;
            // modular `trail_routes` features are already verified hiking trails.
            const highway = props.highway;
            if (highway && !HIKING_HIGHWAY_TYPES.has(highway)) continue;

            const segments = extractSegments(feature.geometry);
            if (segments.length === 0) continue;

            // Index under both the full name ("mt. batulao", "mount batulao") and the short ID ("batulao")
            const keysToRegister = new Set<string>([mountain.toLowerCase().trim()]);
            if (props.mountain_id) {
                const mId = props.mountain_id.toLowerCase().trim() as SupportedMountainId;
                keysToRegister.add(mId);
                keysToRegister.add(`mt. ${mId}`);
                keysToRegister.add(`mount ${mId}`);
                if (MOUNTAIN_TRAIL_REGISTRY[mId]) {
                    keysToRegister.add(MOUNTAIN_TRAIL_REGISTRY[mId].displayName.toLowerCase().trim());
                }
            }

            for (const key of keysToRegister) {
                if (!index.has(key)) index.set(key, []);
                index.get(key)!.push(...segments);
            }
            totalSegments += segments.length;
        }

        mountainIndex = index;
        console.log(`✅ GeoJSON index built: ${index.size} mountain keys, ${totalSegments} trail segments`);
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
 * @param mountainName - e.g., "Mount Tagapo", "Mt. Batulao", or "sembrano". Case-insensitive.
 * @param startLat - Optional trailhead latitude for proximity filtering.
 * @param startLon - Optional trailhead longitude for proximity filtering.
 */
export async function getStatsForMountain(
    mountainName: string,
    startLat?: number,
    startLon?: number
): Promise<ITrailStats | null> {
    const safeName = (mountainName || "").toLowerCase().trim();
    const coordKey = (typeof startLat === "number" && typeof startLon === "number")
        ? `_${startLat.toFixed(4)}_${startLon.toFixed(4)}`
        : "";
    const key = safeName + coordKey;

    if (statsCache.has(key)) return statsCache.get(key)!;

    // 1. Check if this matches one of the 5 modular offline mountains first
    const modularId =
        resolveMountainId(mountainName) ||
        resolveMountainIdByCoords(startLat, startLon);

    if (modularId) {
        try {
            const uri = await getOrDownloadTrailGeoJson(modularId);
            const geojson = (await readGeoJsonFromUri(uri)) as GeoJSONCollection;

            if (geojson?.features?.length > 0) {
                let selectedFeature = geojson.features[0];

                // Convert raw GeoJSON [lon, lat, elev] coordinates into ICoordinate[] before proximity check
                if (typeof startLat === "number" && typeof startLon === "number" && geojson.features.length > 1) {
                    const nearFeatures = geojson.features.filter((f) => {
                        const segs = extractSegments(f.geometry);
                        return segs.some((seg) =>
                            segmentNearPoint(seg, startLat, startLon, TRAILHEAD_RADIUS_M)
                        );
                    });
                    if (nearFeatures.length > 0) {
                        selectedFeature = nearFeatures[0];
                    }
                }

                const props = selectedFeature.properties || {};
                let stats: ITrailStats;

                if (
                    typeof props.total_distance_m === "number" &&
                    typeof props.elevation_gain_m === "number"
                ) {
                    stats = {
                        distance: props.total_distance_m,
                        elevationGain: props.elevation_gain_m,
                        elevationLoss: props.elevation_loss_m ?? 0,
                    };
                } else {
                    const extracted = extractSegments(selectedFeature.geometry);
                    let dist = 0;
                    let gain = 0;
                    let loss = 0;
                    for (const seg of extracted) {
                        const s = computeTotalLength(seg);
                        dist += s.distance;
                        gain += s.elevationGain;
                        loss += s.elevationLoss;
                    }
                    stats = {
                        distance: dist,
                        elevationGain: gain,
                        elevationLoss: loss,
                    };
                }

                statsCache.set(key, stats);
                console.log(
                    `📊 [Modular:${modularId}] "${mountainName}": ${(stats.distance / 1000).toFixed(1)}km, +${stats.elevationGain.toFixed(0)}m, -${stats.elevationLoss.toFixed(0)}m`
                );
                return stats;
            }
        } catch (err) {
            console.warn(`⚠️ Modular trail lookup failed for "${mountainName}", falling back:`, err);
        }
    }

    // 2. Fallback to combined index
    await ensureIndex();
    if (!mountainIndex) return null;

    const allSegments = mountainIndex.get(safeName);
    if (!allSegments || allSegments.length === 0) {
        console.warn(`⚠️ No trail data found for: "${mountainName}"`);
        return null;
    }

    let segments = allSegments;
    if (typeof startLat === "number" && typeof startLon === "number") {
        segments = allSegments.filter(seg =>
            segmentNearPoint(seg, startLat, startLon, TRAILHEAD_RADIUS_M)
        );
        console.log(`🎯 Proximity filter: ${segments.length}/${allSegments.length} segments within ${TRAILHEAD_RADIUS_M}m of trailhead`);
    }

    if (segments.length === 0) {
        console.warn(`⚠️ No segments near trailhead for: "${mountainName}"`);
        return null;
    }

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
