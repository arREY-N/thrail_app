import { Trail, useTrailStore } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    buildTrailProfiles,
    resolveCircularityFeatures,
    resolveProvinceFeatures,
    resolveTerrainFeatures,
    resolveWaterformsFeatures,
} from "@/src/recommendation/utilities/NormalizeTrails";

/**
 * Resolves trail documents by their name from the TrailStore.
 */
export const ResolveTrails = async (locations: string[]): Promise<Trail[]> => {
    const resolvedTrails: Trail[] = [];

    for (const location of locations) {
        if (!location || typeof location !== "string") continue;
        const trail = await useTrailStore.getState().fetchTrailByName(location);
        if (trail && trail.id) {
            resolvedTrails.push(trail);
        }
    }

    return resolvedTrails;
};

/**
 * Computes the centroid (mean feature vector) across a batch of trail profiles.
 */
export const BatchTrailProfile = (profiles: Profile[]): Profile['features'] | null => {
    const count = profiles.length;
    if (count === 0) return null;

    const sums = profiles.reduce(
        (acc, curr) => {
            const f = curr.features;

            acc.classification += f.classification;
            acc.length += f.length;
            acc.elevation += f.elevation;
            acc.gain += f.gain;
            acc.easy += f.easy;
            acc.slope += f.slope;

            acc.province.cavite += f.province.cavite;
            acc.province.laguna += f.province.laguna;
            acc.province.batangas += f.province.batangas;
            acc.province.rizal += f.province.rizal;
            acc.province.quezon += f.province.quezon;

            acc.terrain.muddy += f.terrain.muddy;
            acc.terrain.rocky += f.terrain.rocky;
            acc.terrain.grassland += f.terrain.grassland;
            acc.terrain.ridges += f.terrain.ridges;

            acc.circularity.out_and_back += f.circularity.out_and_back;
            acc.circularity.traverse += f.circularity.traverse;
            acc.circularity.circular += f.circularity.circular;

            if (f.waterforms.fall !== null) {
                acc.waterforms.fall.sum += f.waterforms.fall;
                acc.waterforms.fall.count += 1;
            }
            if (f.waterforms.river !== null) {
                acc.waterforms.river.sum += f.waterforms.river;
                acc.waterforms.river.count += 1;
            }
            if (f.waterforms.lake !== null) {
                acc.waterforms.lake.sum += f.waterforms.lake;
                acc.waterforms.lake.count += 1;
            }

            if (f.tourism) {
                const tourismKeys = [
                    "shelter", "resting", "information_board", "clean_water",
                    "river", "lake", "waterfall", "monument", "community",
                    "viewpoint", "network_connection"
                ] as const;

                for (const key of tourismKeys) {
                    const val = f.tourism[key];
                    if (val !== null && val !== undefined) {
                        acc.tourism[key].sum += val;
                        acc.tourism[key].count += 1;
                    }
                }
            }

            return acc;
        },
        {
            classification: 0,
            length: 0,
            elevation: 0,
            gain: 0,
            easy: 0,
            slope: 0,
            province: { cavite: 0, laguna: 0, batangas: 0, rizal: 0, quezon: 0 },
            terrain: { muddy: 0, rocky: 0, grassland: 0, ridges: 0 },
            circularity: { out_and_back: 0, traverse: 0, circular: 0 },
            waterforms: {
                fall: { sum: 0, count: 0 },
                river: { sum: 0, count: 0 },
                lake: { sum: 0, count: 0 },
            },
            tourism: {
                shelter: { sum: 0, count: 0 },
                resting: { sum: 0, count: 0 },
                information_board: { sum: 0, count: 0 },
                clean_water: { sum: 0, count: 0 },
                river: { sum: 0, count: 0 },
                lake: { sum: 0, count: 0 },
                waterfall: { sum: 0, count: 0 },
                monument: { sum: 0, count: 0 },
                community: { sum: 0, count: 0 },
                viewpoint: { sum: 0, count: 0 },
                network_connection: { sum: 0, count: 0 },
            },
        }
    );

    const calcAvg = (entry: { sum: number; count: number }): number | null =>
        entry.count > 0 ? entry.sum / entry.count : null;

    return {
        classification: sums.classification / count,
        length: sums.length / count,
        elevation: sums.elevation / count,
        gain: sums.gain / count,
        easy: sums.easy / count,
        slope: sums.slope / count,
        province: {
            cavite: sums.province.cavite / count,
            laguna: sums.province.laguna / count,
            batangas: sums.province.batangas / count,
            rizal: sums.province.rizal / count,
            quezon: sums.province.quezon / count,
        },
        terrain: {
            muddy: sums.terrain.muddy / count,
            rocky: sums.terrain.rocky / count,
            grassland: sums.terrain.grassland / count,
            ridges: sums.terrain.ridges / count,
        },
        circularity: {
            out_and_back: sums.circularity.out_and_back / count,
            traverse: sums.circularity.traverse / count,
            circular: sums.circularity.circular / count,
        },
        waterforms: {
            fall: calcAvg(sums.waterforms.fall),
            river: calcAvg(sums.waterforms.river),
            lake: calcAvg(sums.waterforms.lake),
        },
        tourism: {
            shelter: calcAvg(sums.tourism.shelter),
            resting: calcAvg(sums.tourism.resting),
            information_board: calcAvg(sums.tourism.information_board),
            clean_water: calcAvg(sums.tourism.clean_water),
            river: calcAvg(sums.tourism.river),
            lake: calcAvg(sums.tourism.lake),
            waterfall: calcAvg(sums.tourism.waterfall),
            monument: calcAvg(sums.tourism.monument),
            community: calcAvg(sums.tourism.community),
            viewpoint: calcAvg(sums.tourism.viewpoint),
            network_connection: calcAvg(sums.tourism.network_connection),
        },
    };
};

