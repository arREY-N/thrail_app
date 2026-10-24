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
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

export interface TrailOfTheMonthCardProps {
    recommendation?: Recommendation | null;
    trails?: ITrail[];
    category?: 'easy' | 'difficult';
    headerTitle?: string;
    showHeaderTitle?: boolean;
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
    trails = [],
    category = 'easy',
    headerTitle,
    showHeaderTitle = true,
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
        if (category === 'difficult') {
            if (recommendation?.difficult && recommendation.difficult.length > 0) {
                return recommendation.difficult[0];
            }
            return null;
        }
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
    }, [category, recommendation?.easy, recommendation?.trails, recommendation?.difficult]);

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
    const imageSource = displayTrail ? getHeroImageSource(displayTrail) : undefined;
    const trailName = displayTrail?.general?.name || topEasy?.trailName || "Mountain Trail";

    const trailLocation = useMemo(() => {
        if (displayTrail?.general?.province && displayTrail.general.province.length > 0) {
            return displayTrail.general.province[0];
        }
        if (displayTrail?.general?.address) {
            return displayTrail.general.address;
        }
        return "";
    }, [displayTrail]);

    const trailRating = useMemo(() => {
        const customRating = displayTrail?.id && getItemRating ? getItemRating(displayTrail.id) : undefined;
        if (customRating && customRating > 0) {
            return Number(customRating).toFixed(1);
        }
        if (displayTrail?.general?.rating && displayTrail.general.rating > 0) {
            return Number(displayTrail.general.rating).toFixed(1);
        }
        return "";
    }, [displayTrail, getItemRating]);

    return (
        <View style={styles.sectionContainer}>
            {/* Spotlight Card */}
            {isLoading && !hasRecommendations ? (
                <View style={styles.cardWrapper}>
                    <View style={styles.skeletonCard} />
                </View>
            ) : hasRecommendations && displayTrail ? (
                <View style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.fullCard}
                        activeOpacity={0.88}
                        onPress={() => onPress(displayTrail.id, recommendation?.id)}
                    >
                        <View style={styles.imageContainer}>
                            {/* Background Trail Photo Cover */}
                            <CustomImage
                                source={imageSource}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />

                            {/* Gradient Overlay wrapping the texts */}
                            <LinearGradient
                                colors={["transparent", "rgba(0, 0, 0, 0.25)", `${Colors.BLACK}E6`]}
                                style={styles.gradientOverlay}
                            >
                                <View style={styles.contentContainer}>
                                    {/* Top: Section Title */}
                                    {showHeaderTitle && (
                                        <CustomText variant="caption" style={styles.cardHeaderTitle}>
                                            {headerTitle || "Your Trail of the Month"}
                                        </CustomText>
                                    )}

                                    {/* Center: Trail Name */}
                                    <CustomText variant="body" style={styles.trailNameTitle} numberOfLines={2}>
                                        {trailName}
                                    </CustomText>

                                    {/* Bottom Meta Row: Location and Rating */}
                                    <View style={styles.metaRow}>
                                        <View style={styles.metaItem}>
                                            <CustomIcon
                                                library="FontAwesome6"
                                                name="location-dot"
                                                size={12}
                                                color={Colors.YELLOW}
                                            />
                                            <CustomText variant="caption" style={styles.metaText}>
                                                {trailLocation}
                                            </CustomText>
                                        </View>

                                        <View style={styles.metaItem}>
                                            <CustomIcon
                                                library="Ionicons"
                                                name="star"
                                                size={13}
                                                color={Colors.YELLOW}
                                            />
                                            <CustomText variant="caption" style={styles.metaText}>
                                                {trailRating}
                                            </CustomText>
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </View>
            ) : (
                /* UNLOCK / EMPTY STATE */
                <View style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.fullCard}
                        activeOpacity={0.88}
                        onPress={onExplorePress}
                    >
                        <View style={styles.imageContainer}>
                            {/* Background Scenic Mountain Cover Placeholder */}
                            <LinearGradient
                                colors={["#064e3b", "#065f46", "#047857"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardImage}
                            />

                            {/* Card Content Overlay */}
                            <LinearGradient
                                colors={["transparent", "rgba(0, 0, 0, 0.25)", `${Colors.BLACK}E6`]}
                                style={styles.gradientOverlay}
                            >
                                <View style={styles.contentContainer}>
                                    {showHeaderTitle && (
                                        <CustomText variant="caption" style={styles.cardHeaderTitle}>
                                            {headerTitle || "Your Trail of the Month"}
                                        </CustomText>
                                    )}

                                    <CustomText variant="body" style={styles.trailNameTitle} numberOfLines={2}>
                                        UNLOCK YOUR MATCH
                                    </CustomText>

                                    <View style={styles.metaRow}>
                                        <View style={styles.metaItem}>
                                            <CustomIcon
                                                library="Feather"
                                                name="compass"
                                                size={13}
                                                color={Colors.YELLOW}
                                            />
                                            <CustomText variant="caption" style={styles.metaText}>
                                                Explore Trails
                                            </CustomText>
                                        </View>

                                        <View style={styles.metaItem}>
                                            <CustomIcon
                                                library="Feather"
                                                name="cpu"
                                                size={13}
                                                color={Colors.YELLOW}
                                            />
                                            <CustomText variant="caption" style={styles.metaText}>
                                                ThAReSys
                                            </CustomText>
                                        </View>
                                    </View>
                                </View>
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
        marginTop: 4,
    },
    cardWrapper: {
        paddingHorizontal: 16,
    },
    fullCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        overflow: "hidden",
        ...GlobalStyles.dropShadow(3),
        marginVertical: 4,
    },
    imageContainer: {
        height: 240,
        width: "100%",
        position: "relative",
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 16,
        overflow: "hidden",
    },
    cardImage: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.GRAY_LIGHT,
    },
    gradientOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "100%",
        justifyContent: "flex-end",
        padding: 20,
    },
    contentContainer: {
        gap: 6,
    },
    cardHeaderTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.9)",
        textAlign: "left",
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
    trailNameTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: Colors.TEXT_INVERSE,
        textAlign: "left",
        lineHeight: 32,
        letterSpacing: 0.2,
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginTop: 2,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_INVERSE,
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
    skeletonCard: {
        height: 240,
        backgroundColor: Palette.Slate200,
        borderRadius: 16,
        marginVertical: 4,
    },
});
