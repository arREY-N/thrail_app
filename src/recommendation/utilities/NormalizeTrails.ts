import { Trail } from "@/src/core/models/Trail/Trail";
import { Profile } from "@/src/recommendation/interfaces/Profile";
import { calculateTrailGain } from "@/src/recommendation/utilities/GetElevation";

export const TERRAIN_MAPPING: Record<string, Partial<Profile['features']['terrain']>> = {
    'Dusty when dry, muddy when wet': { muddy: 0.5 },
    'Rocky trail': { rocky: 1 },
    'Grassland and ridges': { grassland: 1, ridges: 1 },
    'Open ridges and rocky terrains': { ridges: 1, rocky: 1 },
    'Dense jungle trails': { muddy: 0.3 },
};

/**
 * Resolves terrain features from quality and difficulty points.
 * Retains multi-attribute matching where multiple qualities can contribute to features.
 */
export const resolveTerrainFeatures = (qualities: string[] = []): Profile['features']['terrain'] => {
    const terrain: Profile['features']['terrain'] = {
        muddy: 0,
        rocky: 0,
        grassland: 0,
        ridges: 0,
    };

    for (const q of qualities) {
        const match = TERRAIN_MAPPING[q];
        if (match) {
            if (match.muddy !== undefined) terrain.muddy = Math.max(terrain.muddy, match.muddy);
            if (match.rocky !== undefined) terrain.rocky = Math.max(terrain.rocky, match.rocky);
            if (match.grassland !== undefined) terrain.grassland = Math.max(terrain.grassland, match.grassland);
            if (match.ridges !== undefined) terrain.ridges = Math.max(terrain.ridges, match.ridges);
        }
    }

    return terrain;
};

/**
 * Safely resolves province presence in a case-insensitive, whitespace-trimmed manner.
 */
export const resolveProvinceFeatures = (provinces: string[] = []): Profile['features']['province'] => {
    const list = Array.isArray(provinces) ? provinces : [];
    const has = (name: string): number =>
        list.some((p) => typeof p === "string" && p.trim().toLowerCase().includes(name.toLowerCase())) ? 1 : 0;

    return {
        cavite: has("cavite"),
        laguna: has("laguna"),
        batangas: has("batangas"),
        rizal: has("rizal"),
        quezon: has("quezon"),
    };
};

/**
 * Resolves circularity into a binary multi-hot vector.
 */
export const resolveCircularityFeatures = (circ?: string): Profile['features']['circularity'] => {
    const val = (circ || "").trim().toLowerCase();
    return {
        out_and_back: val.includes("out") ? 1 : 0,
        traverse: val.includes("traverse") ? 1 : 0,
        circular: val.includes("circular") || val.includes("loop") ? 1 : 0,
    };
};

/**
 * Safely resolves nullable boolean indicator into 1, 0, or null.
 * Strictly preserves null values without falling back to 0 or 1.
 */
export const resolveNullableBoolean = (val: unknown): number | null => {
    if (val === true) return 1;
    if (val === false) return 0;
    return null;
};

/**
 * Safely resolves viewpoint indicators into 1, 0, or null.
 */
export const resolveNullableViewpoint = (val: unknown): number | null => {
    if (val === null || val === undefined) return null;
    if (Array.isArray(val)) return val.length > 0 ? 1 : 0;
    if (val === true) return 1;
    if (val === false) return 0;
    return null;
};

/**
 * Resolves tourism amenities features from ITourism with explicit null handling.
 */
export const resolveTourismFeatures = (tourism?: Trail['tourism']): Profile['features']['tourism'] => {
    if (!tourism) {
        return {
            shelter: null,
            resting: null,
            information_board: null,
            clean_water: null,
            river: null,
            lake: null,
            waterfall: null,
            monument: null,
            community: null,
            viewpoint: null,
            network_connection: null,
        };
    }

    return {
        shelter: resolveNullableBoolean(tourism.shelter),
        resting: resolveNullableBoolean(tourism.resting),
        information_board: resolveNullableBoolean(tourism.information_board),
        clean_water: resolveNullableBoolean(tourism.clean_water),
        river: resolveNullableBoolean(tourism.river),
        lake: resolveNullableBoolean(tourism.lake),
        waterfall: resolveNullableBoolean(tourism.waterfall),
        monument: resolveNullableBoolean(tourism.monument),
        community: resolveNullableBoolean(tourism.community),
        viewpoint: resolveNullableViewpoint(tourism.viewpoint),
        network_connection: resolveNullableBoolean(tourism.network_connection),
    };
};

/**
 * Resolves waterforms from tourism amenities with explicit null handling.
 */
export const resolveWaterformsFeatures = (tourism?: Trail['tourism']): Profile['features']['waterforms'] => {
    return {
        fall: resolveNullableBoolean(tourism?.waterfall),
        river: resolveNullableBoolean(tourism?.river),
        lake: resolveNullableBoolean(tourism?.lake),
    };
};

