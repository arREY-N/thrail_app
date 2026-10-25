import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { IRecommendedTrailItem, Recommendation } from "@/src/core/models/Recommendation/Recommendation";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface UserRecommendationsSectionProps {
    user: User;
    userProfiles: UserProfiles;
    trails: Trail[];
    userRecommendations: Recommendation | null;
    isLoadingRecos?: boolean;
    recoError?: string | null;
    recoMonth: string;
    onRefreshRecos?: () => void;
    onRunEnginePress?: () => void;
    isSaved?: boolean;
    totalUserCount?: number;
}

export default function UserRecommendationsSection({
    user,
    userProfiles,
    trails,
    userRecommendations,
    isLoadingRecos = false,
    recoError = null,
    recoMonth,
    onRefreshRecos,
    onRunEnginePress,
    isSaved = true,
    totalUserCount,
}: UserRecommendationsSectionProps) {
    const [recoCategoryTab, setRecoCategoryTab] = useState<"all" | "easy" | "difficult">("all");
    const [recoSearchQuery, setRecoSearchQuery] = useState<string>("");
    const [expandedRecoId, setExpandedRecoId] = useState<string | null>(null);

    const modalEasyTrails = useMemo(() => userRecommendations?.easy || [], [userRecommendations]);
    const modalDifficultTrails = useMemo(() => userRecommendations?.difficult || [], [userRecommendations]);

    const displayedModalTrails = useMemo(() => {
        let list: IRecommendedTrailItem[] = [];
        if (recoCategoryTab === "easy") {
            list = modalEasyTrails;
        } else if (recoCategoryTab === "difficult") {
            list = modalDifficultTrails;
        } else {
            list = [...modalEasyTrails, ...modalDifficultTrails];
        }

        if (recoSearchQuery.trim().length > 0) {
            const q = recoSearchQuery.toLowerCase();
            list = list.filter((t) => t.trailName.toLowerCase().includes(q));
        }
        return list;
    }, [modalEasyTrails, modalDifficultTrails, recoCategoryTab, recoSearchQuery]);

    const trailProfilesMap = useMemo(() => {
        const map = new Map<string, Profile>();
        for (const t of trails) {
            if (t.profile) {
                map.set(t.id, t.profile);
            }
        }
        return map;
    }, [trails]);

    const getScoreBadgeColor = (score: number) => {
        if (score <= 0.3) {
            return { bg: Palette.Green50, border: Palette.Green200, text: Palette.Green800, label: "Top Match" };
        }
        if (score <= 0.55) {
            return { bg: Palette.Amber50, border: Palette.Amber200, text: Palette.Amber800, label: "Moderate" };
        }
        return { bg: Palette.Slate100, border: Palette.Slate200, text: Palette.Slate700, label: "Lower Match" };
    };

    const getFormulaFullName = (code?: string) => {
        switch (code) {
            case "GD":
                return "Gower's Distance (GD)";
            case "ED":
                return "Normalized Euclidean (ED)";
            case "CS":
                return "Cosine Distance (CS)";
            default:
                return code || "Gower's Distance (GD)";
        }
    };

    const getRawCbfFormula = (code?: string) => {
        switch (code) {
            case "GD":
                return "dist = (1 / 28) * sum(|Anchor[i] - Trail[i]|)";
            case "ED":
                return "dist = sqrt( (1 / 28) * sum((Anchor[i] - Trail[i])^2) )";
            case "CS":
                return "dist = 1.0 - ( (Anchor · Trail) / (norm(Anchor) * norm(Trail)) )";
            default:
                return "dist = (1 / 28) * sum(|Anchor[i] - Trail[i]|)";
        }
    };

    const getRawCbfExplanation = (code?: string) => {
        switch (code) {
            case "GD":
                return "Computes normalized absolute difference |Anchor[i] - Trail[i]| for each of 28 feature dimensions, then averages them across all features.";
            case "ED":
                return "Calculates squared difference across 28 feature dimensions, divides by 28, and takes the square root (normalized distance in [0.0, 1.0]).";
            case "CS":
                return "Measures angular divergence by computing 1.0 - (dot product / (norm(Anchor) * norm(Trail))), evaluating directional alignment across 28 features.";
            default:
                return "Computes normalized feature distance across all 28 dimensions.";
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Strip */}
            <View style={styles.recoSectionHeader}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <CustomIcon library="Feather" name="compass" size={16} color={Colors.PRIMARY} />
                        <Text style={styles.recoSectionTitle}>Monthly Recommended Trails</Text>
                        <View style={styles.recoMonthBadge}>
                            <Text style={styles.recoMonthBadgeText}>{recoMonth}</Text>
                        </View>
                    </View>
                    <Text style={styles.recoMetaSubText}>
                        {userRecommendations?.engineConfig
                            ? `Engine: CBF (${userRecommendations.engineConfig.cbf}) + CF (${userRecommendations.engineConfig.cf}) • alpha = ${userRecommendations.engineConfig.alpha}`
                            : "Stored in /users/{userId}/recommendations/" + recoMonth}
                    </Text>
                </View>

                {onRefreshRecos && (
                    <TouchableOpacity
                        style={styles.recoRefreshBtn}
                        onPress={onRefreshRecos}
                        disabled={isLoadingRecos}
                    >
                        <CustomIcon
                            library="Feather"
                            name="rotate-cw"
                            size={12}
                            color={isLoadingRecos ? Colors.GRAY : Colors.PRIMARY}
                        />
                        <Text style={styles.recoRefreshBtnText}>
                            {isLoadingRecos ? "Loading..." : "Refresh"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Selector & Search Controls */}
            <View style={styles.recoControlsRow}>
                <View style={styles.recoCategoryPills}>
                    <TouchableOpacity
                        style={[styles.recoPill, recoCategoryTab === "all" && styles.recoPillActive]}
                        onPress={() => setRecoCategoryTab("all")}
                    >
                        <Text style={[styles.recoPillText, recoCategoryTab === "all" && styles.recoPillTextActive]}>
                            All ({modalEasyTrails.length + modalDifficultTrails.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.recoPill, recoCategoryTab === "easy" && styles.recoPillActiveEasy]}
                        onPress={() => setRecoCategoryTab("easy")}
                    >
                        <Text style={[styles.recoPillText, recoCategoryTab === "easy" && styles.recoPillTextActiveEasy]}>
                            Easy ({modalEasyTrails.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.recoPill, recoCategoryTab === "difficult" && styles.recoPillActiveDiff]}
                        onPress={() => setRecoCategoryTab("difficult")}
                    >
                        <Text style={[styles.recoPillText, recoCategoryTab === "difficult" && styles.recoPillTextActiveDiff]}>
                            Difficult ({modalDifficultTrails.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.recoSearchRow}>
                    <CustomIcon library="Feather" name="search" size={13} color={Colors.TEXT_SECONDARY} />
                    <TextInput
                        style={styles.recoSearchInput}
                        placeholder="Filter recommended trails..."
                        placeholderTextColor={Colors.TEXT_SECONDARY}
                        value={recoSearchQuery}
                        onChangeText={setRecoSearchQuery}
                    />
                    {recoSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setRecoSearchQuery("")}>
                            <CustomIcon library="Feather" name="x" size={12} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Recommendations Content State */}
            {isLoadingRecos ? (
                <View style={styles.recoCenterBox}>
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    <Text style={styles.recoLoadingText}>
                        Loading recommendations for {recoMonth}...
                    </Text>
                </View>
            ) : recoError ? (
                <View style={styles.recoErrorBox}>
                    <CustomIcon library="Feather" name="alert-triangle" size={24} color={Palette.Red700} />
                    <Text style={styles.recoErrorTitle}>Firestore Permission / Access Blocked</Text>
                    <Text style={styles.recoErrorDesc}>{recoError}</Text>
                    <Text style={styles.recoErrorHint}>
                        Deploy the updated firestore.rules to Firebase to grant Superadmin read access across all users' recommendation subcollections.
                    </Text>
                </View>
            ) : !userRecommendations || (modalEasyTrails.length === 0 && modalDifficultTrails.length === 0) ? (
                <View style={styles.recoEmptyBox}>
                    <CustomIcon library="Feather" name="inbox" size={32} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.recoEmptyTitle}>
                        No Recommendations for {recoMonth}
                    </Text>
                    <Text style={styles.recoEmptyDesc}>
                        {isSaved
                            ? "This user has a saved profile in Firestore, but recommendations haven't been run yet for this month."
                            : "Save this user's profile to Firestore first, then run the engine to generate recommendations."}
                    </Text>
                    {onRunEnginePress && (
                        <TouchableOpacity
                            style={styles.recoRunNowBtn}
                            onPress={onRunEnginePress}
                        >
                            <CustomIcon library="Feather" name="play" size={13} color={Colors.WHITE} />
                            <Text style={styles.recoRunNowText}>Run Engine Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : displayedModalTrails.length === 0 ? (
                <View style={styles.recoEmptyBox}>
                    <CustomIcon library="Feather" name="search" size={24} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.recoEmptyTitle}>No Trails Match Filter</Text>
                    <Text style={styles.recoEmptyDesc}>
                        Try adjusting your search query or switching categories.
                    </Text>
                </View>
            ) : (
                <View style={styles.recoGrid}>
                    {displayedModalTrails.map((trail, idx) => {
                        const badgeColor = getScoreBadgeColor(trail.score);
                        const isEasy = trail.category === "easy";
                        const cardKey = `${trail.category}-${trail.id}-${idx}`;
                        const isExpanded = expandedRecoId === cardKey;

                        const alpha = userRecommendations?.engineConfig?.alpha ?? 1.0;
                        const cbfCode = userRecommendations?.engineConfig?.cbf ?? "GD";
                        const cfCode = userRecommendations?.engineConfig?.cf ?? "GD";

                        const cbfValue = trail.cbfScore != null
                            ? trail.cbfScore
                            : (alpha === 1.0 ? trail.score : trail.score / Math.max(alpha, 0.001));
                        const cfValue = trail.cfScore != null
                            ? trail.cfScore
                            : 0.0;

                        const cbfWeighted = alpha * cbfValue;
                        const cfWeighted = (1.0 - alpha) * cfValue;

                        const candidateTrail = trails.find((t) => t.id === trail.id);
                        const candidateProfile = trailProfilesMap.get(trail.id) || candidateTrail?.profile;
                        const candidateFeats = candidateProfile?.features;
                        const targetAnchorFeats = isEasy ? userProfiles.easy.features : userProfiles.difficult.features;
                        const userCount = userRecommendations?.engineConfig?.userCount ?? (totalUserCount ?? 1);

                        return (
                            <View key={cardKey} style={[styles.recoCard, isExpanded && styles.recoCardExpanded]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setExpandedRecoId(isExpanded ? null : cardKey)}
                                    style={styles.recoCardClickable}
                                >
                                    <View style={styles.recoCardTop}>
                                        <View style={styles.recoRankBox}>
                                            <Text style={styles.recoRankNum}>#{idx + 1}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.recoTrailTitle} numberOfLines={1}>
                                                {trail.trailName}
                                            </Text>
                                            <Text style={styles.recoTrailIdText}>ID: {trail.id}</Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.recoCategoryTag,
                                                isEasy ? styles.tagEasy : styles.tagDiff,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.recoCategoryTagText,
                                                    isEasy ? styles.tagTextEasy : styles.tagTextDiff,
                                                ]}
                                            >
                                                {isEasy ? "Easy Set" : "Difficult Set"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.recoCardBottom}>
                                        <View
                                            style={[
                                                styles.recoScoreBadge,
                                                {
                                                    backgroundColor: badgeColor.bg,
                                                    borderColor: badgeColor.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.recoScoreText,
                                                    { color: badgeColor.text },
                                                ]}
                                            >
                                                Score: {trail.score.toFixed(4)}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.recoQualityChip,
                                                    { backgroundColor: badgeColor.border },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.recoQualityChipText,
                                                        { color: badgeColor.text },
                                                    ]}
                                                >
                                                    {badgeColor.label}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                            <View
                                                style={[
                                                    styles.recoHikeTag,
                                                    trail.haveHiked ? styles.tagHiked : styles.tagUnhiked,
                                                ]}
                                            >
                                                <CustomIcon
                                                    library="Feather"
                                                    name={trail.haveHiked ? "check-circle" : "clock"}
                                                    size={11}
                                                    color={trail.haveHiked ? Palette.Green700 : Palette.Slate600}
                                                />
                                                <Text
                                                    style={[
                                                        styles.recoHikeTagText,
                                                        trail.haveHiked ? styles.tagHikedText : styles.tagUnhikedText,
                                                    ]}
                                                >
                                                    {trail.haveHiked ? "Completed Hike" : "Not Yet Hiked"}
                                                </Text>
                                            </View>

                                            <View style={styles.recoExpandHint}>
                                                <Text style={styles.recoExpandHintText}>
                                                    {isExpanded ? "Hide calculation" : "Calculation breakdown"}
                                                </Text>
                                                <CustomIcon
                                                    library="Feather"
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={13}
                                                    color={Colors.PRIMARY}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* Expanded Score Calculation Breakdown Card */}
                                {isExpanded && (
                                    <View style={styles.recoBreakdownCard}>
                                        {/* Formula Definition Header */}
                                        <View style={styles.recoBreakdownTop}>
                                            <CustomIcon library="Feather" name="activity" size={14} color={Colors.PRIMARY} />
                                            <Text style={styles.recoBreakdownHeading}>
                                                THARESYS Hybrid Scoring Formula & Transparency Breakdown
                                            </Text>
                                        </View>
                                        <Text style={styles.recoFormulaCode}>
                                            Score = (alpha * CBF) + ((1 - alpha) * CF)
                                        </Text>

                                        {/* Metric & Weight Metadata Strip */}
                                        <View style={styles.recoConfigStrip}>
                                            <View style={styles.recoConfigItem}>
                                                <Text style={styles.recoConfigKey}>CBF Formula:</Text>
                                                <Text style={styles.recoConfigVal}>{getFormulaFullName(cbfCode)}</Text>
                                            </View>
                                            <View style={styles.recoConfigItem}>
                                                <Text style={styles.recoConfigKey}>CF Formula:</Text>
                                                <Text style={styles.recoConfigVal}>{getFormulaFullName(cfCode)}</Text>
                                            </View>
                                            <View style={styles.recoConfigItem}>
                                                <Text style={styles.recoConfigKey}>Alpha Weight:</Text>
                                                <Text style={[styles.recoConfigVal, { color: Colors.PRIMARY, fontWeight: "700" }]}>
                                                    {alpha.toFixed(3)} ({Math.round(alpha * 100)}% CBF / {Math.round((1 - alpha) * 100)}% CF)
                                                </Text>
                                            </View>
                                            <View style={styles.recoConfigItem}>
                                                <Text style={styles.recoConfigKey}>Dynamic Alpha Formula:</Text>
                                                <Text style={styles.recoConfigVal}>
                                                    1.0 - (0.5 * ({userCount} - 1) / 49) = {alpha.toFixed(3)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Two-Component Calculation Grid */}
                                        <View style={styles.recoCompGrid}>
                                            {/* CBF Box */}
                                            <View style={styles.recoCompBoxCbf}>
                                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                                    <Text style={styles.recoCompTitleCbf}>1. Content-Based (CBF)</Text>
                                                    <Text style={styles.recoCompWeightText}>{Math.round(alpha * 100)}% Weight</Text>
                                                </View>

                                                {/* Raw Metric Formula Display */}
                                                <View style={styles.recoRawFormulaRow}>
                                                    <Text style={styles.recoRawFormulaLabel}>Raw Metric Formula ({cbfCode}):</Text>
                                                    <Text style={styles.recoRawFormulaCode}>{getRawCbfFormula(cbfCode)}</Text>
                                                </View>

                                                <Text style={styles.recoCompDesc}>
                                                    {getRawCbfExplanation(cbfCode)}
                                                </Text>

                                                {/* Individual Feature Comparison Table */}
                                                {candidateFeats && targetAnchorFeats ? (
                                                    <View style={styles.recoFeatTable}>
                                                        <View style={styles.recoFeatHeaderRow}>
                                                            <Text style={[styles.recoFeatTh, { flex: 2 }]}>Key Feature</Text>
                                                            <Text style={[styles.recoFeatTh, { flex: 1.5, textAlign: "center" }]}>User Anchor</Text>
                                                            <Text style={[styles.recoFeatTh, { flex: 1.5, textAlign: "center" }]}>Trail Vector</Text>
                                                            <Text style={[styles.recoFeatTh, { flex: 1.2, textAlign: "right" }]}>|Diff|</Text>
                                                        </View>
                                                        {[
                                                            {
                                                                label: "Length",
                                                                anchor: targetAnchorFeats.length,
                                                                trailVal: candidateFeats.length,
                                                                rawTrail: candidateTrail?.difficulty?.length != null ? `${candidateTrail.difficulty.length} km` : undefined,
                                                            },
                                                            {
                                                                label: "Elevation",
                                                                anchor: targetAnchorFeats.elevation,
                                                                trailVal: candidateFeats.elevation,
                                                                rawTrail: candidateTrail?.difficulty?.elevation != null ? `${candidateTrail.difficulty.elevation} MASL` : undefined,
                                                            },
                                                            {
                                                                label: "Gain",
                                                                anchor: targetAnchorFeats.gain,
                                                                trailVal: candidateFeats.gain,
                                                                rawTrail: candidateTrail?.difficulty?.gain != null ? `+${candidateTrail.difficulty.gain} m` : undefined,
                                                            },
                                                            {
                                                                label: "Slope",
                                                                anchor: targetAnchorFeats.slope,
                                                                trailVal: candidateFeats.slope,
                                                                rawTrail: candidateTrail?.difficulty?.slope != null ? `${candidateTrail.difficulty.slope}%` : undefined,
                                                            },
                                                            {
                                                                label: "Classification",
                                                                anchor: targetAnchorFeats.classification,
                                                                trailVal: candidateFeats.classification,
                                                                rawTrail: candidateFeats.classification === 1 ? "Major" : "Minor",
                                                            },
                                                            {
                                                                label: "Lasco / Easy",
                                                                anchor: targetAnchorFeats.easy,
                                                                trailVal: candidateFeats.easy,
                                                            },
                                                        ].map((fItem, fIdx) => {
                                                            const diff = Math.abs(fItem.anchor - fItem.trailVal);
                                                            const isClose = diff <= 0.08;
                                                            return (
                                                                <View key={fIdx} style={styles.recoFeatRow}>
                                                                    <View style={{ flex: 2 }}>
                                                                        <Text style={styles.recoFeatTdName}>{fItem.label}</Text>
                                                                        {fItem.rawTrail && (
                                                                            <Text style={styles.recoFeatTdSub}>{fItem.rawTrail}</Text>
                                                                        )}
                                                                    </View>
                                                                    <Text style={[styles.recoFeatTdVal, { flex: 1.5, textAlign: "center", color: Palette.Green700 }]}>
                                                                        {fItem.anchor.toFixed(3)}
                                                                    </Text>
                                                                    <Text style={[styles.recoFeatTdVal, { flex: 1.5, textAlign: "center", color: Palette.Slate700 }]}>
                                                                        {fItem.trailVal.toFixed(3)}
                                                                    </Text>
                                                                    <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                                                                        <View style={[styles.recoFeatDiffBadge, { backgroundColor: isClose ? Palette.Green50 : Palette.Amber50, borderColor: isClose ? Palette.Green200 : Palette.Amber200 }]}>
                                                                            <Text style={[styles.recoFeatDiffText, { color: isClose ? Palette.Green800 : Palette.Amber800 }]}>
                                                                                {diff.toFixed(3)}
                                                                            </Text>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                ) : null}

                                                <View style={styles.recoCompMathRow}>
                                                    <Text style={styles.recoCompMathLabel}>Aggregate Across All 28 Features:</Text>
                                                    <Text style={styles.recoCompMathVal}>{cbfValue.toFixed(4)}</Text>
                                                </View>
                                                <View style={styles.recoCompMathRow}>
                                                    <Text style={styles.recoCompMathLabel}>Weighted Term (alpha * Raw_CBF):</Text>
                                                    <Text style={[styles.recoCompMathVal, { color: Palette.Green800, fontWeight: "700" }]}>
                                                        {alpha.toFixed(2)} * {cbfValue.toFixed(4)} = {cbfWeighted.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* CF Box */}
                                            <View style={styles.recoCompBoxCf}>
                                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                                    <Text style={styles.recoCompTitleCf}>2. Collaborative (CF)</Text>
                                                    <Text style={styles.recoCompWeightText}>{Math.round((1 - alpha) * 100)}% Weight</Text>
                                                </View>

                                                {/* Raw Metric Formula Display */}
                                                <View style={styles.recoRawFormulaRow}>
                                                    <Text style={styles.recoRawFormulaLabel}>Raw Metric Formula ({cfCode}):</Text>
                                                    <Text style={styles.recoRawFormulaCode}>
                                                        dist = (1 / |Peers|) * sum( dist(User_A, Peer_B) * dist(Peer_B, Trail_T) )
                                                    </Text>
                                                </View>

                                                <Text style={styles.recoCompDesc}>
                                                    Evaluates similarity between this user and each peer hiker B who reviewed or completed trails, multiplied by the peer's affinity for Trail T.
                                                </Text>

                                                {cfValue === 0.0 ? (
                                                    <View style={styles.recoColdStartNotice}>
                                                        <CustomIcon library="Feather" name="info" size={13} color={Colors.PRIMARY} />
                                                        <Text style={styles.recoColdStartText}>
                                                            Cold-Start Active: 0 completed hike records on file for this user. Collaborative distance defaults to 0.0000, and dynamic alpha = 1.0 assigns 100% decision power to CBF feature matching.
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.recoColdStartNotice}>
                                                        <CustomIcon library="Feather" name="check-circle" size={13} color={Palette.Green700} />
                                                        <Text style={[styles.recoColdStartText, { color: Palette.Green800 }]}>
                                                            Active Peer Collaborative History: Calculated across active peer hikers who reviewed or hiked trails in common.
                                                        </Text>
                                                    </View>
                                                )}

                                                <View style={styles.recoCompMathRow}>
                                                    <Text style={styles.recoCompMathLabel}>Raw CF Distance:</Text>
                                                    <Text style={styles.recoCompMathVal}>{cfValue.toFixed(4)}</Text>
                                                </View>
                                                <View style={styles.recoCompMathRow}>
                                                    <Text style={styles.recoCompMathLabel}>Weighted Term ((1 - alpha) * Raw_CF):</Text>
                                                    <Text style={[styles.recoCompMathVal, { color: Palette.Amber800, fontWeight: "700" }]}>
                                                        {(1.0 - alpha).toFixed(2)} * {cfValue.toFixed(4)} = {cfWeighted.toFixed(4)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Synthesis Summary */}
                                        <View style={styles.recoSynthesisBox}>
                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                                                <Text style={styles.recoSynthesisLabel}>
                                                    Final Blended Recommendation Score (R_tu):
                                                </Text>
                                                <Text style={styles.recoSynthesisFormula}>
                                                    {cbfWeighted.toFixed(4)} (CBF) + {cfWeighted.toFixed(4)} (CF) = {trail.score.toFixed(4)}
                                                </Text>
                                            </View>
                                            <Text style={styles.recoSynthesisDesc}>
                                                Calculation: ({alpha.toFixed(2)} * {cbfValue.toFixed(4)}) + ({(1.0 - alpha).toFixed(2)} * {cfValue.toFixed(4)}) = {cbfWeighted.toFixed(4)} + {cfWeighted.toFixed(4)} = {trail.score.toFixed(4)}.
                                                {"\n"}Range is [0.000, 1.000], where 0.000 represents the closest mathematical match to the user's hiking profile.
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    recoSectionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingBottom: 14,
    },
    recoSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    recoMonthBadge: {
        backgroundColor: Palette.Green100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recoMonthBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
    },
    recoMetaSubText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    recoRefreshBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recoRefreshBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    recoControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
    },
    recoCategoryPills: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderRadius: 6,
        padding: 3,
        gap: 4,
    },
    recoPill: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    recoPillActive: {
        backgroundColor: Colors.WHITE,
    },
    recoPillActiveEasy: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green300,
    },
    recoPillActiveDiff: {
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber300,
    },
    recoPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    recoPillTextActive: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: "700",
    },
    recoPillTextActiveEasy: {
        color: Palette.Green800,
        fontWeight: "700",
    },
    recoPillTextActiveDiff: {
        color: Palette.Amber800,
        fontWeight: "700",
    },
    recoSearchRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
    },
    recoSearchInput: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },
    recoCenterBox: {
        padding: 30,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    recoLoadingText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    recoErrorBox: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Palette.Red50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Red200,
        gap: 6,
    },
    recoErrorTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Palette.Red800,
        marginTop: 4,
    },
    recoErrorDesc: {
        fontSize: 12,
        color: Palette.Red700,
        textAlign: "center",
        fontFamily: "monospace",
    },
    recoErrorHint: {
        fontSize: 12,
        color: Palette.Red900,
        textAlign: "center",
        marginTop: 4,
        fontWeight: "600",
    },
    recoEmptyBox: {
        padding: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 6,
    },
    recoEmptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
    },
    recoEmptyDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
    recoRunNowBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 6,
    },
    recoRunNowText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    recoGrid: {
        gap: 8,
    },
    recoCard: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        padding: 10,
        gap: 8,
    },
    recoCardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    recoRankBox: {
        backgroundColor: Palette.Slate100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recoRankNum: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    recoTrailTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    recoTrailIdText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    recoCategoryTag: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    tagEasy: {
        backgroundColor: Palette.Green100,
    },
    tagDiff: {
        backgroundColor: Palette.Amber100,
    },
    recoCategoryTagText: {
        fontSize: 12,
        fontWeight: "700",
    },
    tagTextEasy: {
        color: Palette.Green800,
    },
    tagTextDiff: {
        color: Palette.Amber800,
    },
    recoCardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate100,
        flexWrap: "wrap",
        gap: 6,
    },
    recoScoreBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recoScoreText: {
        fontSize: 12,
        fontWeight: "700",
        fontFamily: "monospace",
    },
    recoQualityChip: {
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    recoQualityChipText: {
        fontSize: 12,
        fontWeight: "700",
    },
    recoHikeTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    tagHiked: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    tagUnhiked: {
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    recoHikeTagText: {
        fontSize: 12,
        fontWeight: "600",
    },
    tagHikedText: {
        color: Palette.Green800,
    },
    tagUnhikedText: {
        color: Palette.Slate600,
    },
    recoCardExpanded: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Palette.Slate50,
    },
    recoCardClickable: {
        gap: 8,
    },
    recoExpandHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: Palette.Slate100,
    },
    recoExpandHintText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    recoBreakdownCard: {
        marginTop: 6,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
        gap: 8,
    },
    recoBreakdownTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    recoBreakdownHeading: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    recoFormulaCode: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
        fontFamily: "monospace",
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    recoConfigStrip: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        backgroundColor: Colors.WHITE,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 8,
    },
    recoConfigItem: {
        gap: 2,
    },
    recoConfigKey: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    recoConfigVal: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    recoCompGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    recoCompBoxCbf: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Green200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
    },
    recoCompBoxCf: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
    },
    recoCompTitleCbf: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
        textTransform: "uppercase",
    },
    recoCompTitleCf: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber800,
        textTransform: "uppercase",
    },
    recoCompWeightText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    recoCompDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        marginVertical: 2,
    },
    recoCompMathRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: Palette.Slate100,
        paddingTop: 4,
        marginTop: 2,
    },
    recoCompMathLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    recoCompMathVal: {
        fontSize: 12,
        fontFamily: "monospace",
        color: Colors.TEXT_PRIMARY,
    },
    recoSynthesisBox: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
    },
    recoSynthesisLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    recoSynthesisFormula: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
        fontFamily: "monospace",
    },
    recoSynthesisDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    recoRawFormulaRow: {
        backgroundColor: Palette.Slate50,
        padding: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        marginVertical: 4,
        gap: 2,
    },
    recoRawFormulaLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    recoRawFormulaCode: {
        fontSize: 12,
        fontWeight: "700",
        fontFamily: "monospace",
        color: Colors.PRIMARY,
    },
    recoFeatTable: {
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        overflow: "hidden",
        marginTop: 6,
        marginBottom: 6,
        backgroundColor: Colors.WHITE,
    },
    recoFeatHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        alignItems: "center",
    },
    recoFeatTh: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    recoFeatRow: {
        flexDirection: "row",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate100,
        alignItems: "center",
    },
    recoFeatTdName: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    recoFeatTdSub: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    recoFeatTdVal: {
        fontSize: 12,
        fontFamily: "monospace",
        fontWeight: "600",
    },
    recoFeatDiffBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 1,
    },
    recoFeatDiffText: {
        fontSize: 12,
        fontWeight: "700",
        fontFamily: "monospace",
    },
    recoColdStartNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        padding: 6,
        marginVertical: 4,
    },
    recoColdStartText: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
});
