import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Recommendation } from "@/src/core/models/Recommendation/Recommendation";
import { Review } from "@/src/core/models/Review/Review";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { updateUserProfileFromHikes } from "@/src/features/SuperAdmin/services/tarsApiService";
import { UserProfiles } from "@/src/recommendation/interfaces/Profile";
import { resolveHikeFactorWeights } from "@/src/recommendation/utilities/FactorWeightsMapper";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface UserProfileUpdateSectionProps {
    user: User;
    userProfiles: UserProfiles;
    userReviews: Review[];
    trails: Trail[];
    userRecommendations: Recommendation | null;
    onSaveProfile?: (profile: UserProfiles) => Promise<boolean | void>;
    onResetToInitial?: () => void;
    isSavingProfile?: boolean;
    isResettingProfile?: boolean;
    stagedUpdatedProfile?: UserProfiles | null;
    onStagedUpdateChange?: (profile: UserProfiles | null) => void;
}

const CANONICAL_UPDATE_METRICS = [
    { key: "length", label: "Trail Length (km)", category: "Physical" },
    { key: "elevation", label: "Peak Elevation (MASL)", category: "Physical" },
    { key: "gain", label: "Elevation Gain (m)", category: "Physical" },
    { key: "slope", label: "Trail Slope / Gradient (%)", category: "Physical" },
    { key: "easy", label: "Lasco / Rating (1-9)", category: "Physical" },
    { key: "classification", label: "Classification (Minor/Major)", category: "Physical" },
    { key: "muddy", label: "Terrain: Muddy", category: "Terrain" },
    { key: "rocky", label: "Terrain: Rocky", category: "Terrain" },
    { key: "grassland", label: "Terrain: Grassland", category: "Terrain" },
    { key: "ridges", label: "Terrain: Ridges", category: "Terrain" },
    { key: "out_and_back", label: "Route: Out-and-Back", category: "Route" },
    { key: "traverse", label: "Route: Traverse", category: "Route" },
    { key: "circular", label: "Route: Circular Loop", category: "Route" },
];

const getFeatureVal = (features: any, key: string): number => {
    if (!features || typeof features !== "object") return 0;
    if (typeof features[key] === "number") return features[key];
    if (features.terrain && typeof features.terrain[key] === "number") return features.terrain[key];
    if (features.province && typeof features.province[key] === "number") return features.province[key];
    if (features.circularity && typeof features.circularity[key] === "number") return features.circularity[key];
    if (features.waterforms && typeof features.waterforms[key] === "number") return features.waterforms[key];
    if (features.tourism && typeof features.tourism[key] === "number") return features.tourism[key];
    return 0;
};

const parsePerceivedDifficulty = (diff?: string) => {
    if (!diff) return { label: "Unspecified", isEasy: true };
    const d = String(diff).toLowerCase();
    if (d.includes("easy") || d.includes("chill") || d.includes("beginner")) {
        return { label: "Easy", isEasy: true };
    }
    return { label: "Difficult", isEasy: false };
};

