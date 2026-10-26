import { Platform } from "react-native";

export interface CanonicalFeatureMeta {
    key: string;
    label: string;
    category: 'Physical Exertion' | 'Provinces' | 'Terrains' | 'Route Type' | 'Waterforms' | 'Tourism Amenities';
    categoryGroupId: CategoryGroupId;
    defaultWeight: number;
    description?: string;
}

export type CategoryGroupId = 'physical' | 'terrain' | 'province' | 'route' | 'scenery_amenities';

export interface CategoryGroupMeta {
    id: CategoryGroupId;
    name: string;
    subtitle: string;
    defaultWeight: number;
    icon: string;
    badgeColor: string;
    featureKeys: string[];
}

export const CATEGORY_GROUPS: CategoryGroupMeta[] = [
    {
        id: 'physical',
        name: 'Physical Difficulty',
        subtitle: 'Classification, Length, Elevation, Gain, Slope, Lasco Rating',
        defaultWeight: 50.00,
        icon: 'activity',
        badgeColor: '#10B981',
        featureKeys: ['classification', 'length', 'elevation', 'gain', 'slope', 'easy'],
    },
    {
        id: 'terrain',
        name: 'Terrain Type',
        subtitle: 'Muddy, Rocky Scrambles, Grassland, Exposed Ridges',
        defaultWeight: 20.00,
        icon: 'layers',
        badgeColor: '#F59E0B',
        featureKeys: ['muddy', 'rocky', 'grassland', 'ridges'],
    },
    {
        id: 'route',
        name: 'Route Type',
        subtitle: 'Out-and-Back, Point-to-Point Traverse, Circular Loop',
        defaultWeight: 15.00,
        icon: 'navigation',
        badgeColor: '#8B5CF6',
        featureKeys: ['out_and_back', 'traverse', 'circular'],
    },
    {
        id: 'province',
        name: 'Location / Province',
        subtitle: 'Cavite, Laguna, Batangas, Rizal, Quezon',
        defaultWeight: 10.00,
        icon: 'map-pin',
        badgeColor: '#3B82F6',
        featureKeys: ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'],
    },
    {
        id: 'scenery_amenities',
        name: 'Scenery & Amenities',
        subtitle: 'Waterfalls, Rivers, Lakes + 11 Tourism Amenities',
        defaultWeight: 5.00,
        icon: 'sun',
        badgeColor: '#EC4899',
        featureKeys: [
            'fall', 'river', 'lake',
            'shelter', 'resting', 'clean_water', 'information_board',
            'tourism_river', 'tourism_lake', 'tourism_waterfall',
            'monument', 'community', 'viewpoint', 'network_connection'
        ],
    },
];

