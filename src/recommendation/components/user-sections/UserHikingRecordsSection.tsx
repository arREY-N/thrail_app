import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Recommendation } from "@/src/core/models/Recommendation/Recommendation";
import { Review } from "@/src/core/models/Review/Review";
import { Trail } from "@/src/core/models/Trail/Trail";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserHikingRecordsSectionProps {
    userReviews: Review[];
    trails: Trail[];
    userRecommendations: Recommendation | null;
}

const parsePerceivedDifficulty = (diff?: string) => {
    if (!diff) return { label: "Unspecified", isEasy: true };
    const d = String(diff).toLowerCase();
    if (d.includes("easy") || d.includes("chill") || d.includes("beginner")) {
        return { label: "Easy", isEasy: true };
    }
    return { label: "Difficult", isEasy: false };
};

const formatReviewDate = (val: any) => {
    if (!val) return "Unknown Date";
    try {
        if (typeof val === "object" && typeof val.toDate === "function") {
            return val.toDate().toLocaleDateString();
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? "Unknown Date" : d.toLocaleDateString();
    } catch {
        return "Unknown Date";
    }
};

export default function UserHikingRecordsSection({
    userReviews,
    trails,
    userRecommendations,
}: UserHikingRecordsSectionProps) {
    const [hikeRecordFilter, setHikeRecordFilter] = useState<"all" | "known">("all");

    const knownTrailIdSet = useMemo(() => new Set(trails.map((t) => t.id)), [trails]);

    const userKnownReviews = useMemo(() => {
        return userReviews.filter((r) => {
            const tid = r.trail?.id;
            return Boolean(tid && tid !== "diy" && tid !== "diy_session" && knownTrailIdSet.has(tid));
        });
    }, [userReviews, knownTrailIdSet]);

    const displayedReviews = hikeRecordFilter === "known" ? userKnownReviews : userReviews;

    return (
        <View style={styles.container}>
            {/* Header Strip */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <CustomIcon library="Feather" name="map-pin" size={16} color={Colors.PRIMARY} />
                        <Text style={styles.title}>Hiked Trails & User Reviews</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>
                                {displayedReviews.length} / {userReviews.length}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle}>
                        Historical hike reviews submitted by this user. Reviews on known trails feed the monthly profile update batch engine.
                    </Text>
                </View>

                {/* Filter Pills: View All vs Known Trails Only */}
                <View style={styles.filterPills}>
                    <TouchableOpacity
                        style={[styles.filterPill, hikeRecordFilter === "all" && styles.filterPillActive]}
                        onPress={() => setHikeRecordFilter("all")}
                    >
                        <Text style={[styles.filterPillText, hikeRecordFilter === "all" && styles.filterPillTextActive]}>
                            All Reviews ({userReviews.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterPill, hikeRecordFilter === "known" && styles.filterPillActive]}
                        onPress={() => setHikeRecordFilter("known")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="check-circle"
                            size={12}
                            color={hikeRecordFilter === "known" ? Colors.WHITE : Palette.Green700}
                        />
                        <Text style={[styles.filterPillText, hikeRecordFilter === "known" && styles.filterPillTextActive]}>
                            Known Trails Only ({userKnownReviews.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reviews List */}
            {displayedReviews.length === 0 ? (
                <View style={styles.emptyBox}>
                    <CustomIcon library="Feather" name="info" size={20} color={Palette.Slate400} />
                    <Text style={styles.emptyText}>
                        {userReviews.length === 0
                            ? "No hike reviews recorded for this user yet."
                            : "No reviews on official known trails. (Only reviews on registered trails update the recommendation profile)."}
                    </Text>
                </View>
            ) : (
                <View style={{ gap: 12 }}>
                    {displayedReviews.map((rev, revIdx) => {
                        const tid = rev.trail?.id;
                        const isKnown = Boolean(tid && tid !== "diy" && tid !== "diy_session" && knownTrailIdSet.has(tid));
                        const matchedOfficialTrail = isKnown ? trails.find((t) => t.id === tid) : null;
                        const diffInfo = parsePerceivedDifficulty(rev.perceivedDifficulty);

                        // Check correlation with monthly recommendation if available
                        const inEasy = userRecommendations?.easy?.find((t) => t.id === tid);
                        const inDiff = userRecommendations?.difficult?.find((t) => t.id === tid);
                        const predictedCat = inDiff ? "difficult" : inEasy ? "easy" : null;
                        const recoScore = inDiff?.score ?? inEasy?.score ?? null;

                        let matchStatus: { label: string; isMatch: boolean; color: string; bg: string } | null = null;
                        if (predictedCat) {
                            const isMatch = (predictedCat === "easy" && diffInfo.isEasy) || (predictedCat === "difficult" && !diffInfo.isEasy);
                            matchStatus = {
                                label: isMatch ? "Match (Feature Boost)" : "Mismatch (Feature Debuff)",
                                isMatch,
                                color: isMatch ? Palette.Green800 : Palette.Amber800,
                                bg: isMatch ? Palette.Green100 : Palette.Amber100,
                            };
                        }

                        const factorList = rev.difficultyFactors || [];

                        return (
                            <View key={rev.id || `rev-${revIdx}`} style={styles.hikeCard}>
                                {/* Card Header */}
                                <View style={styles.hikeCardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <Text style={styles.hikeTrailName}>
                                                {rev.trail?.name || matchedOfficialTrail?.general?.name || (matchedOfficialTrail as any)?.name || "DIY Hike / Custom Route"}
                                            </Text>

                                            {/* Official Trail vs DIY Badge */}
                                            {isKnown ? (
                                                <View style={styles.knownTrailBadge}>
                                                    <CustomIcon library="Feather" name="check" size={10} color={Palette.Green800} />
                                                    <Text style={styles.knownTrailBadgeText}>Official Trail</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.diyTrailBadge}>
                                                    <Text style={styles.diyTrailBadgeText}>DIY / Custom Route</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Location & Date */}
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                <CustomIcon library="Feather" name="map-pin" size={12} color={Colors.TEXT_MUTED} />
                                                <Text style={styles.hikeMetaText}>
                                                    {rev.trail?.location || (matchedOfficialTrail as any)?.location || "Location unrecorded"}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                <CustomIcon library="Feather" name="calendar" size={12} color={Colors.TEXT_MUTED} />
                                                <Text style={styles.hikeMetaText}>
                                                    {formatReviewDate(rev.hikeDate || rev.createdAt)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Rating & Perceived Difficulty */}
                                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                            {predictedCat && (
                                                <View style={[styles.difficultyBadge, predictedCat === "easy" ? styles.diffBadgeEasy : styles.diffBadgeDiff]}>
                                                    <Text style={[styles.difficultyBadgeText, predictedCat === "easy" ? styles.diffBadgeTextEasy : styles.diffBadgeTextDiff]}>
                                                        Predicted: {predictedCat.toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={[styles.difficultyBadge, diffInfo.isEasy ? styles.diffBadgeEasy : styles.diffBadgeDiff]}>
                                                <Text style={[styles.difficultyBadgeText, diffInfo.isEasy ? styles.diffBadgeTextEasy : styles.diffBadgeTextDiff]}>
                                                    Actual: {diffInfo.isEasy ? "EASY" : "DIFFICULT"}
                                                </Text>
                                            </View>
                                        </View>
                                        {rev.overallRating > 0 && (
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                                <CustomIcon library="FontAwesome5" name="star" size={14} color="#f59e0b" />
                                                <Text style={styles.ratingText}>{rev.overallRating.toFixed(1)}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Correlation Strip (If trail was predicted by engine in recommendations) */}
                                {predictedCat && matchStatus && (
                                    <View style={[styles.correlationStrip, { backgroundColor: matchStatus.bg }]}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <CustomIcon
                                                library="Feather"
                                                name={matchStatus.isMatch ? "trending-up" : "shuffle"}
                                                size={13}
                                                color={matchStatus.color}
                                            />
                                            <Text style={[styles.correlationText, { color: matchStatus.color }]}>
                                                Engine Prediction: <Text style={{ fontWeight: "700" }}>{predictedCat.toUpperCase()}</Text> ({recoScore !== null ? `R_tu: ${recoScore.toFixed(3)}` : "Recommended"}) • {matchStatus.label}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Factor Chips */}
                                {factorList.length > 0 && (
                                    <View style={styles.factorsContainer}>
                                        <Text style={styles.factorsLabel}>Difficulty Factors Selected:</Text>
                                        <View style={styles.factorChipsRow}>
                                            {factorList.map((factor, fIdx) => (
                                                <View key={fIdx} style={styles.factorChip}>
                                                    <CustomIcon library="Feather" name="tag" size={11} color={Palette.Slate600} />
                                                    <Text style={styles.factorChipText}>{String(factor)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Hike Metrics (Distance, Duration, Elevation) if recorded */}
                                {(rev.distance > 0 || rev.elevation > 0 || rev.duration > 0) && (
                                    <View style={styles.hikeMetricsRow}>
                                        {rev.distance > 0 && (
                                            <View style={styles.hikeMetricItem}>
                                                <Text style={styles.hikeMetricVal}>{rev.distance.toFixed(1)} km</Text>
                                                <Text style={styles.hikeMetricKey}>Distance</Text>
                                            </View>
                                        )}
                                        {rev.elevation > 0 && (
                                            <View style={styles.hikeMetricItem}>
                                                <Text style={styles.hikeMetricVal}>{rev.elevation} m</Text>
                                                <Text style={styles.hikeMetricKey}>Elevation</Text>
                                            </View>
                                        )}
                                        {rev.duration > 0 && (
                                            <View style={styles.hikeMetricItem}>
                                                <Text style={styles.hikeMetricVal}>{Math.round(rev.duration / 60)} min</Text>
                                                <Text style={styles.hikeMetricKey}>Duration</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* User Review Text / Notes */}
                                {Boolean(rev.review && rev.review.trim()) && (
                                    <View style={styles.reviewTextBox}>
                                        <Text style={styles.reviewTextQuote}>“{rev.review.trim()}”</Text>
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
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    countBadge: {
        backgroundColor: Palette.Blue100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Blue800,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
        maxWidth: 600,
    },
    filterPills: {
        flexDirection: "row",
        gap: 6,
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
    },
    filterPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    filterPillTextActive: {
        color: Colors.WHITE,
    },
    emptyBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: Palette.Slate50,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    emptyText: {
        fontSize: 13,
        color: Colors.TEXT_MUTED,
        flex: 1,
    },
    hikeCard: {
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 14,
        gap: 10,
    },
    hikeCardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
    },
    hikeTrailName: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    knownTrailBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: Palette.Green100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    knownTrailBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
    },
    diyTrailBadge: {
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    diyTrailBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Slate700,
    },
    hikeMetaText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    diffBadgeEasy: {
        backgroundColor: Palette.Green100,
    },
    diffBadgeDiff: {
        backgroundColor: Palette.Amber100,
    },
    difficultyBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    diffBadgeTextEasy: {
        color: Palette.Green800,
    },
    diffBadgeTextDiff: {
        color: Palette.Amber800,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    correlationStrip: {
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    correlationText: {
        fontSize: 12,
        fontWeight: "500",
    },
    factorsContainer: {
        gap: 4,
    },
    factorsLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    factorChipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    factorChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    factorChipText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    hikeMetricsRow: {
        flexDirection: "row",
        gap: 16,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
    },
    hikeMetricItem: {
        alignItems: "flex-start",
    },
    hikeMetricVal: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    hikeMetricKey: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
    },
    reviewTextBox: {
        backgroundColor: Colors.WHITE,
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
    },
    reviewTextQuote: {
        fontSize: 12,
        fontStyle: "italic",
        color: Colors.TEXT_SECONDARY,
    },
});
