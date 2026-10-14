/**
 * @file trailMapAssets.ts
 * @description Static offline trail map image asset registry and resolver utility.
 */

import { ImageSourcePropType } from "react-native";

/**
 * Map of static offline trail map image assets.
 * Keyed by trail/mock identifier.
 */
export const trailMapAssets: Record<string, ImageSourcePropType> = {
    "mock_tagapo": require("@/src/assets/trail-maps/mt-tagapo.png"),
    "mock_marami": require("@/src/assets/trail-maps/mt-marami.png"),
    "mock_batulao": require("@/src/assets/trail-maps/mt-batulao.png"),
    "mock_makiling": require("@/src/assets/trail-maps/mt-makiling.png"),
    "mock_maculot": require("@/src/assets/trail-maps/mt-maculot.png"),
    "mock_daraitan": require("@/src/assets/trail-maps/mt-daraitan.png"),
    "mock_kulis": require("@/src/assets/trail-maps/mt-kulis.png"),
};

/**
 * Default placeholder map image to display when a trail-specific map asset cannot be resolved.
 */
export const fallbackMapAsset: ImageSourcePropType = require("@/src/assets/trail-maps/placeholder-map.png");

/**
 * Resolves the static offline map image asset for a specific trail.
 * Performs a direct key match, case-insensitive ID substring match, or 
 * trail name substring match to locate the correct asset.
 * 
 * @param trailId - The document ID of the trail.
 * @param trailName - Optional name of the trail/mountain.
 * @returns {ImageSourcePropType} Resolved static map image asset (or fallback asset if not matched).
 */
export function getStaticMapAsset(trailId: string, trailName?: string): ImageSourcePropType {
    // 1. Direct match on ID key
    if (trailId && Object.prototype.hasOwnProperty.call(trailMapAssets, trailId)) {
        return trailMapAssets[trailId];
    }

    // 2. Case-insensitive substring match on trailId (in case the document ID contains name)
    if (trailId) {
        const idLower = trailId.toLowerCase();
        if (idLower.includes("tagapo")) return trailMapAssets["mock_tagapo"];
        if (idLower.includes("marami")) return trailMapAssets["mock_marami"];
        if (idLower.includes("batulao")) return trailMapAssets["mock_batulao"];
        if (idLower.includes("makiling")) return trailMapAssets["mock_makiling"];
        if (idLower.includes("maculot")) return trailMapAssets["mock_maculot"];
        if (idLower.includes("daraitan")) return trailMapAssets["mock_daraitan"];
        if (idLower.includes("kulis")) return trailMapAssets["mock_kulis"];
    }

    // 3. Case-insensitive substring match on trail/mountain name
    if (trailName) {
        const nameLower = trailName.toLowerCase();
        if (nameLower.includes("tagapo")) return trailMapAssets["mock_tagapo"];
        if (nameLower.includes("marami")) return trailMapAssets["mock_marami"];
        if (nameLower.includes("batulao")) return trailMapAssets["mock_batulao"];
        if (nameLower.includes("makiling")) return trailMapAssets["mock_makiling"];
        if (nameLower.includes("maculot")) return trailMapAssets["mock_maculot"];
        if (nameLower.includes("daraitan")) return trailMapAssets["mock_daraitan"];
        if (nameLower.includes("kulis")) return trailMapAssets["mock_kulis"];
    }

    return fallbackMapAsset;
}