/**
 * Creates twin user profiles (easy and difficult) for a beginner hiker with no logged history.
 * Leverages user province preferences and conservative default baseline weights.
 */
export const CreateBeginnerProfile = (user: User): UserProfiles => {
    const easyBase = 3 / 5; // 0.6
    const difficultBase = Math.min(1, easyBase * 1.3); // 0.78
    const provinces = user.preferences?.province || [];

    const easyProvince = resolveProvinceFeatures(provinces);
    const difficultProvince = resolveProvinceFeatures(provinces);

    // Give higher preference weight (0.7) to preferred provinces, baseline (0.3) to others
    const calcProvWeight = (isSelected: number, baseWeight: number, altWeight: number) =>
        isSelected ? baseWeight : altWeight;

    const easyProfile: Profile = {
        metadata: {
            type: "user",
            id: user.id,
            profile: "easy",
        },
        features: {
            classification: 0,
            length: easyBase,
            elevation: easyBase,
            gain: easyBase,
            easy: easyBase,
            slope: easyBase,
            province: {
                cavite: calcProvWeight(easyProvince.cavite, 0.7, 0.3),
                laguna: calcProvWeight(easyProvince.laguna, 0.7, 0.3),
                batangas: calcProvWeight(easyProvince.batangas, 0.7, 0.3),
                rizal: calcProvWeight(easyProvince.rizal, 0.7, 0.3),
                quezon: calcProvWeight(easyProvince.quezon, 0.7, 0.3),
            },
            terrain: {
                muddy: easyBase,
                rocky: easyBase,
                grassland: easyBase,
                ridges: easyBase,
            },
            circularity: {
                out_and_back: easyBase,
                traverse: easyBase,
                circular: easyBase,
            },
            waterforms: {
                fall: easyBase,
                river: easyBase,
                lake: easyBase,
            },
            tourism: {
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
            },
        },
    };

    const difficultProfile: Profile = {
        metadata: {
            type: "user",
            id: user.id,
            profile: "difficult",
        },
        features: {
            classification: 1,
            length: difficultBase,
            elevation: difficultBase,
            gain: difficultBase,
            easy: difficultBase,
            slope: difficultBase,
            province: {
                cavite: calcProvWeight(difficultProvince.cavite, 0.7, 0.3),
                laguna: calcProvWeight(difficultProvince.laguna, 0.7, 0.3),
                batangas: calcProvWeight(difficultProvince.batangas, 0.7, 0.3),
                rizal: calcProvWeight(difficultProvince.rizal, 0.7, 0.3),
                quezon: calcProvWeight(difficultProvince.quezon, 0.7, 0.3),
            },
            terrain: {
                muddy: difficultBase,
                rocky: difficultBase,
                grassland: difficultBase,
                ridges: difficultBase,
            },
            circularity: {
                out_and_back: difficultBase,
                traverse: difficultBase,
                circular: difficultBase,
            },
            waterforms: {
                fall: difficultBase,
                river: difficultBase,
                lake: difficultBase,
            },
            tourism: {
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
            },
        },
    };

    return {
        easy: easyProfile,
        difficult: difficultProfile,
    };
};

