import { Trail, useTrailStore } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import {
    BEGINNER_DIFFICULT_BASE,
    BEGINNER_EASY_BASE,
    EXPERIENCED_DIFFICULT_FACTOR,
    EXPERIENCED_EASY_FACTOR,
    MEDICAL_CONDITION_FACTOR,
    PROVINCE_PREFERRED_WEIGHT,
    PROVINCE_UNSELECTED_WEIGHT,
    TOURISM_DIFFICULT_BASE,
    TOURISM_EASY_BASE
} from "@/src/recommendation/constants/RecommendationFactors";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    buildTrailProfiles,
    resolveProvinceFeatures
} from "@/src/recommendation/utilities/NormalizeTrails";

// Re-export for backwards compatibility
export { MEDICAL_CONDITION_FACTOR };

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
 * Resolves user-selected survey trail locations against available trail documents in the database.
 * Matches case-insensitively against trail ID, trail name, or trail general location.
 */
export const MatchSurveyTrails = (
    surveyLocations: string[] = [],
    availableTrails: Trail[] = []
): Trail[] => {
    if (!surveyLocations || surveyLocations.length === 0 || !availableTrails || availableTrails.length === 0) {
        return [];
    }

    const matchedMap = new Map<string, Trail>();

    for (const rawLoc of surveyLocations) {
        if (!rawLoc || typeof rawLoc !== "string") continue;
        const query = rawLoc.trim().toLowerCase();
        if (!query) continue;

        for (const trail of availableTrails) {
            if (!trail) continue;
            const tId = trail.id?.trim().toLowerCase() || "";
            const tName = trail.general?.name?.trim().toLowerCase() || "";
            const tAddress = trail.general?.address?.trim().toLowerCase() || "";
            const tMountains = trail.general?.mountain?.map((m) => m.trim().toLowerCase()) || [];

            if (
                tId === query ||
                tName === query ||
                tAddress === query ||
                tMountains.includes(query) ||
                (query.length >= 3 && tName.includes(query)) ||
                (tName.length >= 3 && query.includes(tName)) ||
                (query.length >= 3 && tAddress.includes(query)) ||
                tMountains.some((m) => m.length >= 3 && (m.includes(query) || query.includes(m)))
            ) {
                matchedMap.set(trail.id, trail);
            }
        }
    }

    return Array.from(matchedMap.values());
};

/**
 * Checks if a user has answered that they have any medical conditions.
 */
export const HasMedicalCondition = (user: User): boolean => {
    if (!user.medicalProfile) return false;
    if (user.medicalProfile.hasCondition === true) return true;
    if (Array.isArray(user.medicalProfile.details) && user.medicalProfile.details.length > 0) return true;
    if (typeof user.medicalProfile.details === "string" && (user.medicalProfile.details as string).trim().length > 0) return true;
    return false;
};


/**
 * Creates twin user profiles (easy and difficult) for a beginner hiker with no survey trail history.
 * - Easy: Low base (0.25) representing lower physical effort, high affinity (0.85) for preferred provinces.
 * - Difficult: High base (0.75) representing demanding effort, inverted affinity (0.85) for unselected provinces.
 * - Medical adjustment: If the user has any medical conditions, bases are shifted down by medicalFactor (0.80x)
 *   yielding 0.20 for easy and 0.60 for difficult.
 * - Tourism amenities: initialized to baseline scores (0.20 easy / 0.40 difficult) for vector completeness.
 */