export const CANONICAL_FEATURE_CONFIG: CanonicalFeatureMeta[] = [
    // 1. Core Physical Metrics (50.0% total)
    { key: "classification", label: "Trail Classification (Minor/Major)", category: "Physical Exertion", categoryGroupId: "physical", defaultWeight: 8.00, description: "Minor day-hikes vs major multi-day summits" },
    { key: "length", label: "Trail Length (km)", category: "Physical Exertion", categoryGroupId: "physical", defaultWeight: 8.40, description: "Total distance in kilometers" },
    { key: "elevation", label: "Peak Elevation (MASL)", category: "Physical Exertion", categoryGroupId: "physical", defaultWeight: 8.40, description: "Summit altitude above sea level" },
    { key: "gain", label: "Elevation Gain (m)", category: "Physical Exertion", categoryGroupId: "physical", defaultWeight: 8.40, description: "Total vertical climbing ascent" },
    { key: "slope", label: "Trail Slope / Gradient (%)", category: "Physical Exertion", categoryGroupId: "physical", defaultWeight: 8.40, description: "Incline steepness percentage" },
    { key: "easy", label: "Lasco / Easy Rating (1-9)", category: "Physical Exertion", categoryGroupId: "physical", defaultWeight: 8.40, description: "Standard PinoyMountaineer difficulty scale" },

    // 2. Terrains (20.0% total, 5.0% each) - Technical difficulty & footing
    { key: "muddy", label: "Terrain: Muddy Trails", category: "Terrains", categoryGroupId: "terrain", defaultWeight: 5.00 },
    { key: "rocky", label: "Terrain: Rocky Scrambles", category: "Terrains", categoryGroupId: "terrain", defaultWeight: 5.00 },
    { key: "grassland", label: "Terrain: Grassland / Open", category: "Terrains", categoryGroupId: "terrain", defaultWeight: 5.00 },
    { key: "ridges", label: "Terrain: Exposed Ridges", category: "Terrains", categoryGroupId: "terrain", defaultWeight: 5.00 },

    // 3. Circularity / Route (15.0% total, 5.0% each) - Physical trail trajectory > Location
    { key: "out_and_back", label: "Route: Out-and-Back", category: "Route Type", categoryGroupId: "route", defaultWeight: 5.00 },
    { key: "traverse", label: "Route: Point-to-Point Traverse", category: "Route Type", categoryGroupId: "route", defaultWeight: 5.00 },
    { key: "circular", label: "Route: Circular Loop", category: "Route Type", categoryGroupId: "route", defaultWeight: 5.00 },

    // 4. Provinces (10.0% total, 2.0% each) - Regional preference
    { key: "cavite", label: "Province: Cavite", category: "Provinces", categoryGroupId: "province", defaultWeight: 2.00 },
    { key: "laguna", label: "Province: Laguna", category: "Provinces", categoryGroupId: "province", defaultWeight: 2.00 },
    { key: "batangas", label: "Province: Batangas", category: "Provinces", categoryGroupId: "province", defaultWeight: 2.00 },
    { key: "rizal", label: "Province: Rizal", category: "Provinces", categoryGroupId: "province", defaultWeight: 2.00 },
    { key: "quezon", label: "Province: Quezon", category: "Provinces", categoryGroupId: "province", defaultWeight: 2.00 },

    // 5. Scenery & Amenities (5.0% total) - Smallest category overall
    // Waterforms (1.40% subtotal)
    { key: "fall", label: "Waterform: Waterfall", category: "Waterforms", categoryGroupId: "scenery_amenities", defaultWeight: 0.50 },
    { key: "river", label: "Waterform: River Stream", category: "Waterforms", categoryGroupId: "scenery_amenities", defaultWeight: 0.45 },
    { key: "lake", label: "Waterform: Lake", category: "Waterforms", categoryGroupId: "scenery_amenities", defaultWeight: 0.45 },

    // Tourism Amenities (3.60% subtotal)
    { key: "shelter", label: "Amenity: Shelter / Shed", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.40 },
    { key: "resting", label: "Amenity: Resting Areas", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.40 },
    { key: "clean_water", label: "Amenity: Clean Water Supply", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.40 },
    { key: "information_board", label: "Amenity: Information Board", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "tourism_river", label: "Amenity: River Access", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "tourism_lake", label: "Amenity: Lake Access", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "tourism_waterfall", label: "Amenity: Waterfall Access", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "monument", label: "Amenity: Historical Monument", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "community", label: "Amenity: Guide Station / Community", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "viewpoint", label: "Amenity: Scenic Viewpoint", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
    { key: "network_connection", label: "Amenity: Cellular Reception", category: "Tourism Amenities", categoryGroupId: "scenery_amenities", defaultWeight: 0.30 },
];

export interface TarsBatchRequest {
    cbf_engine?: 'GD' | 'ED' | 'CS' | string;
    cf_engine?: 'GD' | 'ED' | 'CS' | string;
    month_id?: string;
    commit_to_firestore?: boolean;
    feature_weights?: Record<string, number>;
}

export interface TarsBatchResponse {
    status: 'success' | 'warning' | 'error';
    month: string;
    total_users_processed: number;
    total_trails_scored: number;
    alpha: number;
    samples?: Array<{
        userId: string;
        top_easy: any[];
        top_difficult: any[];
    }>;
    message?: string;
}

export const getTarsApiBaseUrl = (): string => {
    if (process.env.EXPO_PUBLIC_THARESYS_API_URL) {
        return process.env.EXPO_PUBLIC_THARESYS_API_URL.replace(/\/+$/, '');
    }
    if (process.env.EXPO_PUBLIC_TARS_API_URL) {
        return process.env.EXPO_PUBLIC_TARS_API_URL.replace(/\/+$/, '');
    }
    // Android emulator loops back to host via 10.0.2.2; Web / iOS uses localhost
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:8000`;
};

export const getTharesysApiBaseUrl = getTarsApiBaseUrl;

export const getTarsApiKey = (): string | undefined => {
    return process.env.EXPO_PUBLIC_THARESYS_API_KEY || process.env.EXPO_PUBLIC_TARS_API_KEY || undefined;
};

/**
 * Checks if the THARESYS Python recommendation server is running and reachable.
 */
export async function checkTarsHealth(): Promise<{ healthy: boolean; message: string }> {
    const baseUrl = getTarsApiBaseUrl();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${baseUrl}/`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            return { healthy: true, message: data.service || 'THARESYS Engine is online' };
        }
        return { healthy: false, message: `Server returned HTTP ${res.status}` };
    } catch (err: any) {
        return {
            healthy: false,
            message: err.name === 'AbortError'
                ? 'Connection timed out. Ensure THARESYS server is reachable.'
                : `Cannot reach THARESYS server (${err.message || 'Network error'})`,
        };
    }
}