export default function UserProfileUpdateSection({
    user,
    userProfiles,
    userReviews,
    trails,
    userRecommendations,
    onSaveProfile,
    onResetToInitial,
    isSavingProfile = false,
    isResettingProfile = false,
    stagedUpdatedProfile = null,
    onStagedUpdateChange,
}: UserProfileUpdateSectionProps) {
    const [isComputingUpdate, setIsComputingUpdate] = useState<boolean>(false);
    const [simulatedUpdateResult, setSimulatedUpdateResult] = useState<{
        easyFeatures: Record<string, any>;
        diffFeatures: Record<string, any>;
        easyDelta: Record<string, number>;
        diffDelta: Record<string, number>;
        easyHikesCount: number;
        diffHikesCount: number;
        computedAt: string;
        source: "server" | "local";
        preparedHikes?: {
            trailId: string;
            trailName: string;
            hikeDate?: string | number | Date | null;
            trailFeatures: any;
            score: number;
            isMatch: boolean;
            targetAnchor: "easy" | "difficult";
            featureWeights: Record<string, number>;
            perceivedDifficulty?: string;
            difficultyFactors?: string[];
        }[];
    } | null>(null);
    const [updateSimulationError, setUpdateSimulationError] = useState<string | null>(null);
    const [expandedUpdateFeatureKey, setExpandedUpdateFeatureKey] = useState<string | null>(null);

    const knownTrailIdSet = useMemo(() => new Set(trails.map((t) => t.id)), [trails]);

    const userKnownReviews = useMemo(() => {
        return userReviews.filter((r) => {
            const tid = r.trail?.id;
            return Boolean(tid && tid !== "diy" && tid !== "diy_session" && knownTrailIdSet.has(tid));
        });
    }, [userReviews, knownTrailIdSet]);

    // Local fallback calculation for adaptive profile update in case server engine is unreachable
    const computeLocalProfileUpdateFallback = useCallback((
        currentEasy: any,
        currentDiff: any,
        hikes: {
            trailFeatures: any;
            score: number;
            isMatch: boolean;
            targetAnchor: "easy" | "difficult";
            featureWeights: Record<string, number>;
        }[]
    ) => {
        const easyHikes = hikes.filter((h) => h.targetAnchor === "easy");
        const diffHikes = hikes.filter((h) => h.targetAnchor === "difficult");

        const updateAnchor = (currentFeatures: any, anchorHikes: typeof hikes) => {
            const updated: Record<string, any> = JSON.parse(JSON.stringify(currentFeatures || {}));
            const deltas: Record<string, number> = {};

            if (anchorHikes.length === 0) {
                return { updated, deltas };
            }

            CANONICAL_UPDATE_METRICS.forEach(({ key }) => {
                const currentVal = getFeatureVal(currentFeatures, key);
                let weightedDeltaSum = 0;

                anchorHikes.forEach((h) => {
                    const trailVal = getFeatureVal(h.trailFeatures, key);
                    const rtu = h.score;
                    const beta = h.isMatch ? rtu / 2 : -(1.0 - rtu) / 2;
                    const diff = trailVal - currentVal;
                    const w = typeof h.featureWeights[key] === "number" ? h.featureWeights[key] : 0.20;
                    weightedDeltaSum += w * (beta * diff);
                });

                const avgDelta = weightedDeltaSum / anchorHikes.length;
                deltas[key] = avgDelta;
                const newVal = Math.min(1.0, Math.max(0.0, currentVal + avgDelta));

                if (["muddy", "rocky", "grassland", "ridges"].includes(key)) {
                    if (!updated.terrain) updated.terrain = {};
                    updated.terrain[key] = newVal;
                } else if (["out_and_back", "traverse", "circular"].includes(key)) {
                    if (!updated.circularity) updated.circularity = {};
                    updated.circularity[key] = newVal;
                } else {
                    updated[key] = newVal;
                }
            });

            return { updated, deltas };
        };

        const easyRes = updateAnchor(currentEasy, easyHikes);
        const diffRes = updateAnchor(currentDiff, diffHikes);

        // Enforce monotonicity (easy <= diff for physical metrics)
        ["length", "elevation", "gain", "slope", "easy", "classification"].forEach((key) => {
            const easyV = getFeatureVal(easyRes.updated, key);
            const diffV = getFeatureVal(diffRes.updated, key);
            if (easyV > diffV) {
                diffRes.updated[key] = Math.min(1.0, easyV + 0.05);
                diffRes.deltas[key] = diffRes.updated[key] - getFeatureVal(currentDiff, key);
            }
        });

        return {
            updatedEasy: easyRes.updated,
            updatedDiff: diffRes.updated,
            easyDeltas: easyRes.deltas,
            diffDeltas: diffRes.deltas,
            easyCount: easyHikes.length,
            diffCount: diffHikes.length,
        };
    }, []);

    // Compute updated profile vectors without saving to Firestore (preview only)
    const handleComputeUpdatedProfile = useCallback(async () => {
        setIsComputingUpdate(true);
        setUpdateSimulationError(null);

        if (userKnownReviews.length === 0) {
            setIsComputingUpdate(false);
            setUpdateSimulationError("This user has no completed reviews on official known trails. Adaptive profile update requires at least 1 known trail review.");
            return;
        }

        const preparedHikes = userKnownReviews.map((rev) => {
            const tid = String(rev.trail?.id);
            const matchedTrail = trails.find((t) => t.id === tid);
            const trailFeats = matchedTrail?.profile?.features || {};

            const inDiff = userRecommendations?.difficult?.find((t) => t.id === tid);
            const inEasy = userRecommendations?.easy?.find((t) => t.id === tid);
            let targetAnchor: "easy" | "difficult" = "easy";
            let score = 0.35;
            if (inDiff) {
                targetAnchor = "difficult";
                score = inDiff.score ?? inDiff.cbfScore ?? 0.35;
            } else if (inEasy) {
                targetAnchor = "easy";
                score = inEasy.score ?? inEasy.cbfScore ?? 0.35;
            }

            const diffInfo = parsePerceivedDifficulty(rev.perceivedDifficulty);
            const isMatch = (targetAnchor === "easy" && diffInfo.isEasy) || (targetAnchor === "difficult" && !diffInfo.isEasy);

            const featureWeights = resolveHikeFactorWeights({
                selectedFactors: rev.difficultyFactors || [],
                trailFeatures: trailFeats,
            });

            return {
                trailId: tid,
                trailName: rev.trail?.name || matchedTrail?.general?.name || (matchedTrail as any)?.name || "Official Trail",
                hikeDate: rev.hikeDate || rev.createdAt,
                trailFeatures: trailFeats,
                score,
                isMatch,
                targetAnchor,
                featureWeights,
                perceivedDifficulty: rev.perceivedDifficulty,
                difficultyFactors: rev.difficultyFactors || [],
            };
        });

        try {
            let resultSource: "server" | "local" = "server";
            let updatedEasyFeatures: any = null;
            let updatedDiffFeatures: any = null;
            let easyDeltas: Record<string, number> = {};
            let diffDeltas: Record<string, number> = {};
            let easyCount = 0;
            let diffCount = 0;

            try {
                const apiRes = await updateUserProfileFromHikes({
                    userId: user.id,
                    currentEasyProfile: userProfiles.easy.features,
                    currentDifficultProfile: userProfiles.difficult.features,
                    hikes: preparedHikes,
                    commitToFirestore: false, // Manager preview only: does NOT save!
                });

                if (apiRes?.profile) {
                    updatedEasyFeatures = apiRes.profile.easy?.features || {};
                    updatedDiffFeatures = apiRes.profile.difficult?.features || {};
                    easyCount = apiRes.easy_hikes_count ?? 0;
                    diffCount = apiRes.difficult_hikes_count ?? 0;

                    CANONICAL_UPDATE_METRICS.forEach(({ key }) => {
                        const cEasy = getFeatureVal(userProfiles.easy.features, key);
                        const uEasy = getFeatureVal(updatedEasyFeatures, key);
                        easyDeltas[key] = uEasy - cEasy;

                        const cDiff = getFeatureVal(userProfiles.difficult.features, key);
                        const uDiff = getFeatureVal(updatedDiffFeatures, key);
                        diffDeltas[key] = uDiff - cDiff;
                    });
                } else {
                    throw new Error("Invalid response from engine API");
                }
            } catch (apiErr: any) {
                console.warn("[UserProfileUpdateSection] Server profile update failed or offline, using local formula calculation:", apiErr?.message);
                resultSource = "local";
                const localRes = computeLocalProfileUpdateFallback(
                    userProfiles.easy.features,
                    userProfiles.difficult.features,
                    preparedHikes
                );
                updatedEasyFeatures = localRes.updatedEasy;
                updatedDiffFeatures = localRes.updatedDiff;
                easyDeltas = localRes.easyDeltas;
                diffDeltas = localRes.diffDeltas;
                easyCount = localRes.easyCount;
                diffCount = localRes.diffCount;
            }

            const computedProfiles: UserProfiles = {
                easy: {
                    ...(userProfiles.easy || {}),
                    metadata: { type: "user", id: user.id, profile: "easy" },
                    features: updatedEasyFeatures,
                },
                difficult: {
                    ...(userProfiles.difficult || {}),
                    metadata: { type: "user", id: user.id, profile: "difficult" },
                    features: updatedDiffFeatures,
                },
            };

            setSimulatedUpdateResult({
                easyFeatures: updatedEasyFeatures,
                diffFeatures: updatedDiffFeatures,
                easyDelta: easyDeltas,
                diffDelta: diffDeltas,
                easyHikesCount: easyCount,
                diffHikesCount: diffCount,
                computedAt: new Date().toLocaleTimeString(),
                source: resultSource,
                preparedHikes,
            });

            onStagedUpdateChange?.(computedProfiles);
        } catch (err: any) {
            console.error("[UserProfileUpdateSection] Error computing simulated profile update:", err);
            setUpdateSimulationError(err?.message || "Failed to compute updated profile.");
        } finally {
            setIsComputingUpdate(false);
        }
    }, [user.id, userKnownReviews, trails, userRecommendations, userProfiles, computeLocalProfileUpdateFallback, onStagedUpdateChange]);

    const handleSaveCurrentSimulation = async () => {
        if (!simulatedUpdateResult || !onSaveProfile) return;
        const computedProfiles: UserProfiles = {
            easy: {
                ...(userProfiles.easy || {}),
                metadata: { type: "user", id: user.id, profile: "easy" },
                features: simulatedUpdateResult.easyFeatures,
            },
            difficult: {
                ...(userProfiles.difficult || {}),
                metadata: { type: "user", id: user.id, profile: "difficult" },
                features: simulatedUpdateResult.diffFeatures,
            },
        };
        await onSaveProfile(computedProfiles);
    };

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <CustomIcon library="Feather" name="trending-up" size={16} color={Colors.PRIMARY} />
                        <Text style={styles.title}>Adaptive Profile Update Simulation</Text>
                        <View style={styles.previewBadge}>
                            <Text style={styles.previewBadgeText}>Manager Preview (Unsaved)</Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle}>
                        Simulates the error-driven profile update using the user's completed hike reviews for the month. Computes adjusted Easy and Difficult anchor vectors for inspection without saving to Firestore.
                    </Text>
                </View>
            </View>

            {/* 1. Current Profile Vectors (Baseline) */}
            <View style={styles.subBlock}>
                <View style={styles.subBlockTitleRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <CustomIcon library="Feather" name="sliders" size={14} color={Colors.PRIMARY} />
                        <Text style={styles.subBlockTitle}>1. Current Profile Vectors (Baseline Capability)</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: Colors.TEXT_MUTED }}>Current Normalized Values [0.0 - 1.0]</Text>
                </View>

                <View style={styles.twinVectorsRow}>
                    {/* Easy Anchor Card */}
                    <View style={styles.vectorCardEasy}>
                        <View style={styles.vectorCardHeader}>
                            <Text style={styles.vectorCardTitleEasy}>Current Easy Anchor</Text>
                            <CustomIcon library="Feather" name="shield" size={14} color={Palette.Green700} />
                        </View>
                        <View style={styles.vectorMetricsGrid}>
                            {CANONICAL_UPDATE_METRICS.slice(0, 6).map(({ key, label }) => (
                                <View key={key} style={styles.vectorMetricRow}>
                                    <Text style={styles.vectorMetricLabel}>{label}:</Text>
                                    <Text style={styles.vectorMetricVal}>
                                        {getFeatureVal(userProfiles.easy.features, key).toFixed(3)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Difficult Anchor Card */}
                    <View style={styles.vectorCardDiff}>
                        <View style={styles.vectorCardHeader}>
                            <Text style={styles.vectorCardTitleDiff}>Current Difficult Anchor</Text>
                            <CustomIcon library="Feather" name="zap" size={14} color={Palette.Amber700} />
                        </View>
                        <View style={styles.vectorMetricsGrid}>
                            {CANONICAL_UPDATE_METRICS.slice(0, 6).map(({ key, label }) => (
                                <View key={key} style={styles.vectorMetricRow}>
                                    <Text style={styles.vectorMetricLabel}>{label}:</Text>
                                    <Text style={styles.vectorMetricVal}>
                                        {getFeatureVal(userProfiles.difficult.features, key).toFixed(3)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* 2. Hiked Trails for the Month */}
            <View style={styles.subBlock}>
                <View style={styles.subBlockTitleRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <CustomIcon library="Feather" name="activity" size={14} color={Colors.PRIMARY} />
                        <Text style={styles.subBlockTitle}>2. Hiked Trails for the Month ({userKnownReviews.length} Eligible)</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: Colors.TEXT_MUTED }}>Only reviews on known trails update vectors</Text>
                </View>

                {userKnownReviews.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <CustomIcon library="Feather" name="alert-circle" size={18} color={Palette.Amber600} />
                        <Text style={styles.emptyText}>
                            No hike reviews on official known trails found for this user. At least 1 known trail review is required to compute an update.
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 8 }}>
                        {userKnownReviews.map((rev, idx) => {
                            const tid = String(rev.trail?.id);
                            const matchedTrail = trails.find((t) => t.id === tid);
                            const inDiff = userRecommendations?.difficult?.find((t) => t.id === tid);
                            const inEasy = userRecommendations?.easy?.find((t) => t.id === tid);
                            const targetAnchor = inDiff ? "difficult" : "easy";
                            const score = inDiff?.score ?? inEasy?.score ?? 0.35;
                            const diffInfo = parsePerceivedDifficulty(rev.perceivedDifficulty);
                            const isMatch = (targetAnchor === "easy" && diffInfo.isEasy) || (targetAnchor === "difficult" && !diffInfo.isEasy);
                            const beta = isMatch ? score / 2 : -(1.0 - score) / 2;
                            const factorList = rev.difficultyFactors || [];

                            return (
                                <View key={rev.id || idx} style={styles.hikeMiniCard}>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.TEXT_PRIMARY }}>
                                                {rev.trail?.name || matchedTrail?.general?.name || (matchedTrail as any)?.name || "Official Trail"}
                                            </Text>
                                            <View style={[styles.targetAnchorBadge, targetAnchor === "easy" ? styles.targetAnchorEasy : styles.targetAnchorDiff]}>
                                                <Text style={[styles.targetAnchorBadgeText, targetAnchor === "easy" ? styles.targetAnchorTextEasy : styles.targetAnchorTextDiff]}>
                                                    Predicted: {targetAnchor.toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={[styles.targetAnchorBadge, diffInfo.isEasy ? styles.targetAnchorEasy : styles.targetAnchorDiff]}>
                                                <Text style={[styles.targetAnchorBadgeText, diffInfo.isEasy ? styles.targetAnchorTextEasy : styles.targetAnchorTextDiff]}>
                                                    Actual: {diffInfo.isEasy ? "EASY" : "DIFFICULT"}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                            <Text style={{ fontSize: 12, color: Colors.TEXT_MUTED }}>
                                                Recommendation Score (R_tu): {score.toFixed(3)}
                                            </Text>
                                            <View style={[styles.matchStatusBadge, isMatch ? styles.matchBadgeMatch : styles.matchBadgeMismatch]}>
                                                <Text style={[styles.matchStatusBadgeText, isMatch ? styles.matchTextMatch : styles.matchTextMismatch]}>
                                                    {isMatch ? "✓ Match" : "✕ Mismatch"} (β = {beta >= 0 ? `+${beta.toFixed(3)}` : beta.toFixed(3)})
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {factorList.length > 0 && (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                            <Text style={{ fontSize: 12, color: Colors.TEXT_MUTED }}>Factors:</Text>
                                            {factorList.map((f, fi) => (
                                                <View key={fi} style={styles.miniFactorChip}>
                                                    <Text style={styles.miniFactorChipText}>{String(f)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* 3. Updated Profile Vectors (Computed on Button Press) */}
            <View style={styles.subBlock}>
                <View style={styles.subBlockTitleRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <CustomIcon library="Feather" name="cpu" size={14} color={Colors.PRIMARY} />
                        <Text style={styles.subBlockTitle}>3. Updated Profile Vectors (Simulated Result)</Text>
                    </View>
                    {simulatedUpdateResult && (
                        <Text style={{ fontSize: 12, color: Palette.Green700, fontWeight: "600" }}>
                            Computed at {simulatedUpdateResult.computedAt} ({simulatedUpdateResult.source === "server" ? "Engine API" : "Local Engine"})
                        </Text>
                    )}
                </View>

                {updateSimulationError && (
                    <View style={styles.errorBanner}>
                        <CustomIcon library="Feather" name="alert-triangle" size={14} color={Palette.Red700} />
                        <Text style={styles.errorText}>{updateSimulationError}</Text>
                    </View>
                )}

                {!simulatedUpdateResult ? (
                    <View style={styles.computeActionBox}>
                        <TouchableOpacity
                            style={[styles.computeBtn, isComputingUpdate && { opacity: 0.7 }]}
                            onPress={handleComputeUpdatedProfile}
                            disabled={isComputingUpdate}
                        >
                            {isComputingUpdate ? (
                                <ActivityIndicator size="small" color={Colors.WHITE} />
                            ) : (
                                <CustomIcon library="Feather" name="play" size={15} color={Colors.WHITE} />
                            )}
                            <Text style={styles.computeBtnText}>
                                {isComputingUpdate ? "Computing Profile Update..." : "Compute Updated Profile Vectors (Preview)"}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.computeHintText}>
                            ⚡ Pure simulation mode: Does not save to Firestore. Allows reviewing the computed values and feature deltas before monthly execution.
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {/* Success / Status Banner */}
                        <View style={styles.updateSuccessBanner}>
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, minWidth: 260 }}>
                                <CustomIcon library="Feather" name="check-circle" size={16} color={Palette.Green800} />
                                <Text style={styles.updateSuccessText}>
                                    Batched update computed across {simulatedUpdateResult.easyHikesCount} easy and {simulatedUpdateResult.diffHikesCount} difficult hikes.
                                </Text>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <TouchableOpacity
                                    style={styles.recomputeBtn}
                                    onPress={handleComputeUpdatedProfile}
                                    disabled={isComputingUpdate || isSavingProfile}
                                >
                                    <CustomIcon library="Feather" name="refresh-cw" size={12} color={Colors.PRIMARY} />
                                    <Text style={styles.recomputeBtnText}>Re-compute</Text>
                                </TouchableOpacity>

                                {onResetToInitial && (
                                    <TouchableOpacity
                                        style={styles.resetProfileBtn}
                                        onPress={onResetToInitial}
                                        disabled={isSavingProfile || isResettingProfile || isComputingUpdate}
                                    >
                                        <CustomIcon library="Feather" name="rotate-ccw" size={12} color={Palette.Slate700} />
                                        <Text style={styles.resetProfileBtnText}>Reset to Initial</Text>
                                    </TouchableOpacity>
                                )}

                                {onSaveProfile && (
                                    <TouchableOpacity
                                        style={styles.saveUpdatedProfileBtn}
                                        onPress={handleSaveCurrentSimulation}
                                        disabled={isSavingProfile || isComputingUpdate}
                                    >
                                        {isSavingProfile ? (
                                            <ActivityIndicator size="small" color={Colors.WHITE} />
                                        ) : (
                                            <CustomIcon library="Feather" name="save" size={13} color={Colors.WHITE} />
                                        )}
                                        <Text style={styles.saveUpdatedProfileBtnText}>
                                            {isSavingProfile ? "Saving to DB..." : "Update Profile & Save to DB"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Governing Feature Update Formula Box */}
                        <View style={styles.formulaSummaryBox}>
                            <Text style={styles.formulaSummaryLabel}>Governing Feature Update Formula:</Text>
                            <Text style={styles.formulaSummaryMath}>
                                Delta_i = W_i * beta_i * (Trail_i - Profile_current)
                            </Text>
                            <Text style={styles.formulaSummaryMath}>
                                beta_i = +(R_tu / 2)  [Match]   OR   -((1.0 - R_tu) / 2)  [Mismatch]
                            </Text>
                            <Text style={styles.formulaSummaryMath}>
                                Profile_new = clamp( Profile_current + (1 / N) * sum(Delta_i), 0.0, 1.0 )
                            </Text>
                            <Text style={styles.formulaSummaryDesc}>
                                Calculated per feature dimension across all completed hikes. W_i is the feature weight (1.00 for factors chosen by the user in review tags, 0.20 background baseline, or 0.00 for unencountered terrain). beta_i is the error-driven learning step governed by recommendation match distance R_tu.
                            </Text>
                        </View>

                        {/* Comparison Table */}
                        <View style={styles.compareTable}>
                            <View style={styles.compareTableHeader}>
                                <Text style={[styles.th, styles.compareColName]}>Feature Dimension</Text>
                                <Text style={[styles.th, styles.compareColEasy, { textAlign: "right" }]}>Easy (Current → Updated)</Text>
                                <Text style={[styles.th, styles.compareColDiff, { textAlign: "right" }]}>Difficult (Current → Updated)</Text>
                            </View>

                            <View style={styles.compareTableInstructionRow}>
                                <CustomIcon library="Feather" name="info" size={12} color={Colors.PRIMARY} />
                                <Text style={styles.compareTableInstructionText}>
                                    Tap any feature row below to expand the step-by-step mathematical trace and weight breakdown.
                                </Text>
                            </View>

                            {CANONICAL_UPDATE_METRICS.map(({ key, label, category }) => {
                                const curEasy = getFeatureVal(userProfiles.easy.features, key);
                                const updEasy = getFeatureVal(simulatedUpdateResult.easyFeatures, key);
                                const deltaEasy = simulatedUpdateResult.easyDelta[key] ?? (updEasy - curEasy);

                                const curDiff = getFeatureVal(userProfiles.difficult.features, key);
                                const updDiff = getFeatureVal(simulatedUpdateResult.diffFeatures, key);
                                const deltaDiff = simulatedUpdateResult.diffDelta[key] ?? (updDiff - curDiff);

                                const isExpanded = expandedUpdateFeatureKey === key;
                                const allHikes = simulatedUpdateResult.preparedHikes || [];
                                const easyHikes = allHikes.filter((h) => h.targetAnchor === "easy");
                                const diffHikes = allHikes.filter((h) => h.targetAnchor === "difficult");

                                return (
                                    <React.Fragment key={key}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => setExpandedUpdateFeatureKey(isExpanded ? null : key)}
                                            style={[styles.compareTableRow, isExpanded && styles.compareTableRowActive]}
                                        >
                                            <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <CustomIcon
                                                    library="Feather"
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={12}
                                                    color={isExpanded ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                                />
                                                <Text style={[styles.compareColName, isExpanded && { color: Colors.PRIMARY, fontWeight: "700" }]} numberOfLines={1}>
                                                    {label}
                                                </Text>
                                            </View>

                                            {/* Easy Comparison */}
                                            <View style={styles.compareColEasy}>
                                                <Text style={{ fontSize: 12, color: Colors.TEXT_SECONDARY }}>
                                                    {curEasy.toFixed(3)} → <Text style={{ fontWeight: "700", color: Colors.TEXT_PRIMARY }}>{updEasy.toFixed(3)}</Text>
                                                </Text>
                                                <View style={Math.abs(deltaEasy) < 0.001 ? styles.deltaBadgeZero : deltaEasy > 0 ? styles.deltaBadgePos : styles.deltaBadgeNeg}>
                                                    <Text style={Math.abs(deltaEasy) < 0.001 ? styles.deltaTextZero : deltaEasy > 0 ? styles.deltaTextPos : styles.deltaTextNeg}>
                                                        {deltaEasy > 0.0005 ? `+${deltaEasy.toFixed(3)} ↑` : deltaEasy < -0.0005 ? `${deltaEasy.toFixed(3)} ↓` : "0.000"}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Difficult Comparison */}
                                            <View style={styles.compareColDiff}>
                                                <Text style={{ fontSize: 12, color: Colors.TEXT_SECONDARY }}>
                                                    {curDiff.toFixed(3)} → <Text style={{ fontWeight: "700", color: Colors.TEXT_PRIMARY }}>{updDiff.toFixed(3)}</Text>
                                                </Text>
                                                <View style={Math.abs(deltaDiff) < 0.001 ? styles.deltaBadgeZero : deltaDiff > 0 ? styles.deltaBadgePos : styles.deltaBadgeNeg}>
                                                    <Text style={Math.abs(deltaDiff) < 0.001 ? styles.deltaTextZero : deltaDiff > 0 ? styles.deltaTextPos : styles.deltaTextNeg}>
                                                        {deltaDiff > 0.0005 ? `+${deltaDiff.toFixed(3)} ↑` : deltaDiff < -0.0005 ? `${deltaDiff.toFixed(3)} ↓` : "0.000"}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Expanded Mathematical Trace Breakdown Card */}
                                        {isExpanded && (
                                            <View style={styles.updateBreakdownCard}>
                                                {/* Twin Anchor Trace Columns */}
                                                <View style={styles.updateTwinAnchorBreakdown}>
                                                    {/* EASY ANCHOR TRACE */}
                                                    <View style={styles.updateAnchorBoxEasy}>
                                                        <View style={styles.updateAnchorHeader}>
                                                            <Text style={styles.updateAnchorTitleEasy}>Easy Anchor: {label}</Text>
                                                            <Text style={{ fontSize: 12, color: Palette.Green800, fontWeight: "600" }}>
                                                                Baseline: {curEasy.toFixed(3)}
                                                            </Text>
                                                        </View>

                                                        {easyHikes.length === 0 ? (
                                                            <View style={styles.anchorNoHikesBox}>
                                                                <Text style={styles.anchorNoHikesText}>
                                                                    No hike reviews targeted the Easy anchor this month (0 hikes).
                                                                    {"\n"}Anchor vector remains at baseline: {curEasy.toFixed(3)}
                                                                </Text>
                                                            </View>
                                                        ) : (
                                                            <View style={{ gap: 8 }}>
                                                                {easyHikes.map((h, hIdx) => {
                                                                    const trailVal = getFeatureVal(h.trailFeatures, key);
                                                                    const diff = trailVal - curEasy;
                                                                    const beta = h.isMatch ? h.score / 2 : -(1.0 - h.score) / 2;
                                                                    let w = typeof h.featureWeights[key] === "number" ? h.featureWeights[key] : 0.20;
                                                                    if (category === "Terrain" && trailVal <= 0.05) w = 0.0;
                                                                    const stepDelta = w * (beta * diff);

                                                                    const wLabel = w === 1.0
                                                                        ? "1.00 (Primary factor: tagged by user)"
                                                                        : w === 0.0
                                                                            ? "0.00 (Presence gated: unencountered terrain)"
                                                                            : "0.20 (Default baseline weight)";

                                                                    const hDiff = parsePerceivedDifficulty(h.perceivedDifficulty);

                                                                    return (
                                                                        <View key={hIdx} style={styles.hikeMathTraceCard}>
                                                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                                                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                                                    <Text style={styles.hikeMathTrailName}>{h.trailName}</Text>
                                                                                    <View style={[styles.targetAnchorBadge, h.targetAnchor === "easy" ? styles.targetAnchorEasy : styles.targetAnchorDiff]}>
                                                                                        <Text style={[styles.targetAnchorBadgeText, h.targetAnchor === "easy" ? styles.targetAnchorTextEasy : styles.targetAnchorTextDiff]}>
                                                                                            Predicted: {h.targetAnchor.toUpperCase()}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={[styles.targetAnchorBadge, hDiff.isEasy ? styles.targetAnchorEasy : styles.targetAnchorDiff]}>
                                                                                        <Text style={[styles.targetAnchorBadgeText, hDiff.isEasy ? styles.targetAnchorTextEasy : styles.targetAnchorTextDiff]}>
                                                                                            Actual: {hDiff.isEasy ? "EASY" : "DIFFICULT"}
                                                                                        </Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={[styles.matchStatusBadge, h.isMatch ? styles.matchBadgeMatch : styles.matchBadgeMismatch]}>
                                                                                    <Text style={[styles.matchStatusBadgeText, h.isMatch ? styles.matchTextMatch : styles.matchTextMismatch]}>
                                                                                        {h.isMatch ? "✓ Match" : "✕ Mismatch"} (β = {beta >= 0 ? `+${beta.toFixed(3)}` : beta.toFixed(3)})
                                                                                    </Text>
                                                                                </View>
                                                                            </View>

                                                                            <View style={styles.hikeMathTermsGrid}>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>1. Trail {label} (T_i):</Text>
                                                                                    <Text style={styles.hikeMathTermVal}>{trailVal.toFixed(3)}</Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>2. Current Easy {label} (P):</Text>
                                                                                    <Text style={styles.hikeMathTermVal}>{curEasy.toFixed(3)}</Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>3. Gradient Difference (T_i - P):</Text>
                                                                                    <Text style={[styles.hikeMathTermVal, { color: diff >= 0 ? Palette.Green800 : Palette.Amber800 }]}>
                                                                                        {diff >= 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>4. Recommendation Score (R_tu):</Text>
                                                                                    <Text style={[styles.hikeMathTermVal, { fontWeight: "700" }]}>{h.score.toFixed(3)}</Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>5. Learning Rate (beta_i):</Text>
                                                                                    <Text style={styles.hikeMathTermVal}>
                                                                                        {h.isMatch
                                                                                            ? `+R_tu / 2 = +${h.score.toFixed(3)} / 2 = +${beta.toFixed(3)}`
                                                                                            : `-(1 - R_tu) / 2 = -(1 - ${h.score.toFixed(3)}) / 2 = ${beta.toFixed(3)}`}
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>6. Feature Weight (W_i):</Text>
                                                                                    <Text style={[styles.hikeMathTermVal, { fontWeight: "700" }]}>
                                                                                        {w.toFixed(2)} ({wLabel})
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathStepResultRow}>
                                                                                    <Text style={styles.hikeMathStepResultLabel}>{label} Delta (W_i * beta_i * (T_i - P)):</Text>
                                                                                    <Text style={[styles.hikeMathStepResultVal, { color: stepDelta >= 0 ? Palette.Green800 : Palette.Amber800 }]}>
                                                                                        {stepDelta >= 0 ? `+${stepDelta.toFixed(4)}` : stepDelta.toFixed(4)}
                                                                                    </Text>
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                    );
                                                                })}

                                                                {/* Batch Aggregation Box */}
                                                                {(() => {
                                                                    const sumEasy = easyHikes.reduce((acc, h) => {
                                                                        const tVal = getFeatureVal(h.trailFeatures, key);
                                                                        const diff = tVal - curEasy;
                                                                        const beta = h.isMatch ? h.score / 2 : -(1.0 - h.score) / 2;
                                                                        let w = typeof h.featureWeights[key] === "number" ? h.featureWeights[key] : 0.20;
                                                                        if (category === "Terrain" && tVal <= 0.05) w = 0.0;
                                                                        return acc + (w * beta * diff);
                                                                    }, 0);
                                                                    const avgEasy = easyHikes.length > 0 ? sumEasy / easyHikes.length : 0;
                                                                    const preClampEasy = curEasy + avgEasy;

                                                                    return (
                                                                        <View style={styles.anchorAggregateBox}>
                                                                            <View style={styles.anchorAggregateRow}>
                                                                                <Text style={styles.anchorAggregateKey}>Sum across {easyHikes.length} hike{easyHikes.length > 1 ? "s" : ""}:</Text>
                                                                                <Text style={styles.anchorAggregateVal}>{sumEasy >= 0 ? `+${sumEasy.toFixed(4)}` : sumEasy.toFixed(4)}</Text>
                                                                            </View>
                                                                            <View style={styles.anchorAggregateRow}>
                                                                                <Text style={styles.anchorAggregateKey}>Batched Average (Avg_Delta = Sum / N):</Text>
                                                                                <Text style={[styles.anchorAggregateVal, { fontWeight: "700" }]}>{avgEasy >= 0 ? `+${avgEasy.toFixed(4)}` : avgEasy.toFixed(4)}</Text>
                                                                            </View>
                                                                            <View style={styles.anchorAggregateRow}>
                                                                                <Text style={styles.anchorAggregateKey}>Pre-Clamp (P_current + Avg_Delta):</Text>
                                                                                <Text style={styles.anchorAggregateVal}>
                                                                                    {curEasy.toFixed(3)} {avgEasy >= 0 ? `+ ${avgEasy.toFixed(4)}` : `- ${Math.abs(avgEasy).toFixed(4)}`} = {preClampEasy.toFixed(4)}
                                                                                </Text>
                                                                            </View>
                                                                            <View style={[styles.anchorAggregateRow, { borderTopWidth: 1, borderTopColor: Palette.Slate200, paddingTop: 4, marginTop: 4 }]}>
                                                                                <Text style={[styles.anchorAggregateKey, { fontWeight: "700", color: Colors.TEXT_PRIMARY }]}>Final Updated Easy Vector:</Text>
                                                                                <Text style={[styles.anchorAggregateVal, { fontWeight: "800", color: Palette.Green800, fontSize: 13 }]}>
                                                                                    {updEasy.toFixed(3)}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                    );
                                                                })()}
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* DIFFICULT ANCHOR TRACE */}
                                                    <View style={styles.updateAnchorBoxDiff}>
                                                        <View style={styles.updateAnchorHeader}>
                                                            <Text style={styles.updateAnchorTitleDiff}>Difficult Anchor: {label}</Text>
                                                            <Text style={{ fontSize: 12, color: Palette.Amber800, fontWeight: "600" }}>
                                                                Baseline: {curDiff.toFixed(3)}
                                                            </Text>
                                                        </View>

                                                        {diffHikes.length === 0 ? (
                                                            <View style={styles.anchorNoHikesBox}>
                                                                <Text style={styles.anchorNoHikesText}>
                                                                    No hike reviews targeted the Difficult anchor this month (0 hikes).
                                                                    {"\n"}Anchor vector remains at baseline: {curDiff.toFixed(3)}
                                                                </Text>
                                                            </View>
                                                        ) : (
                                                            <View style={{ gap: 8 }}>
                                                                {diffHikes.map((h, hIdx) => {
                                                                    const trailVal = getFeatureVal(h.trailFeatures, key);
                                                                    const diff = trailVal - curDiff;
                                                                    const beta = h.isMatch ? h.score / 2 : -(1.0 - h.score) / 2;
                                                                    let w = typeof h.featureWeights[key] === "number" ? h.featureWeights[key] : 0.20;
                                                                    if (category === "Terrain" && trailVal <= 0.05) w = 0.0;
                                                                    const stepDelta = w * (beta * diff);

                                                                    const wLabel = w === 1.0
                                                                        ? "1.00 (Primary factor: tagged by user)"
                                                                        : w === 0.0
                                                                            ? "0.00 (Presence gated: unencountered terrain)"
                                                                            : "0.20 (Default baseline weight)";

                                                                    const hDiff = parsePerceivedDifficulty(h.perceivedDifficulty);

                                                                    return (
                                                                        <View key={hIdx} style={styles.hikeMathTraceCard}>
                                                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                                                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                                                    <Text style={styles.hikeMathTrailName}>{h.trailName}</Text>
                                                                                    <View style={[styles.targetAnchorBadge, h.targetAnchor === "easy" ? styles.targetAnchorEasy : styles.targetAnchorDiff]}>
                                                                                        <Text style={[styles.targetAnchorBadgeText, h.targetAnchor === "easy" ? styles.targetAnchorTextEasy : styles.targetAnchorTextDiff]}>
                                                                                            Predicted: {h.targetAnchor.toUpperCase()}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={[styles.targetAnchorBadge, hDiff.isEasy ? styles.targetAnchorEasy : styles.targetAnchorDiff]}>
                                                                                        <Text style={[styles.targetAnchorBadgeText, hDiff.isEasy ? styles.targetAnchorTextEasy : styles.targetAnchorTextDiff]}>
                                                                                            Actual: {hDiff.isEasy ? "EASY" : "DIFFICULT"}
                                                                                        </Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={[styles.matchStatusBadge, h.isMatch ? styles.matchBadgeMatch : styles.matchBadgeMismatch]}>
                                                                                    <Text style={[styles.matchStatusBadgeText, h.isMatch ? styles.matchTextMatch : styles.matchTextMismatch]}>
                                                                                        {h.isMatch ? "✓ Match" : "✕ Mismatch"} (β = {beta >= 0 ? `+${beta.toFixed(3)}` : beta.toFixed(3)})
                                                                                    </Text>
                                                                                </View>
                                                                            </View>

                                                                            <View style={styles.hikeMathTermsGrid}>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>1. Trail {label} (T_i):</Text>
                                                                                    <Text style={styles.hikeMathTermVal}>{trailVal.toFixed(3)}</Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>2. Current Difficult {label} (P):</Text>
                                                                                    <Text style={styles.hikeMathTermVal}>{curDiff.toFixed(3)}</Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>3. Gradient Difference (T_i - P):</Text>
                                                                                    <Text style={[styles.hikeMathTermVal, { color: diff >= 0 ? Palette.Green800 : Palette.Amber800 }]}>
                                                                                        {diff >= 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>4. Recommendation Score (R_tu):</Text>
                                                                                    <Text style={[styles.hikeMathTermVal, { fontWeight: "700" }]}>{h.score.toFixed(3)}</Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>5. Learning Rate (beta_i):</Text>
                                                                                    <Text style={styles.hikeMathTermVal}>
                                                                                        {h.isMatch
                                                                                            ? `+R_tu / 2 = +${h.score.toFixed(3)} / 2 = +${beta.toFixed(3)}`
                                                                                            : `-(1 - R_tu) / 2 = -(1 - ${h.score.toFixed(3)}) / 2 = ${beta.toFixed(3)}`}
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathTermRow}>
                                                                                    <Text style={styles.hikeMathTermKey}>6. Feature Weight (W_i):</Text>
                                                                                    <Text style={[styles.hikeMathTermVal, { fontWeight: "700" }]}>
                                                                                        {w.toFixed(2)} ({wLabel})
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.hikeMathStepResultRow}>
                                                                                    <Text style={styles.hikeMathStepResultLabel}>{label} Delta (W_i * beta_i * (T_i - P)):</Text>
                                                                                    <Text style={[styles.hikeMathStepResultVal, { color: stepDelta >= 0 ? Palette.Green800 : Palette.Amber800 }]}>
                                                                                        {stepDelta >= 0 ? `+${stepDelta.toFixed(4)}` : stepDelta.toFixed(4)}
                                                                                    </Text>
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                    );
                                                                })}

                                                                {/* Batch Aggregation Box */}
                                                                {(() => {
                                                                    const sumDiff = diffHikes.reduce((acc, h) => {
                                                                        const tVal = getFeatureVal(h.trailFeatures, key);
                                                                        const diff = tVal - curDiff;
                                                                        const beta = h.isMatch ? h.score / 2 : -(1.0 - h.score) / 2;
                                                                        let w = typeof h.featureWeights[key] === "number" ? h.featureWeights[key] : 0.20;
                                                                        if (category === "Terrain" && tVal <= 0.05) w = 0.0;
                                                                        return acc + (w * beta * diff);
                                                                    }, 0);
                                                                    const avgDiff = diffHikes.length > 0 ? sumDiff / diffHikes.length : 0;
                                                                    const preClampDiff = curDiff + avgDiff;
                                                                    const isMonotonicityAdjusted = ["length", "elevation", "gain", "slope", "easy", "classification"].includes(key) &&
                                                                        Math.abs(updDiff - Math.min(1.0, Math.max(0.0, preClampDiff))) > 0.001;

                                                                    return (
                                                                        <View style={styles.anchorAggregateBox}>
                                                                            <View style={styles.anchorAggregateRow}>
                                                                                <Text style={styles.anchorAggregateKey}>Sum across {diffHikes.length} hike{diffHikes.length > 1 ? "s" : ""}:</Text>
                                                                                <Text style={styles.anchorAggregateVal}>{sumDiff >= 0 ? `+${sumDiff.toFixed(4)}` : sumDiff.toFixed(4)}</Text>
                                                                            </View>
                                                                            <View style={styles.anchorAggregateRow}>
                                                                                <Text style={styles.anchorAggregateKey}>Batched Average (Avg_Delta = Sum / N):</Text>
                                                                                <Text style={[styles.anchorAggregateVal, { fontWeight: "700" }]}>{avgDiff >= 0 ? `+${avgDiff.toFixed(4)}` : avgDiff.toFixed(4)}</Text>
                                                                            </View>
                                                                            <View style={styles.anchorAggregateRow}>
                                                                                <Text style={styles.anchorAggregateKey}>Pre-Clamp (P_current + Avg_Delta):</Text>
                                                                                <Text style={styles.anchorAggregateVal}>
                                                                                    {curDiff.toFixed(3)} {avgDiff >= 0 ? `+ ${avgDiff.toFixed(4)}` : `- ${Math.abs(avgDiff).toFixed(4)}`} = {preClampDiff.toFixed(4)}
                                                                                </Text>
                                                                            </View>
                                                                            {isMonotonicityAdjusted && (
                                                                                <View style={styles.monotonicityNotice}>
                                                                                    <CustomIcon library="Feather" name="alert-circle" size={11} color={Palette.Amber800} />
                                                                                    <Text style={styles.monotonicityNoticeText}>
                                                                                        Monotonicity constraint enforced: Difficult anchor ({preClampDiff.toFixed(3)}) adjusted to {updDiff.toFixed(3)} (Easy + 0.05 separation).
                                                                                    </Text>
                                                                                </View>
                                                                            )}
                                                                            <View style={[styles.anchorAggregateRow, { borderTopWidth: 1, borderTopColor: Palette.Slate200, paddingTop: 4, marginTop: 4 }]}>
                                                                                <Text style={[styles.anchorAggregateKey, { fontWeight: "700", color: Colors.TEXT_PRIMARY }]}>Final Updated Difficult Vector:</Text>
                                                                                <Text style={[styles.anchorAggregateVal, { fontWeight: "800", color: Palette.Amber800, fontSize: 13 }]}>
                                                                                    {updDiff.toFixed(3)}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                    );
                                                                })()}
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>

                        {/* Manager Notice Footer */}
                        <View style={styles.previewNoticeBox}>
                            <CustomIcon library="Feather" name="info" size={13} color={Palette.Slate500} />
                            <Text style={styles.previewNoticeText}>
                                Manager Action: Click &quot;Update Profile &amp; Save to DB&quot; above to commit these adjusted anchor vectors directly to Firestore, or &quot;Reset to Initial&quot; to revert back to survey inputs.
                            </Text>
                        </View>
                    </View>
                )}
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
    previewBadge: {
        backgroundColor: Palette.Amber100,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    previewBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber800,
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
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    twinVectorsRow: {
        flexDirection: "row",
        gap: 12,
        flexWrap: "wrap",
    },
    vectorCardEasy: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Palette.Green50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Green200,
        padding: 10,
        gap: 8,
    },
    vectorCardDiff: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Palette.Amber50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        padding: 10,
        gap: 8,
    },
    vectorCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    vectorCardTitleEasy: {
        fontSize: 15,
        fontWeight: "700",
        color: Palette.Green800,
    },
    vectorCardTitleDiff: {
        fontSize: 15,
        fontWeight: "700",
        color: Palette.Amber800,
    },
    vectorMetricsGrid: {
        gap: 4,
    },
    vectorMetricRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 2,
    },
    vectorMetricLabel: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    vectorMetricVal: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    emptyBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: Palette.Slate50,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    emptyText: {
        fontSize: 13,
        color: Colors.TEXT_MUTED,
        flex: 1,
    },
    hikeMiniCard: {
        backgroundColor: Palette.Slate50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 10,
        gap: 4,
    },
    targetAnchorBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 3,
    },
    targetAnchorEasy: {
        backgroundColor: Palette.Green100,
    },
    targetAnchorDiff: {
        backgroundColor: Palette.Amber100,
    },
    targetAnchorBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    targetAnchorTextEasy: {
        color: Palette.Green800,
    },
    targetAnchorTextDiff: {
        color: Palette.Amber800,
    },
    matchStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 3,
    },
    matchBadgeMatch: {
        backgroundColor: Palette.Green100,
    },
    matchBadgeMismatch: {
        backgroundColor: Palette.Amber100,
    },
    matchStatusBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    matchTextMatch: {
        color: Palette.Green800,
    },
    matchTextMismatch: {
        color: Palette.Amber800,
    },
    miniFactorChip: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 3,
    },
    miniFactorChipText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Red50,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Red200,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: Palette.Red700,
    },
    computeActionBox: {
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 16,
        alignItems: "center",
        gap: 10,
    },
    computeBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    computeBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    computeHintText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        textAlign: "center",
    },
    updateSuccessBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
        borderRadius: 6,
        padding: 10,
    },
    updateSuccessText: {
        fontSize: 14,
        fontWeight: "600",
        color: Palette.Green800,
    },
    recomputeBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    recomputeBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    saveUpdatedProfileBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Palette.Green700,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    saveUpdatedProfileBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    resetProfileBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate300,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    resetProfileBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Slate700,
    },
    compareTable: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        overflow: "hidden",
    },
    compareTableHeader: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: "center",
    },
    th: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    compareTableInstructionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: Palette.Slate50,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    compareTableInstructionText: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: "600",
    },
    compareTableRow: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: Palette.Slate150,
        backgroundColor: Colors.WHITE,
    },
    compareTableRowActive: {
        backgroundColor: Palette.Slate100,
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
    },
    compareColName: {
        flex: 2,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
    },
    compareColEasy: {
        flex: 3,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
    },
    compareColDiff: {
        flex: 3,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
    },
    deltaBadgePos: {
        backgroundColor: Palette.Green100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    deltaTextPos: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
    },
    deltaBadgeNeg: {
        backgroundColor: Palette.Amber100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    deltaTextNeg: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber800,
    },
    deltaBadgeZero: {
        backgroundColor: Palette.Slate100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    deltaTextZero: {
        fontSize: 12,
        color: Palette.Slate600,
    },
    updateBreakdownCard: {
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 2,
        borderBottomColor: Palette.Slate200,
        padding: 12,
        gap: 10,
    },
    updateBreakdownHeader: {
        gap: 4,
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
    updateBreakdownTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    updateBreakdownSubtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    formulaSummaryBox: {
        backgroundColor: Palette.Slate50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 8,
        gap: 3,
    },
    formulaSummaryLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    formulaSummaryMath: {
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 12,
        color: Palette.Slate800,
        fontWeight: "600",
    },
    formulaSummaryDesc: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        lineHeight: 16,
        marginTop: 2,
    },
    updateTwinAnchorBreakdown: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    updateAnchorBoxEasy: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Palette.Green50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Green200,
        padding: 10,
        gap: 8,
    },
    updateAnchorBoxDiff: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Palette.Amber50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        padding: 10,
        gap: 8,
    },
    updateAnchorHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.06)",
        paddingBottom: 4,
    },
    updateAnchorTitleEasy: {
        fontSize: 14,
        fontWeight: "700",
        color: Palette.Green800,
    },
    updateAnchorTitleDiff: {
        fontSize: 14,
        fontWeight: "700",
        color: Palette.Amber800,
    },
    hikeMathTraceCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 8,
        gap: 6,
    },
    hikeMathTrailName: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    hikeMathTermsGrid: {
        gap: 2,
    },
    hikeMathTermRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 1,
    },
    hikeMathTermKey: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    hikeMathTermVal: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    hikeMathStepResultRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 3,
        paddingTop: 3,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate150,
    },
    hikeMathStepResultLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    hikeMathStepResultVal: {
        fontSize: 13,
        fontWeight: "800",
    },
    anchorAggregateBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 8,
        gap: 3,
        marginTop: 2,
    },
    anchorAggregateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    anchorAggregateKey: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    anchorAggregateVal: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    anchorNoHikesBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    anchorNoHikesText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        textAlign: "center",
        lineHeight: 16,
    },
    monotonicityNotice: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Amber100,
        padding: 4,
        borderRadius: 4,
        marginTop: 2,
    },
    monotonicityNoticeText: {
        fontSize: 12,
        color: Palette.Amber900,
        fontWeight: "600",
        flex: 1,
    },
    previewNoticeBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Palette.Slate50,
        borderRadius: 6,
        padding: 10,
    },
    previewNoticeText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        flex: 1,
    },
});