export interface MetricBounds {
    min: number;
    max: number;
}

export interface DatasetBounds {
    length: MetricBounds;
    elevation: MetricBounds;
    gain: MetricBounds;
    slope: MetricBounds;
}

/**
 * Computes dataset-wide min and max bounds for raw metrics.
 */
export const calculateDatasetBounds = (
    trails: Trail[],
    elevationsMap: Record<string, number> = {}
): DatasetBounds => {
    return trails.reduce(
        (acc, t) => {
            const length = t.difficulty?.length ?? 0;
            const elevation = t.geography?.masl || t.difficulty?.elevation || 0;
            const gain = calculateTrailGain(t, elevationsMap[t.id]);
            const slope = t.difficulty?.slope ?? 0;

            acc.length.min = Math.min(acc.length.min, length);
            acc.length.max = Math.max(acc.length.max, length);

            acc.elevation.min = Math.min(acc.elevation.min, elevation);
            acc.elevation.max = Math.max(acc.elevation.max, elevation);

            acc.gain.min = Math.min(acc.gain.min, gain);
            acc.gain.max = Math.max(acc.gain.max, gain);

            acc.slope.min = Math.min(acc.slope.min, slope);
            acc.slope.max = Math.max(acc.slope.max, slope);

            return acc;
        },
        {
            length: { min: Infinity, max: -Infinity },
            elevation: { min: Infinity, max: -Infinity },
            gain: { min: Infinity, max: -Infinity },
            slope: { min: Infinity, max: -Infinity },
        }
    );
};

const minMaxNormalize = (val: number, bounds: MetricBounds): number => {
    if (!isFinite(bounds.min) || !isFinite(bounds.max) || bounds.max === bounds.min) {
        return 0;
    }
    const normalized = (val - bounds.min) / (bounds.max - bounds.min);
    return Math.max(0, Math.min(1, normalized));
};

/**
 * Transforms a single Trail document into a normalized Profile vector.
 */
export const transformTrailToProfile = (
    trail: Trail,
    bounds: DatasetBounds,
    startElevation?: number
): Profile => {
    const rawLength = trail.difficulty?.length ?? 0;
    const rawElevation = trail.geography?.masl || trail.difficulty?.elevation || 0;
    const rawGain = calculateTrailGain(trail, startElevation);
    const rawSlope = trail.difficulty?.slope ?? 0;

    const qualities = [
        ...(trail.difficulty?.quality || []),
        ...(trail.difficulty?.difficulty_points || []),
    ];

    return {
        metadata: {
            type: "trail",
            id: trail.id,
        },
        features: {
            classification: trail.difficulty?.classification?.toLowerCase() === "major" ? 1 : 0,
            length: minMaxNormalize(rawLength, bounds.length),
            elevation: minMaxNormalize(rawElevation, bounds.elevation),
            gain: minMaxNormalize(rawGain, bounds.gain),
            slope: minMaxNormalize(rawSlope, bounds.slope),
            easy: Math.max(0, Math.min(1, (trail.difficulty?.lascoRating ?? 0) / 9)),
            province: resolveProvinceFeatures(trail.general?.province),
            terrain: resolveTerrainFeatures(qualities),
            circularity: resolveCircularityFeatures(trail.difficulty?.circularity),
            waterforms: resolveWaterformsFeatures(trail.tourism),
            tourism: resolveTourismFeatures(trail.tourism),
        },
    };
};

/**
 * Builds normalized Profile vectors for all trails in the dataset.
 */
export const buildTrailProfiles = (
    trails: Trail[],
    elevationsMap: Record<string, number> = {}
): Profile[] => {
    if (trails.length === 0) return [];

    const bounds = calculateDatasetBounds(trails, elevationsMap);

    return trails.map((trail) => {
        const startElev = elevationsMap[trail.id];
        return transformTrailToProfile(trail, bounds, startElev);
    });
};

/**
 * Legacy in-place Trail model normalizer preserved for backwards compatibility.
 */
export const normalizeTrails = (
    trails: Trail[],
    elevationsMap: Record<string, number> = {}
): Trail[] => {
    if (trails.length === 0) return [];

    const bounds = calculateDatasetBounds(trails, elevationsMap);

    return trails.map((t) => {
        const rawElev = t.geography?.masl || t.difficulty?.elevation || 0;
        const rawGain = calculateTrailGain(t, elevationsMap[t.id]);

        return {
            ...t,
            difficulty: {
                ...t.difficulty,
                length: minMaxNormalize(t.difficulty?.length ?? 0, bounds.length),
                elevation: minMaxNormalize(rawElev, bounds.elevation),
                gain: minMaxNormalize(rawGain, bounds.gain),
                slope: minMaxNormalize(t.difficulty?.slope ?? 0, bounds.slope),
            },
        };
    });
};