/**
 * Creates twin user profiles for an experienced hiker based on their past completed/selected trails.
 * Averages normalized trail vectors and scales for accessible ('easy') and challenging ('difficult') recommendations.
 */
export const CreateExperiencedProfile = (
    user: User,
    hikedTrails: Trail[],
    elevationsMap: Record<string, number> = {}
): UserProfiles => {
    if (!hikedTrails || hikedTrails.length === 0) {
        return CreateBeginnerProfile(user);
    }

    // Convert hiked trails into normalized Profile vectors [0, 1]
    const trailProfiles = buildTrailProfiles(hikedTrails, elevationsMap);
    const avgVector = BatchTrailProfile(trailProfiles);

    if (!avgVector) {
        return CreateBeginnerProfile(user);
    }

    const clamp = (val: number) => Math.max(0, Math.min(1, val));
    const scaleNullable = (val: number | null, factor: number): number | null =>
        val !== null ? clamp(val * factor) : null;

    // Scaling factors: Easy (conservative 0.8x of average), Difficult (challenging 1.25x of average)
    const easyFactor = 0.8;
    const difficultFactor = 1.25;

    const easyProfile: Profile = {
        metadata: {
            type: "user",
            id: user.id,
            profile: "easy",
        },
        features: {
            classification: clamp(avgVector.classification * easyFactor),
            length: clamp(avgVector.length * easyFactor),
            elevation: clamp(avgVector.elevation * easyFactor),
            gain: clamp(avgVector.gain * easyFactor),
            easy: clamp(avgVector.easy * easyFactor),
            slope: clamp(avgVector.slope * easyFactor),
            province: {
                cavite: clamp(avgVector.province.cavite * easyFactor),
                laguna: clamp(avgVector.province.laguna * easyFactor),
                batangas: clamp(avgVector.province.batangas * easyFactor),
                rizal: clamp(avgVector.province.rizal * easyFactor),
                quezon: clamp(avgVector.province.quezon * easyFactor),
            },
            terrain: {
                muddy: clamp(avgVector.terrain.muddy * easyFactor),
                rocky: clamp(avgVector.terrain.rocky * easyFactor),
                grassland: clamp(avgVector.terrain.grassland * easyFactor),
                ridges: clamp(avgVector.terrain.ridges * easyFactor),
            },
            circularity: {
                out_and_back: clamp(avgVector.circularity.out_and_back * easyFactor),
                traverse: clamp(avgVector.circularity.traverse * easyFactor),
                circular: clamp(avgVector.circularity.circular * easyFactor),
            },
            waterforms: {
                fall: scaleNullable(avgVector.waterforms.fall, easyFactor),
                river: scaleNullable(avgVector.waterforms.river, easyFactor),
                lake: scaleNullable(avgVector.waterforms.lake, easyFactor),
            },
            tourism: {
                shelter: scaleNullable(avgVector.tourism.shelter, easyFactor),
                resting: scaleNullable(avgVector.tourism.resting, easyFactor),
                information_board: scaleNullable(avgVector.tourism.information_board, easyFactor),
                clean_water: scaleNullable(avgVector.tourism.clean_water, easyFactor),
                river: scaleNullable(avgVector.tourism.river, easyFactor),
                lake: scaleNullable(avgVector.tourism.lake, easyFactor),
                waterfall: scaleNullable(avgVector.tourism.waterfall, easyFactor),
                monument: scaleNullable(avgVector.tourism.monument, easyFactor),
                community: scaleNullable(avgVector.tourism.community, easyFactor),
                viewpoint: scaleNullable(avgVector.tourism.viewpoint, easyFactor),
                network_connection: scaleNullable(avgVector.tourism.network_connection, easyFactor),
            },
        },
    };

    const difficultProfile: Profile = {
        metadata: {
            type: "user",
            id: user.id,
            profile: "difficult",
        },
        features: {
            classification: clamp(avgVector.classification * difficultFactor),
            length: clamp(avgVector.length * difficultFactor),
            elevation: clamp(avgVector.elevation * difficultFactor),
            gain: clamp(avgVector.gain * difficultFactor),
            easy: clamp(avgVector.easy * difficultFactor),
            slope: clamp(avgVector.slope * difficultFactor),
            province: {
                cavite: clamp(avgVector.province.cavite * difficultFactor),
                laguna: clamp(avgVector.province.laguna * difficultFactor),
                batangas: clamp(avgVector.province.batangas * difficultFactor),
                rizal: clamp(avgVector.province.rizal * difficultFactor),
                quezon: clamp(avgVector.province.quezon * difficultFactor),
            },
            terrain: {
                muddy: clamp(avgVector.terrain.muddy * difficultFactor),
                rocky: clamp(avgVector.terrain.rocky * difficultFactor),
                grassland: clamp(avgVector.terrain.grassland * difficultFactor),
                ridges: clamp(avgVector.terrain.ridges * difficultFactor),
            },
            circularity: {
                out_and_back: clamp(avgVector.circularity.out_and_back * difficultFactor),
                traverse: clamp(avgVector.circularity.traverse * difficultFactor),
                circular: clamp(avgVector.circularity.circular * difficultFactor),
            },
            waterforms: {
                fall: scaleNullable(avgVector.waterforms.fall, difficultFactor),
                river: scaleNullable(avgVector.waterforms.river, difficultFactor),
                lake: scaleNullable(avgVector.waterforms.lake, difficultFactor),
            },
            tourism: {
                shelter: scaleNullable(avgVector.tourism.shelter, difficultFactor),
                resting: scaleNullable(avgVector.tourism.resting, difficultFactor),
                information_board: scaleNullable(avgVector.tourism.information_board, difficultFactor),
                clean_water: scaleNullable(avgVector.tourism.clean_water, difficultFactor),
                river: scaleNullable(avgVector.tourism.river, difficultFactor),
                lake: scaleNullable(avgVector.tourism.lake, difficultFactor),
                waterfall: scaleNullable(avgVector.tourism.waterfall, difficultFactor),
                monument: scaleNullable(avgVector.tourism.monument, difficultFactor),
                community: scaleNullable(avgVector.tourism.community, difficultFactor),
                viewpoint: scaleNullable(avgVector.tourism.viewpoint, difficultFactor),
                network_connection: scaleNullable(avgVector.tourism.network_connection, difficultFactor),
            },
        },
    };

    return {
        easy: easyProfile,
        difficult: difficultProfile,
    };
};

/**
 * High-level UserProfile generator.
 * Automatically branches between beginner (no hike history) and experienced profiles.
 */
export const GenerateUserProfile = (
    user: User,
    trails?: Trail[],
    elevationsMap: Record<string, number> = {}
): UserProfiles => {
    if (!user.preferences?.hiked || !trails || trails.length === 0) {
        return CreateBeginnerProfile(user);
    }

    return CreateExperiencedProfile(user, trails, elevationsMap);
};