export const checkTharesysHealth = checkTarsHealth;

/**
 * Triggers a full recommendation batch run across all eligible users.
 */
export async function runTarsEngine(options?: TarsBatchRequest): Promise<TarsBatchResponse> {
    const baseUrl = getTarsApiBaseUrl();
    const payload = {
        cbf_engine: options?.cbf_engine || 'GD',
        cf_engine: options?.cf_engine || 'GD',
        month_id: options?.month_id || null,
        commit_to_firestore: options?.commit_to_firestore !== false,
        feature_weights: options?.feature_weights || undefined,
    };

    const controller = new AbortController();
    // 300-second (5 minutes) timeout for full batch calculation and Gemini generation
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const apiKey = getTarsApiKey();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-THARESYS-KEY': apiKey } : {}),
    };

    try {
        const res = await fetch(`${baseUrl}/api/admin/run-engine`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || `Server error (${res.status})`);
        }

        return data as TarsBatchResponse;
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('THARESYS batch execution timed out after 300 seconds.');
        }
        throw new Error(err.message || 'Failed connecting to THARESYS Recommendation API.');
    }
}

export const runTharesysEngine = runTarsEngine;
export type TharesysBatchRequest = TarsBatchRequest;
export type TharesysBatchResponse = TarsBatchResponse;

/**
 * Triggers adaptive profile update on the server engine from completed hike feedback.
 */
export async function updateUserProfileFromHikes(
    payload: {
        userId: string;
        currentEasyProfile?: any;
        currentDifficultProfile?: any;
        hikes: Array<{
            trailId: string;
            trailFeatures?: any;
            score: number;
            isMatch: boolean;
            targetAnchor: 'easy' | 'difficult';
            featureWeights?: Record<string, number> | number[];
        }>;
        featureWeights?: Record<string, number>;
        commitToFirestore?: boolean;
    }
): Promise<any> {
    const baseUrl = getTarsApiBaseUrl();
    const formattedPayload = {
        user_id: payload.userId,
        current_easy_profile: payload.currentEasyProfile,
        current_diff_profile: payload.currentDifficultProfile,
        hikes: payload.hikes.map((h) => ({
            trail_id: h.trailId,
            trail_features: h.trailFeatures,
            score: h.score,
            is_match: h.isMatch,
            target_anchor: h.targetAnchor,
            feature_weights: h.featureWeights,
        })),
        feature_weights: payload.featureWeights,
        commit_to_firestore: payload.commitToFirestore !== false,
    };

    const apiKey = getTarsApiKey();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-THARESYS-KEY': apiKey } : {}),
    };

    const res = await fetch(`${baseUrl}/api/user/update-profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedPayload),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || `Server error (${res.status}) updating profile.`);
    }

    return data;
}