export const CreateBeginnerProfile = (
    user: User,
    medicalFactor = MEDICAL_CONDITION_FACTOR
): UserProfiles => {
    const hasMedical = HasMedicalCondition(user);
    const appliedFactor = hasMedical ? medicalFactor : 1.0;

    const easyBase = BEGINNER_EASY_BASE * appliedFactor;
    const difficultBase = BEGINNER_DIFFICULT_BASE * appliedFactor;
    const easyTourismBase = TOURISM_EASY_BASE;
    const difficultTourismBase = TOURISM_DIFFICULT_BASE;
    const provinces = user.preferences?.province || [];

    const easyProvince = resolveProvinceFeatures(provinces);
    const difficultProvince = resolveProvinceFeatures(provinces);

    // In easy profile: preferred provinces receive preferred weight, unselected receive unselected weight
    // In difficult profile: preferred provinces are downweighted, unselected are elevated to promote exploration
    const calcEasyProvWeight = (isSelected: number) =>
        isSelected ? PROVINCE_PREFERRED_WEIGHT : PROVINCE_UNSELECTED_WEIGHT;
    const calcDiffProvWeight = (isSelected: number) =>
        isSelected ? PROVINCE_UNSELECTED_WEIGHT : PROVINCE_PREFERRED_WEIGHT;

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
                cavite: calcEasyProvWeight(easyProvince.cavite),
                laguna: calcEasyProvWeight(easyProvince.laguna),
                batangas: calcEasyProvWeight(easyProvince.batangas),
                rizal: calcEasyProvWeight(easyProvince.rizal),
                quezon: calcEasyProvWeight(easyProvince.quezon),
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
                shelter: easyTourismBase,
                resting: easyTourismBase,
                information_board: easyTourismBase,
                clean_water: easyTourismBase,
                river: easyTourismBase,
                lake: easyTourismBase,
                waterfall: easyTourismBase,
                monument: easyTourismBase,
                community: easyTourismBase,
                viewpoint: easyTourismBase,
                network_connection: easyTourismBase,
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
                cavite: calcDiffProvWeight(difficultProvince.cavite),
                laguna: calcDiffProvWeight(difficultProvince.laguna),
                batangas: calcDiffProvWeight(difficultProvince.batangas),
                rizal: calcDiffProvWeight(difficultProvince.rizal),
                quezon: calcDiffProvWeight(difficultProvince.quezon),
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
                shelter: difficultTourismBase,
                resting: difficultTourismBase,
                information_board: difficultTourismBase,
                clean_water: difficultTourismBase,
                river: difficultTourismBase,
                lake: difficultTourismBase,
                waterfall: difficultTourismBase,
                monument: difficultTourismBase,
                community: difficultTourismBase,
                viewpoint: difficultTourismBase,
                network_connection: difficultTourismBase,
            },
        },
    };

    return {
        easy: easyProfile,
        difficult: difficultProfile,
    };
};

/**
 * Creates twin user profiles for an experienced hiker based on their survey-selected trails.
 * Averages normalized trail vectors and applies a 0.50x factor for a conservatively easy profile
 * and a 1.35x factor for a challenging difficult profile.
 */
