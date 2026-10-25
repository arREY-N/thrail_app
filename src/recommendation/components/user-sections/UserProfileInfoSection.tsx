import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { RecommendationFactors } from "@/src/recommendation/constants/RecommendationFactors";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    BatchTrailProfile,
    HasMedicalCondition,
    MatchSurveyTrails,
} from "@/src/recommendation/utilities/CreateProfile";
import { calculateTrailGain } from "@/src/recommendation/utilities/GetElevation";
import {
    buildTrailProfiles,
    DatasetBounds,
} from "@/src/recommendation/utilities/NormalizeTrails";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PROVINCES = ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"] as const;
const TERRAINS = ["Muddy", "Rocky", "Grassland", "Ridges"] as const;

interface UserProfileInfoSectionProps {
    user: User;
    userProfiles: UserProfiles;
    trails: Trail[];
    startElevations: Record<string, number>;
    bounds: DatasetBounds;
    onResetToInitial?: () => void;
    isResettingProfile?: boolean;
}

export default function UserProfileInfoSection({
    user,
    userProfiles,
    trails,
    startElevations,
    bounds,
    onResetToInitial,
    isResettingProfile = false,
}: UserProfileInfoSectionProps) {
    const [expandedFeatureKey, setExpandedFeatureKey] = useState<string | null>(null);

    const surveyLocations = user.preferences?.location || [];
    const matched = MatchSurveyTrails(surveyLocations, trails);
    const hasMed = HasMedicalCondition(user);
    const isExp = matched.length > 0;

    // Calculate centroid average vector across matched survey trails
    let avgVector: Profile["features"] | null = null;
    if (isExp) {
        const matchedProfiles: Profile[] = [];
        const missingTrails: Trail[] = [];
        for (const t of matched) {
            if (t.profile) {
                matchedProfiles.push(t.profile);
            } else {
                missingTrails.push(t);
            }
        }
        if (missingTrails.length > 0) {
            matchedProfiles.push(...buildTrailProfiles(missingTrails, startElevations));
        }
        avgVector = BatchTrailProfile(matchedProfiles);
    }

    const easyFeats = userProfiles.easy.features;
    const diffFeats = userProfiles.difficult.features;

    const easyFactorStr = RecommendationFactors.EXPERIENCED.EASY_FACTOR.toFixed(2);
    const diffFactorStr = RecommendationFactors.EXPERIENCED.DIFFICULT_FACTOR.toFixed(2);
    const medFactorStr = RecommendationFactors.MEDICAL_CONDITION_FACTOR.toFixed(2);
    const begEasyStr = RecommendationFactors.BEGINNER.EASY_BASE.toFixed(3);
    const begDiffStr = RecommendationFactors.BEGINNER.DIFFICULT_BASE.toFixed(3);

    const featureItems = [
        {
            id: "classification",
            label: "Classification",
            category: "Classification",
            easyDisplay: easyFeats.classification === 1 ? "1 (Major)" : "0 (Minor)",
            diffDisplay: diffFeats.classification === 1 ? "1 (Major)" : "0 (Minor)",
            rawScore: isExp
                ? matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.classification || "minor"}`).join(", ")
                : "Beginner formulation defaults (Minor = 0, Major = 1)",
            normFormula: "Classification values: Major = 1.0, Minor = 0.0",
            easyFormula: "Fixed anchor target: 0 (Minor trails only - suitable for leisurely hikes)",
            diffFormula: "Fixed anchor target: 1 (Major trails only - demanding technical summit hikes)",
        },
        {
            id: "easy",
            label: "Lasco / Rating",
            category: "Physical Exertion",
            easyDisplay: easyFeats.easy.toFixed(3),
            diffDisplay: diffFeats.easy.toFixed(3),
            rawScore: isExp
                ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.lascoRating ?? 0}/9`).join(", ")} (Average: ${(matched.reduce((acc, t) => acc + (t.difficulty?.lascoRating ?? 0), 0) / matched.length).toFixed(2)}/9)`
                : "No survey trails. Calibrated baseline: ~2.25/9 (Easy) vs ~6.75/9 (Difficult)",
            normFormula: isExp && avgVector
                ? `lascoRating / 9 -> Average Normalized Vector: ${avgVector.easy.toFixed(3)}`
                : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
            easyFormula: isExp && avgVector
                ? `avg (${avgVector.easy.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.easy.toFixed(3)}`
                : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.easy.toFixed(3)}`,
            diffFormula: isExp && avgVector
                ? `clamp(avg (${avgVector.easy.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.easy.toFixed(3)}`
                : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.easy.toFixed(3)}`,
        },
        {
            id: "length",
            label: "Length",
            category: "Physical Exertion",
            easyDisplay: easyFeats.length.toFixed(3),
            diffDisplay: diffFeats.length.toFixed(3),
            rawScore: isExp
                ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.length ?? 0} km`).join(", ")} (Average: ${(matched.reduce((acc, t) => acc + (t.difficulty?.length ?? 0), 0) / matched.length).toFixed(2)} km)`
                : `Calibrated baseline (Dataset bounds: ${bounds.length.min.toFixed(1)} km to ${bounds.length.max.toFixed(1)} km)`,
            boundsText: `Dataset Bounds: ${bounds.length.min.toFixed(1)} km to ${bounds.length.max.toFixed(1)} km`,
            normFormula: isExp && avgVector
                ? `(length - min) / (max - min) -> Average Normalized Vector: ${avgVector.length.toFixed(3)}`
                : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
            easyFormula: isExp && avgVector
                ? `avg (${avgVector.length.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.length.toFixed(3)}`
                : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.length.toFixed(3)}`,
            diffFormula: isExp && avgVector
                ? `clamp(avg (${avgVector.length.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.length.toFixed(3)}`
                : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.length.toFixed(3)}`,
        },
        {
            id: "elevation",
            label: "Peak (MASL)",
            category: "Physical Exertion",
            easyDisplay: easyFeats.elevation.toFixed(3),
            diffDisplay: diffFeats.elevation.toFixed(3),
            rawScore: isExp
                ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.geography?.masl || t.difficulty?.elevation || 0} m`).join(", ")} (Average: ${Math.round(matched.reduce((acc, t) => acc + (t.geography?.masl || t.difficulty?.elevation || 0), 0) / matched.length)} m)`
                : `Calibrated baseline (Dataset bounds: ${Math.round(bounds.elevation.min)} m to ${Math.round(bounds.elevation.max)} m)`,
            boundsText: `Dataset Bounds: ${Math.round(bounds.elevation.min)} m to ${Math.round(bounds.elevation.max)} m`,
            normFormula: isExp && avgVector
                ? `(masl - min) / (max - min) -> Average Normalized Vector: ${avgVector.elevation.toFixed(3)}`
                : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
            easyFormula: isExp && avgVector
                ? `avg (${avgVector.elevation.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.elevation.toFixed(3)}`
                : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.elevation.toFixed(3)}`,
            diffFormula: isExp && avgVector
                ? `clamp(avg (${avgVector.elevation.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.elevation.toFixed(3)}`
                : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.elevation.toFixed(3)}`,
        },
        {
            id: "gain",
            label: "Gain",
            category: "Physical Exertion",
            easyDisplay: easyFeats.gain.toFixed(3),
            diffDisplay: diffFeats.gain.toFixed(3),
            rawScore: isExp
                ? `${matched.map((t) => `${t.general?.name || t.id}: ${calculateTrailGain(t, startElevations[t.id])} m`).join(", ")} (Average: ${Math.round(matched.reduce((acc, t) => acc + calculateTrailGain(t, startElevations[t.id]), 0) / matched.length)} m)`
                : `Calibrated baseline (Dataset bounds: ${Math.round(bounds.gain.min)} m to ${Math.round(bounds.gain.max)} m)`,
            boundsText: `Dataset Bounds: ${Math.round(bounds.gain.min)} m to ${Math.round(bounds.gain.max)} m (Peak MASL - Start Elevation)`,
            normFormula: isExp && avgVector
                ? `(gain - min) / (max - min) -> Average Normalized Vector: ${avgVector.gain.toFixed(3)}`
                : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
            easyFormula: isExp && avgVector
                ? `avg (${avgVector.gain.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.gain.toFixed(3)}`
                : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.gain.toFixed(3)}`,
            diffFormula: isExp && avgVector
                ? `clamp(avg (${avgVector.gain.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.gain.toFixed(3)}`
                : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.gain.toFixed(3)}`,
        },
        {
            id: "slope",
            label: "Slope",
            category: "Physical Exertion",
            easyDisplay: easyFeats.slope.toFixed(3),
            diffDisplay: diffFeats.slope.toFixed(3),
            rawScore: isExp
                ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.slope ?? 0}%`).join(", ")} (Average: ${(matched.reduce((acc, t) => acc + (t.difficulty?.slope ?? 0), 0) / matched.length).toFixed(1)}%)`
                : `Calibrated baseline (Dataset bounds: ${bounds.slope.min.toFixed(1)}% to ${bounds.slope.max.toFixed(1)}%)`,
            boundsText: `Dataset Bounds: ${bounds.slope.min.toFixed(1)}% to ${bounds.slope.max.toFixed(1)}%`,
            normFormula: isExp && avgVector
                ? `(slope - min) / (max - min) -> Average Normalized Vector: ${avgVector.slope.toFixed(3)}`
                : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
            easyFormula: isExp && avgVector
                ? `avg (${avgVector.slope.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.slope.toFixed(3)}`
                : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.slope.toFixed(3)}`,
            diffFormula: isExp && avgVector
                ? `clamp(avg (${avgVector.slope.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.slope.toFixed(3)}`
                : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.slope.toFixed(3)}`,
        },
        ...PROVINCES.map((prov: string) => {
            const pKey = prov.toLowerCase() as keyof Profile["features"]["province"];
            const isPref = user.preferences?.province?.some(
                (p) => typeof p === "string" && p.toLowerCase().includes(pKey)
            );
            const mInProv = matched.filter((t) =>
                t.general?.province?.some((p) => typeof p === "string" && p.toLowerCase().includes(pKey))
            );

            return {
                id: `prov_${pKey}`,
                label: prov,
                category: "Province Preference" as const,
                easyDisplay: easyFeats.province[pKey].toFixed(3),
                diffDisplay: diffFeats.province[pKey].toFixed(3),
                rawScore: isExp
                    ? mInProv.length > 0
                        ? `${mInProv.map((t) => t.general?.name || t.id).join(", ")} (${mInProv.length} of ${matched.length} matched trails, ${((mInProv.length / matched.length) * 100).toFixed(0)}%)`
                        : `0 of ${matched.length} matched trails located in ${prov}`
                    : isPref
                        ? "Selected in survey preferences (Preferred Province)"
                        : "Not selected in survey preferences",
                normFormula: isExp && avgVector
                    ? `Percentage of survey trails in ${prov}: ${(avgVector.province[pKey] * 100).toFixed(1)}% -> Vector: ${avgVector.province[pKey].toFixed(3)}`
                    : `Survey Selection: ${isPref ? "1.00 (Selected)" : "0.00 (Unselected)"}`,
                easyFormula: isExp && avgVector
                    ? `Survey Centroid: ${avgVector.province[pKey].toFixed(3)} (Symmetric across both anchors)`
                    : isPref
                        ? `Survey preference weight: ${easyFeats.province[pKey].toFixed(3)}`
                        : `Unselected province weight: ${easyFeats.province[pKey].toFixed(3)}`,
                diffFormula: isExp && avgVector
                    ? `Survey Centroid: ${avgVector.province[pKey].toFixed(3)} (Symmetric across both anchors)`
                    : isPref
                        ? `Survey preference weight: ${diffFeats.province[pKey].toFixed(3)}`
                        : `Unselected province weight: ${diffFeats.province[pKey].toFixed(3)}`,
            };
        }),
        ...TERRAINS.map((terr: string) => {
            const tKey = terr.toLowerCase() as keyof Profile["features"]["terrain"];
            const mWithTerrain = matched.filter((t) => {
                const tp = t.profile?.features?.terrain;
                return tp && typeof tp[tKey] === "number" && tp[tKey] > 0;
            });

            return {
                id: `terr_${tKey}`,
                label: terr,
                category: "Terrain Feature" as const,
                easyDisplay: easyFeats.terrain[tKey].toFixed(3),
                diffDisplay: diffFeats.terrain[tKey].toFixed(3),
                rawScore: isExp
                    ? mWithTerrain.length > 0
                        ? `${mWithTerrain.map((t) => `${t.general?.name || t.id}: ${(t.profile?.features?.terrain?.[tKey] ?? 0).toFixed(2)}`).join(", ")}`
                        : `Not present in any matched survey trails`
                    : "Default beginner baseline (no historical terrain encounters)",
                normFormula: isExp && avgVector
                    ? mWithTerrain.length > 0
                        ? `Average Normalized Vector across matched trails: ${avgVector.terrain[tKey].toFixed(3)}`
                        : "Unobserved in trail history (0.000) -> Softened to beginner baseline prior"
                    : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                easyFormula: isExp && avgVector
                    ? mWithTerrain.length > 0
                        ? `avg (${avgVector.terrain[tKey].toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.terrain[tKey].toFixed(3)}`
                        : `Unobserved baseline: ${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.terrain[tKey].toFixed(3)}`
                    : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.terrain[tKey].toFixed(3)}`,
                diffFormula: isExp && avgVector
                    ? mWithTerrain.length > 0
                        ? `clamp(avg (${avgVector.terrain[tKey].toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.terrain[tKey].toFixed(3)}`
                        : `Unobserved baseline: ${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.terrain[tKey].toFixed(3)}`
                    : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.terrain[tKey].toFixed(3)}`,
            };
        }),
    ];

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <CustomIcon library="Feather" name="user" size={16} color={Colors.PRIMARY} />
                        <Text style={styles.title}>Profile Information & Anchor Vectors</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        Survey responses and preferences calibrated into baseline Easy and Difficult anchor capability vectors.
                    </Text>
                </View>
            </View>

            {/* 1. Survey & Preference Inputs */}
            <View style={styles.subBlock}>
                <View style={styles.subBlockTitleRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <CustomIcon library="Feather" name="clipboard" size={14} color={Colors.PRIMARY} />
                        <Text style={styles.subBlockTitle}>1. Survey & Preference Inputs</Text>
                    </View>
                </View>

                <View style={styles.detailsList}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Medical Concerns:</Text>
                        <Text
                            style={[
                                styles.detailVal,
                                {
                                    color: hasMed ? Palette.Red700 : Colors.TEXT_SECONDARY,
                                    fontWeight: hasMed ? "600" : "400",
                                },
                            ]}
                        >
                            {hasMed
                                ? `Yes (${(Array.isArray(user.medicalProfile?.details) ? user.medicalProfile.details.join(", ") : user.medicalProfile?.details) || "Active condition"}) • 0.80x downshift applied`
                                : "None reported (Standard difficulty)"}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Experience Level:</Text>
                        <Text style={styles.detailVal}>{user.preferences?.experience || "Not set"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Hiked Before:</Text>
                        <Text style={styles.detailVal}>{user.preferences?.hiked ? "Yes" : "No"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Survey Locations:</Text>
                        <Text style={styles.detailVal}>
                            {surveyLocations.length > 0 ? surveyLocations.join(", ") : "None selected"}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Matched Trails in DB:</Text>
                        <Text style={[styles.detailVal, { color: matched.length > 0 ? Colors.PRIMARY : Colors.TEXT_SECONDARY }]}>
                            {matched.length > 0
                                ? `${matched.map((m) => m.general?.name || m.id).join(", ")} (${matched.length} matched)`
                                : "None (Defaults to Beginner formulation)"}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Preferred Provinces:</Text>
                        <Text style={styles.detailVal}>
                            {user.preferences?.province?.length ? user.preferences.province.join(", ") : "None"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 2. Twin Anchors Comparison Table with Interactive Feature Breakdown */}
            <View style={styles.subBlock}>
                <View style={styles.subBlockTitleRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <CustomIcon library="Feather" name="sliders" size={14} color={Colors.PRIMARY} />
                        <Text style={styles.subBlockTitle}>2. Generated Two-Anchor Vectors</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {onResetToInitial && (
                            <TouchableOpacity
                                style={styles.resetSurveyBtn}
                                onPress={onResetToInitial}
                                disabled={isResettingProfile}
                            >
                                <CustomIcon library="Feather" name="rotate-ccw" size={12} color={Palette.Slate700} />
                                <Text style={styles.resetSurveyBtnText}>
                                    {isResettingProfile ? "Resetting..." : "Reset to Initial Formulation"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.tapInstructionText}>Tap a feature to view score breakdown</Text>
                    </View>
                </View>

                <View style={styles.calcTable}>
                <View style={styles.calcTableRowHeader}>
                    <Text style={[styles.calcTh, { flex: 2 }]}>Feature</Text>
                    <Text style={[styles.calcTh, { flex: 1.5, textAlign: "center", color: Palette.Green700 }]}>
                        Easy Anchor
                    </Text>
                    <Text style={[styles.calcTh, { flex: 1.5, textAlign: "center", color: Palette.Amber700 }]}>
                        Difficult Anchor
                    </Text>
                </View>

                {featureItems.map((feat) => {
                    const isExpanded = expandedFeatureKey === feat.id;

                    return (
                        <React.Fragment key={feat.id}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setExpandedFeatureKey(isExpanded ? null : feat.id)}
                                style={[styles.calcTableRow, isExpanded && styles.calcTableRowActive]}
                            >
                                <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <CustomIcon
                                        library="Feather"
                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                        size={12}
                                        color={isExpanded ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                    />
                                    <Text style={[styles.calcTdBold, isExpanded && { color: Colors.PRIMARY }]}>
                                        {feat.label}
                                    </Text>
                                </View>
                                <Text style={[styles.calcTd, { flex: 1.5, textAlign: "center", color: Palette.Green700, fontWeight: "600" }]}>
                                    {feat.easyDisplay}
                                </Text>
                                <Text style={[styles.calcTd, { flex: 1.5, textAlign: "center", color: Palette.Amber700, fontWeight: "600" }]}>
                                    {feat.diffDisplay}
                                </Text>
                            </TouchableOpacity>

                            {/* Expanded Dropdown Breakdown */}
                            {isExpanded && (
                                <View style={styles.breakdownCard}>
                                    <View style={styles.breakdownHeader}>
                                        <View style={styles.breakdownBadge}>
                                            <Text style={styles.breakdownBadgeText}>{feat.category}</Text>
                                        </View>
                                        {hasMed && (feat.category === "Physical Exertion" || feat.category === "Terrain Feature") && (
                                            <View style={styles.breakdownMedBadge}>
                                                <Text style={styles.breakdownMedBadgeText}>{medFactorStr}x Medical Downshift</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Raw Score Breakdown */}
                                    <View style={styles.breakdownSection}>
                                        <Text style={styles.breakdownLabel}>Raw Score / Data Source:</Text>
                                        <Text style={styles.breakdownValue}>{feat.rawScore}</Text>
                                    </View>

                                    {/* Bounds / Range if applicable */}
                                    {"boundsText" in feat && feat.boundsText ? (
                                        <View style={styles.breakdownSection}>
                                            <Text style={styles.breakdownLabel}>Dataset Normalization Range:</Text>
                                            <Text style={styles.breakdownValue}>{feat.boundsText}</Text>
                                        </View>
                                    ) : null}

                                    {/* Normalized Base Formula */}
                                    <View style={styles.breakdownSection}>
                                        <Text style={styles.breakdownLabel}>Normalized Base Formula:</Text>
                                        <Text style={styles.breakdownValue}>{feat.normFormula}</Text>
                                    </View>

                                    {/* Two-Anchor Computation */}
                                    <View style={styles.breakdownTwinGrid}>
                                        <View style={styles.breakdownAnchorBoxEasy}>
                                            <Text style={styles.breakdownAnchorTitleEasy}>Easy Anchor Computation</Text>
                                            <Text style={styles.breakdownFormulaText}>{feat.easyFormula}</Text>
                                            <Text style={styles.breakdownResultEasy}>Final Vector: {feat.easyDisplay}</Text>
                                        </View>
                                        <View style={styles.breakdownAnchorBoxDiff}>
                                            <Text style={styles.breakdownAnchorTitleDiff}>Difficult Anchor Computation</Text>
                                            <Text style={styles.breakdownFormulaText}>{feat.diffFormula}</Text>
                                            <Text style={styles.breakdownResultDiff}>Final Vector: {feat.diffDisplay}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </React.Fragment>
                    );
                })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
        maxWidth: 640,
    },
    subBlock: {
        gap: 12,
    },
    subBlockTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        paddingBottom: 8,
    },
    subBlockTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    detailsList: {
        gap: 4,
    },
    tapInstructionText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
    },
    resetSurveyBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate300,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    resetSurveyBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Slate700,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 3,
        gap: 12,
    },
    detailKey: {
        width: 140,
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    detailVal: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
    },
    calcTable: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        overflow: "hidden",
        marginTop: 6,
    },
    calcTableRowHeader: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    calcTh: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    calcTableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate150,
        backgroundColor: Colors.WHITE,
    },
    calcTableRowActive: {
        backgroundColor: Palette.Slate50,
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
    },
    calcTd: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
    },
    calcTdBold: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    breakdownCard: {
        backgroundColor: Palette.Slate50,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        gap: 8,
    },
    breakdownHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    breakdownBadge: {
        backgroundColor: Palette.Slate200,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    breakdownBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate700,
    },
    breakdownMedBadge: {
        backgroundColor: Palette.Red100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    breakdownMedBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Red800,
    },
    breakdownSection: {
        gap: 2,
    },
    breakdownLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    breakdownValue: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    breakdownTwinGrid: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 4,
    },
    breakdownAnchorBoxEasy: {
        flex: 1,
        minWidth: 200,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
        borderRadius: 6,
        padding: 8,
        gap: 4,
    },
    breakdownAnchorBoxDiff: {
        flex: 1,
        minWidth: 200,
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        borderRadius: 6,
        padding: 8,
        gap: 4,
    },
    breakdownAnchorTitleEasy: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Green800,
    },
    breakdownAnchorTitleDiff: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Amber800,
    },
    breakdownFormulaText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontFamily: "monospace",
    },
    breakdownResultEasy: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Green800,
        marginTop: 2,
    },
    breakdownResultDiff: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Amber800,
        marginTop: 2,
    },
});
