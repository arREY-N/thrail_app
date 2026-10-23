/**
 * @file TrailOfTheMonthCard.tsx
 * @description Trail of the Month banner featuring a split 2-column card layout:
 * - Left column: "Trail of the month" label, large TRAIL NAME, location/match details, and action button.
 * - Right column: Full-height cover picture of the trail.
 */

import CustomIcon from "@/src/components/CustomIcon";
import CustomImage from "@/src/components/CustomImage";
import CustomText from "@/src/components/CustomText";
import { Colors, Palette } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { Recommendation } from "@/src/core/models/Recommendation/interfaces/Recommendation.types";
import { ITrail, useTrailItem } from "@/src/core/models/Trail/Trail";
import { getHeroImageSource } from "@/src/features/Trail/utils/TrailDetailsHelpers";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export interface TrailOfTheMonthCardProps {
    recommendation?: Recommendation | null;
    trails: ITrail[];
    isLoading?: boolean;
    error?: string | null;
    isNewAccount?: boolean;
    onPress: (trailId: string, monthId?: string) => void;
    onExplorePress?: () => void;
    getItemRating?: (id: string) => number;
    onDownloadPress?: (id: string) => void;
    getTrailOffersCount?: (trailId: string) => number;
}

export default function TrailOfTheMonthCard({
    recommendation,
    trails,
    isLoading = false,
    error = null,
    isNewAccount = false,
    onPress,
    onExplorePress,
    getItemRating,
    onDownloadPress,
    getTrailOffersCount,
}: TrailOfTheMonthCardProps) {
    // Top 1 recommendation item (supports easy, trails, or difficult lists)
    const topEasy = useMemo(() => {
        if (recommendation?.easy && recommendation.easy.length > 0) {
            return recommendation.easy[0];
        }
        if (recommendation?.trails && recommendation.trails.length > 0) {
            return recommendation.trails[0];
        }
        if (recommendation?.difficult && recommendation.difficult.length > 0) {
            return recommendation.difficult[0];
        }
        return null;
    }, [recommendation?.easy, recommendation?.trails, recommendation?.difficult]);

    const targetTrailId = topEasy?.id || (topEasy as any)?.trailId || "";

    // Matched ITrail object from passed trails dataset (check id and name)
    const matchedTrail = useMemo(() => {
        if (!topEasy) return null;
        const targetId = targetTrailId.trim();
        const targetName = (topEasy.trailName || "").toLowerCase().trim();

        return (
            trails.find((t) => t.id && t.id.trim() === targetId) ||
            (targetName ? trails.find((t) => (t.general?.name || "").toLowerCase().trim() === targetName) : null) ||
            null
        );
    }, [topEasy, targetTrailId, trails]);

    // If not found in the discover trails list, fetch this specific trail standalone from Firestore
    const { trail: standaloneTrail, trailLoading: isStandaloneLoading } = useTrailItem(matchedTrail ? "" : targetTrailId);

    const effectiveTrail = matchedTrail || standaloneTrail || null;

    // Synthesize display trail if still resolving or fallback
    const displayTrail: ITrail | null = useMemo(() => {
        if (effectiveTrail) return effectiveTrail;
        if (!topEasy) return null;
        return {
            id: targetTrailId,
            general: {
                name: topEasy.trailName || "Recommended Trail",
                address: "Calabarzon",
                province: ["Calabarzon"],
            },
            difficulty: {
                classification: "Minor",
                lascoRating: 3,
                length: 5,
                elevation: 500,
            },
        } as ITrail;
    }, [effectiveTrail, topEasy, targetTrailId]);

    // Profile match percentage
    const profileMatch = useMemo(() => {
        if (!topEasy) return 85;
        const score = typeof topEasy.score === "number" ? topEasy.score : 0.18;
        return Math.max(0, Math.min(100, Math.round((1.0 - score) * 100)));
    }, [topEasy]);

    // Format month label
    const formattedMonth = useMemo(() => {
        const code = recommendation?.id;
        if (code && code.includes("-")) {
            const [y, m] = code.split("-");
            const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            }
        }
        return "Spotlight";
    }, [recommendation?.id]);

    const hasRecommendations = Boolean(topEasy);
    const imageSource = displayTrail ? getHeroImageSource(displayTrail) : null;
    const trailName = displayTrail?.general?.name || topEasy?.trailName || "Mountain Trail";
    const province = displayTrail?.general?.province?.[0] || displayTrail?.general?.address || "Calabarzon";

    return (
        <View style={styles.sectionContainer}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <CustomText variant="subtitle" style={styles.sectionTitle}>
                    Trail of the Month
                </CustomText>
            </View>

            {/* Split Card Layout */}
            {isLoading || (hasRecommendations && !effectiveTrail && isStandaloneLoading) ? (
                <View style={styles.cardWrapper}>
                    <View style={styles.skeletonCard} />
                </View>
            ) : hasRecommendations && displayTrail ? (
                <View style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.splitCard}
                        activeOpacity={0.88}
                        onPress={() => onPress(displayTrail.id, recommendation?.id)}
                    >
                        {/* LEFT COLUMN: Trail info & Action */}
                        <View style={styles.leftColumn}>
                            <View style={styles.topInfoBlock}>
                                <View style={styles.badgeRow}>
                                    <View style={styles.monthBadge}>
                                        <CustomIcon library="Feather" name="star" size={12} color={Palette.Amber600} />
                                        <CustomText style={styles.monthBadgeText}>Trail of the month</CustomText>
                                    </View>
                                    <View style={styles.matchPill}>
                                        <CustomText style={styles.matchPillText}>{profileMatch}% Match</CustomText>
                                    </View>
                                </View>

                                <CustomText style={styles.trailNameTitle} numberOfLines={2}>
                                    {trailName.toUpperCase()}
                                </CustomText>

                                <View style={styles.locationRow}>
                                    <CustomIcon library="Feather" name="map-pin" size={13} color={Colors.TEXT_SECONDARY} />
                                    <CustomText style={styles.locationText} numberOfLines={1}>
                                        {province}
                                    </CustomText>
                                </View>
                            </View>

                            {/* Action Button */}
                            <View style={styles.actionRow}>
                                <View style={styles.actionButton}>
                                    <CustomText style={styles.actionButtonText}>See reasoning</CustomText>
                                    <CustomIcon library="Feather" name="arrow-right" size={13} color={Colors.WHITE} />
                                </View>
                            </View>
                        </View>

                        {/* RIGHT COLUMN: Cover picture of the trail */}
                        <View style={styles.rightColumn}>
                            <CustomImage
                                source={imageSource}
                                style={styles.coverImage}
                                contentFit="cover"
                                enableSkeleton={true}
                            />
                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.2)"]}
                                style={styles.imageOverlayGradient}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            ) : (
                /* UNLOCK / EMPTY STATE (Matches the 2-column split card structure) */
                <View style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.splitCard}
                        activeOpacity={0.88}
                        onPress={onExplorePress}
                    >
                        {/* LEFT COLUMN: Prompt & Explore Action */}
                        <View style={styles.leftColumn}>
                            <View style={styles.topInfoBlock}>
                                <View style={styles.badgeRow}>
                                    <View style={styles.monthBadge}>
                                        <CustomIcon library="Ionicons" name="sparkles" size={12} color={Palette.Amber600} />
                                        <CustomText style={styles.monthBadgeText}>TARS AI</CustomText>
                                    </View>
                                </View>

                                <CustomText style={styles.trailNameTitle} numberOfLines={2}>
                                    UNLOCK YOUR MATCH
                                </CustomText>

                                <CustomText style={styles.unlockDescText} numberOfLines={2}>
                                    Explore trails to calibrate your personalized spotlight.
                                </CustomText>
                            </View>

                            <View style={styles.actionRow}>
                                <View style={styles.actionButton}>
                                    <CustomText style={styles.actionButtonText}>Explore Trails</CustomText>
                                    <CustomIcon library="Feather" name="arrow-right" size={13} color={Colors.WHITE} />
                                </View>
                            </View>
                        </View>

                        {/* RIGHT COLUMN: Scenic Mountain Cover Placeholder */}
                        <View style={styles.rightColumn}>
                            <LinearGradient
                                colors={["#064e3b", "#065f46", "#047857"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.unlockGradientCover}
                            >
                                <CustomIcon library="Feather" name="compass" size={34} color="rgba(255,255,255,0.7)" />
                                <CustomText style={styles.unlockCoverText}>Spotlight</CustomText>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    cardWrapper: {
        paddingHorizontal: 16,
    },
    splitCard: {
        flexDirection: "row",
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        overflow: "hidden",
        minHeight: 175,
        ...GlobalStyles.dropShadow(2),
        marginVertical: 4,
    },
    leftColumn: {
        flex: 1.15,
        padding: 14,
        justifyContent: "space-between",
    },
    topInfoBlock: {
        gap: 6,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    monthBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Amber50,
        borderColor: Palette.Amber200,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
    },
    monthBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber900,
    },
    matchPill: {
        backgroundColor: Palette.Green600,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
    },
    matchPillText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    trailNameTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: Colors.TEXT_PRIMARY,
        lineHeight: 23,
        paddingBottom: 2,
        letterSpacing: 0.3,
        marginTop: 2,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    unlockDescText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    actionRow: {
        marginTop: 10,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    rightColumn: {
        flex: 0.85,
        position: "relative",
        backgroundColor: Palette.Slate900,
        minHeight: 175,
    },
    coverImage: {
        width: "100%",
        height: "100%",
    },
    imageOverlayGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    unlockGradientCover: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 12,
    },
    unlockCoverText: {
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(255,255,255,0.85)",
    },
    skeletonCard: {
        height: 175,
        backgroundColor: Palette.Slate200,
        borderRadius: 16,
        marginVertical: 4,
    },
});