export const CreateExperiencedProfile = (
    user: User,
    matchedTrails: Trail[],
    elevationsMap: Record<string, number> = {},
    trailProfileMap?: Map<string, Profile> | Record<string, Profile>,
    medicalFactor = MEDICAL_CONDITION_FACTOR
): UserProfiles => {
    if (!matchedTrails || matchedTrails.length === 0) {
        return CreateBeginnerProfile(user, medicalFactor);
    }

    // Convert matched trails into normalized Profile vectors [0, 1]
    const trailProfiles: Profile[] = [];
    const missingTrails: Trail[] = [];

    for (const t of matchedTrails) {
        let p: Profile | undefined;
        if (trailProfileMap instanceof Map) {
            p = trailProfileMap.get(t.id);
        } else if (trailProfileMap && typeof trailProfileMap === "object") {
            p = trailProfileMap[t.id];
        }
        if (!p && t.profile) {
            p = t.profile;
        }

        if (p) {
            trailProfiles.push(p);
        } else {
            missingTrails.push(t);
        }
    }

    if (missingTrails.length > 0) {
        const computed = buildTrailProfiles(missingTrails, elevationsMap);
        trailProfiles.push(...computed);
    }

    const avgVector = BatchTrailProfile(trailProfiles);

    if (!avgVector) {
        return CreateBeginnerProfile(user, medicalFactor);
    }

    const clamp = (val: number) => Math.max(0, Math.min(1, val));
    const scaleNullable = (val: number | null, factor: number, defaultVal: number): number =>
        val !== null ? clamp(val * factor) : defaultVal;

    const hasMedical = HasMedicalCondition(user);
    const appliedFactor = hasMedical ? medicalFactor : 1.0;

    const easyBase = BEGINNER_EASY_BASE * appliedFactor;
    const difficultBase = BEGINNER_DIFFICULT_BASE * appliedFactor;
    const easyTourismBase = TOURISM_EASY_BASE;
    const difficultTourismBase = TOURISM_DIFFICULT_BASE;

    // Scaling factors for observed physical/terrain metrics:
    // If user has any medical condition, appliedFactor (0.80x) downshifts both factors
    const easyFactor = EXPERIENCED_EASY_FACTOR * appliedFactor;
    const difficultFactor = EXPERIENCED_DIFFICULT_FACTOR * appliedFactor;

    const userProvinces = resolveProvinceFeatures(user.preferences?.province || []);

    // Helper: calculate province weight for experienced user
    // If observed in hiking history (> 0): preserve empirical historical affinity
    // If unobserved (=== 0): soften using stated survey preference prior
    const calcExperiencedProvince = (pKey: keyof Profile['features']['province'], isDifficult: boolean) => {
        const histVal = avgVector.province[pKey];
        if (histVal > 0) {
            return clamp(histVal);
        }
        const isPref = userProvinces[pKey] > 0;
        if (isDifficult) {
            return isPref ? PROVINCE_UNSELECTED_WEIGHT : PROVINCE_PREFERRED_WEIGHT;
        }
        return isPref ? PROVINCE_PREFERRED_WEIGHT : PROVINCE_UNSELECTED_WEIGHT;
    };

    // Helper: calculate terrain weight for experienced user
    // If observed in hiking history (> 0): scale by anchor factor
    // If unobserved (=== 0): soften to beginner baseline prior (easyBase / difficultBase)
    const calcExperiencedTerrain = (tKey: keyof Profile['features']['terrain'], isDifficult: boolean) => {
        const histVal = avgVector.terrain[tKey];
        if (histVal > 0) {
            const factor = isDifficult ? difficultFactor : easyFactor;
            return clamp(histVal * factor);
        }
        return isDifficult ? difficultBase : easyBase;
    };

    // Helper: calculate circularity weight for experienced user
    const calcExperiencedCircularity = (cKey: keyof Profile['features']['circularity'], isDifficult: boolean) => {
        const histVal = avgVector.circularity[cKey];
        if (histVal > 0) {
            const factor = isDifficult ? difficultFactor : easyFactor;
            return clamp(histVal * factor);
        }
        return isDifficult ? difficultBase : easyBase;
    };

    // Helper: calculate waterforms weight for experienced user
    const calcExperiencedWaterforms = (wKey: keyof Profile['features']['waterforms'], isDifficult: boolean) => {
        const histVal = avgVector.waterforms[wKey];
        if (histVal !== null && histVal > 0) {
            const factor = isDifficult ? difficultFactor : easyFactor;
            return clamp(histVal * factor);
        }
        return isDifficult ? difficultBase : easyBase;
    };

    // Helper: calculate tourism weight for experienced user
    const calcExperiencedTourism = (tKey: keyof Profile['features']['tourism'], isDifficult: boolean) => {
        const histVal = avgVector.tourism[tKey];
        if (histVal !== null && histVal > 0) {
            const factor = isDifficult ? difficultFactor : easyFactor;
            return clamp(histVal * factor);
        }
        return isDifficult ? difficultTourismBase : easyTourismBase;
    };

    const easyProfile: Profile = {
        metadata: {
            type: "user",
            id: user.id,
            profile: "easy",
        },
        features: {
            classification: 0,
            length: clamp(avgVector.length * easyFactor),
            elevation: clamp(avgVector.elevation * easyFactor),
            gain: clamp(avgVector.gain * easyFactor),
            easy: clamp(avgVector.easy * easyFactor),
            slope: clamp(avgVector.slope * easyFactor),
            province: {
                cavite: calcExperiencedProvince("cavite", false),
                laguna: calcExperiencedProvince("laguna", false),
                batangas: calcExperiencedProvince("batangas", false),
                rizal: calcExperiencedProvince("rizal", false),
                quezon: calcExperiencedProvince("quezon", false),
            },
            terrain: {
                muddy: calcExperiencedTerrain("muddy", false),
                rocky: calcExperiencedTerrain("rocky", false),
                grassland: calcExperiencedTerrain("grassland", false),
                ridges: calcExperiencedTerrain("ridges", false),
            },
            circularity: {
                out_and_back: calcExperiencedCircularity("out_and_back", false),
                traverse: calcExperiencedCircularity("traverse", false),
                circular: calcExperiencedCircularity("circular", false),
            },
            waterforms: {
                fall: calcExperiencedWaterforms("fall", false),
                river: calcExperiencedWaterforms("river", false),
                lake: calcExperiencedWaterforms("lake", false),
            },
            tourism: {
                shelter: calcExperiencedTourism("shelter", false),
                resting: calcExperiencedTourism("resting", false),
                information_board: calcExperiencedTourism("information_board", false),
                clean_water: calcExperiencedTourism("clean_water", false),
                river: calcExperiencedTourism("river", false),
                lake: calcExperiencedTourism("lake", false),
                waterfall: calcExperiencedTourism("waterfall", false),
                monument: calcExperiencedTourism("monument", false),
                community: calcExperiencedTourism("community", false),
                viewpoint: calcExperiencedTourism("viewpoint", false),
                network_connection: calcExperiencedTourism("network_connection", false),
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
            length: clamp(avgVector.length * difficultFactor),
            elevation: clamp(avgVector.elevation * difficultFactor),
            gain: clamp(avgVector.gain * difficultFactor),
            easy: clamp(avgVector.easy * difficultFactor),
            slope: clamp(avgVector.slope * difficultFactor),
            province: {
                cavite: calcExperiencedProvince("cavite", true),
                laguna: calcExperiencedProvince("laguna", true),
                batangas: calcExperiencedProvince("batangas", true),
                rizal: calcExperiencedProvince("rizal", true),
                quezon: calcExperiencedProvince("quezon", true),
            },
            terrain: {
                muddy: calcExperiencedTerrain("muddy", true),
                rocky: calcExperiencedTerrain("rocky", true),
                grassland: calcExperiencedTerrain("grassland", true),
                ridges: calcExperiencedTerrain("ridges", true),
            },
            circularity: {
                out_and_back: calcExperiencedCircularity("out_and_back", true),
                traverse: calcExperiencedCircularity("traverse", true),
                circular: calcExperiencedCircularity("circular", true),
            },
            waterforms: {
                fall: calcExperiencedWaterforms("fall", true),
                river: calcExperiencedWaterforms("river", true),
                lake: calcExperiencedWaterforms("lake", true),
            },
            tourism: {
                shelter: calcExperiencedTourism("shelter", true),
                resting: calcExperiencedTourism("resting", true),
                information_board: calcExperiencedTourism("information_board", true),
                clean_water: calcExperiencedTourism("clean_water", true),
                river: calcExperiencedTourism("river", true),
                lake: calcExperiencedTourism("lake", true),
                waterfall: calcExperiencedTourism("waterfall", true),
                monument: calcExperiencedTourism("monument", true),
                community: calcExperiencedTourism("community", true),
                viewpoint: calcExperiencedTourism("viewpoint", true),
                network_connection: calcExperiencedTourism("network_connection", true),
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
 * Checks user survey preferences (user.preferences.location).
 * If matching trails exist in the trail database, creates experienced profiles using
 * centroid scaling (0.50x easy, 1.35x difficult). Otherwise, falls back to beginner profile.
 */
export const GenerateUserProfile = (
    user: User,
    trails?: Trail[],
    elevationsMap: Record<string, number> = {},
    trailProfileMap?: Map<string, Profile> | Record<string, Profile>,
    medicalFactor = MEDICAL_CONDITION_FACTOR
): UserProfiles => {
    const surveyLocations = user.preferences?.location || [];

    if (trails && trails.length > 0 && surveyLocations.length > 0) {
        const matched = MatchSurveyTrails(surveyLocations, trails);
        if (matched.length > 0) {
            return CreateExperiencedProfile(user, matched, elevationsMap, trailProfileMap, medicalFactor);
        }
    }

    return CreateBeginnerProfile(user, medicalFactor);
};