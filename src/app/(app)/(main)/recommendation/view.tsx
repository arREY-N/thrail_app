/**
 * @file view.tsx
 * @description Recommendation Reasoning & Trail Spotlight Screen.
 * Shows detailed trail information, THARESYS Profile Match metrics, and Gemini AI reasoning.
 *
 * Constraints:
 * - Minimum font size is 12pt across all text elements.
 * - Strictly uses "Profile Match" / "Profile Similarity" (never "compatibility").
 * - Actions: "Book Guide" and "View Full Trail Details" (no "Save to Wishlist").
 */

import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomImage from "@/src/components/CustomImage";
import CustomText from "@/src/components/CustomText";
import ResponsiveScrollView from "@/src/components/ResponsiveScrollView";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors, Palette } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useOfferList, useOfferTrails } from "@/src/core/models/Offer/Offer";
import {
    IAITrailReasoning,
    IRecommendedTrailItem,
    useRecommendationItem,
} from "@/src/core/models/Recommendation/Recommendation";
import { useTrailItem } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";
import TrailOfTheMonthCard from "@/src/features/Home/components/TrailOfTheMonthCard";
import { resolveRecommendationReasoning } from "@/src/features/Recommendation/services/geminiRecommendationService";
import {
    getHeroImageSource
} from "@/src/features/Trail/utils/TrailDetailsHelpers";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { safeParseDateString } from "@/src/utils/dateFormatter";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface RunnerUpRecommendationCardProps {
    item: IRecommendedTrailItem & { rank: number };
    onPress: (trailId: string) => void;
}

function RunnerUpRecommendationCard({ item, onPress }: RunnerUpRecommendationCardProps) {
    const { trail } = useTrailItem(item.id);
    const imageSource = getHeroImageSource(trail);
    const trailName = trail?.general?.name || item.trailName || "Mountain Trail";
    const location = trail?.general?.province?.[0] || trail?.general?.address || "Calabarzon";
    const score = typeof item.score === "number" ? item.score : 0.18;
    const scorePercent = Math.max(0, Math.min(100, Math.round((1.0 - score) * 100)));

    return (
        <TouchableOpacity
            style={styles.runnerUpCard}
            activeOpacity={0.85}
            onPress={() => onPress(item.id)}
        >
            <View style={styles.runnerUpImageWrapper}>
                <CustomImage
                    source={imageSource}
                    style={styles.runnerUpImage}
                    resizeMode="cover"
                />
                <View style={styles.runnerUpRankBadge}>
                    <CustomText style={styles.runnerUpRankText}>#{item.rank}</CustomText>
                </View>
            </View>

            <View style={styles.runnerUpContent}>
                {/* Top Row: Trail Name & Score */}
                <View style={styles.runnerUpRow}>
                    <CustomText style={styles.runnerUpName} numberOfLines={1}>
                        {trailName}
                    </CustomText>
                    <CustomText style={styles.runnerUpScoreText}>
                        {scorePercent}%
                    </CustomText>
                </View>

                {/* Bottom Row: Location & Chevron */}
                <View style={styles.runnerUpRow}>
                    <View style={styles.runnerUpLocationWrapper}>
                        <CustomIcon
                            library="Feather"
                            name="map-pin"
                            size={13}
                            color={Colors.PRIMARY}
                        />
                        <CustomText style={styles.runnerUpLocationText} numberOfLines={1}>
                            {location}
                        </CustomText>
                    </View>
                    <CustomIcon
                        library="FontAwesome6"
                        name="chevron-right"
                        size={15}
                        color={Palette.Neutral950}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function RecommendationViewScreen() {
    const { trailId, month } = useLocalSearchParams();
    const tId = (Array.isArray(trailId) ? trailId[0] : trailId) as string;
    const monthId = (Array.isArray(month) ? month[0] : month) as string | undefined;

    const { onBackPress, onTrailPress } = useAppNavigation();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;
    const { profile: user, } = useAuthHook();
    const { trail, trailLoading: isTrailLoading } = useTrailItem(tId);
    const { recommendation } = useRecommendationItem();
    const { offers } = useOfferList();
    const { trailOffers } = useOfferTrails(tId);

    // Check if there are available offers for this trail that are not expired and have at least 1 week before the hike
    const hasBookableOffers = useMemo(() => {
        if (!tId) return false;
        const candidateOffers = (trailOffers && trailOffers.length > 0)
            ? trailOffers
            : (offers || []).filter((o) => (o.trail?.id === tId || (o as any).trailId === tId));

        if (!candidateOffers || candidateOffers.length === 0) return false;

        const nowMidnight = new Date();
        nowMidnight.setHours(0, 0, 0, 0);

        const minHikeDate = new Date(nowMidnight.getTime());
        minHikeDate.setDate(minHikeDate.getDate() + 7);

        return candidateOffers.some((o) => {
            if (!o?.date) return false;
            if (o.status === "cancelled" || o.status === "inactive") return false;

            const offerDate = safeParseDateString(o.date);
            offerDate.setHours(0, 0, 0, 0);

            // Must not be expired AND must have at least 7 days (1 week) before the hike
            const isAtLeastOneWeekAhead = offerDate.getTime() >= minHikeDate.getTime();
            if (!isAtLeastOneWeekAhead) return false;

            // Ensure available slots if pax limits exist
            if (typeof o.maxPax === "number" && typeof o.reservedPax === "number") {
                if (o.reservedPax >= o.maxPax) return false;
            }

            return true;
        });
    }, [tId, trailOffers, offers]);

    const [aiReasoning, setAiReasoning] = useState<IAITrailReasoning | null>(null);
    const [isAiLoading, setIsAiLoading] = useState<boolean>(true);

    // Format month label
    const formattedMonth = useMemo(() => {
        const code = monthId || recommendation?.id;
        if (code && code.includes("-")) {
            const [y, m] = code.split("-");
            const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            }
        }
        return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }, [monthId, recommendation?.id]);

    // Whether all recommendations are in Challenge mode because no easy trails were found
    const isChallengeOnlyMode = useMemo(() => {
        const hasEasy = recommendation?.easy && recommendation.easy.length > 0;
        const hasTrails = recommendation?.trails && recommendation.trails.length > 0;
        const hasDiff = recommendation?.difficult && recommendation.difficult.length > 0;
        return !hasEasy && !hasTrails && hasDiff;
    }, [recommendation]);

    // Available recommendation list ordered by rank
    const recoList = useMemo(() => {
        if (recommendation?.easy && recommendation.easy.length > 0) {
            return recommendation.easy;
        }
        if (recommendation?.trails && recommendation.trails.length > 0) {
            return recommendation.trails;
        }
        if (recommendation?.difficult && recommendation.difficult.length > 0) {
            // Nearest difficult trail to the easy profile is prioritized first
            return [...recommendation.difficult].sort((a, b) => {
                const aDist = typeof a.easyScore === "number" ? a.easyScore : a.score;
                const bDist = typeof b.easyScore === "number" ? b.easyScore : b.score;
                return aDist - bDist;
            });
        }
        return [];
    }, [recommendation]);

    // Find recommendation item for this trail
    const recoItem = useMemo(() => {
        if (recoList.length === 0) return null;
        return recoList.find((item) => item.id === tId) || recoList[0] || null;
    }, [recoList, tId]);

    const isChallengeSpotlight = useMemo(() => {
        return isChallengeOnlyMode || recoItem?.category === "difficult" || Boolean(recoItem?.isChallengeOfMonth);
    }, [isChallengeOnlyMode, recoItem]);

    // Top 2 and 3 recommendations (rank 2 and rank 3)
    const runnerUpRecommendations = useMemo(() => {
        if (!recoList || recoList.length < 2) return [];
        return recoList.slice(1, 3).map((item, idx) => ({
            ...item,
            rank: idx + 2,
        }));
    }, [recoList]);

    // Profile match percentage
    const profileMatch = useMemo(() => {
        if (!recoItem) return 85;
        const score = typeof recoItem.score === "number" ? recoItem.score : 0.18;
        return Math.max(0, Math.min(100, Math.round((1.0 - score) * 100)));
    }, [recoItem]);

    // Hiker calibrated easy anchor baselines & comparisons
    const baselineMetrics = useMemo(() => {
        const easyFeatures = recommendation?.profile?.easy?.features;
        const baseLenNorm = easyFeatures?.length ?? 0.25;
        const userBaseKm = Math.round((1.0 + baseLenNorm * 19.0) * 10) / 10;

        const baseGainNorm = easyFeatures?.gain ?? 0.22;
        const userBaseGain = Math.round(50 + baseGainNorm * 1150);

        const baseSlopeNorm = easyFeatures?.slope ?? 0.25;
        const userBaseSlope = Math.round((4.0 + baseSlopeNorm * 24.0) * 10) / 10;

        const rawLen = trail?.difficulty?.length ?? 0;
        const rawGain = trail?.difficulty?.gain ?? 0;
        const rawSlope = trail?.difficulty?.slope ?? 0;

        const lenDelta = Math.round((rawLen - userBaseKm) * 10) / 10;
        const gainDelta = Math.round(rawGain - userBaseGain);
        const slopeDelta = Math.round((rawSlope - userBaseSlope) * 10) / 10;

        return {
            userBaseKm,
            userBaseGain,
            userBaseSlope,
            rawLen,
            rawGain,
            rawSlope,
            lenDelta,
            gainDelta,
            slopeDelta,
        };
    }, [recommendation?.profile?.easy, trail?.difficulty]);

    // Resolve recommendation reasoning (from Firestore pre-generated by Python THARESYS engine, or local algorithmic fallback)
    useEffect(() => {
        if (!tId) return;

        // If trail is still loading from remote, wait for it
        if (!trail && isTrailLoading) return;

        const cached = recommendation?.aiReasonings?.[tId] || null;
        const reasoning = resolveRecommendationReasoning({
            trail: trail || null,
            userProfile: recommendation?.profile?.easy || null,
            recoItem,
            user,
            monthLabel: formattedMonth,
            cachedReasoning: cached,
        });

        setAiReasoning(reasoning);
        setIsAiLoading(false);
    }, [tId, trail, recoItem, recommendation, formattedMonth, user, isTrailLoading]);

    const handleBookGuide = () => {
        router.push({
            pathname: "/offer/list" as any,
            params: { trailId: tId },
        });
    };

    const imageSource = getHeroImageSource(trail);
    const trailName = trail?.general?.name || recoItem?.trailName || "Mt. Daraitan";
    const province = trail?.general?.province?.[0] || trail?.general?.address || "Rizal";
    const distanceStr = trail?.difficulty?.length ? `${trail.difficulty.length} km` : "8.0 km";
    const elevStr = trail?.geography?.masl
        ? `${trail.geography.masl} masl`
        : trail?.difficulty?.elevation
            ? `${trail.difficulty.elevation} m`
            : "739 masl";
    const gainStr = trail?.difficulty?.gain ? `+${trail.difficulty.gain} m` : "+600 m";
    const slopeStr = trail?.difficulty?.slope ? `${trail.difficulty.slope}%` : "15%";
    const cbfScore = recoItem?.cbfScore ? `${((1 - recoItem.cbfScore) * 100).toFixed(2)}%` : "--";
    const cfScore = recoItem?.cfScore ? `${((1 - recoItem.cfScore) * 100).toFixed(2)}%` : "--";

    if (isTrailLoading && !trail && !recoItem) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title={isChallengeSpotlight ? "Challenge of the Month" : "Trail of the Month"}
                    showBackButton={true}
                    onBackPress={onBackPress}
                    centerTitle={true}
                />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                    <CustomText style={styles.loadingText}>Loading trail insights...</CustomText>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title={isChallengeSpotlight ? "Challenge of the Month" : "Trail of the Month"}
                showBackButton={true}
                onBackPress={onBackPress}
                centerTitle={true}
            />

            <ResponsiveScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header & Cover Image */}
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
                            <View style={styles.heroBadgeRow}>
                                <View style={styles.monthBadge}>
                                    <CustomIcon
                                        library="Feather"
                                        name={isChallengeSpotlight ? "award" : "star"}
                                        size={13}
                                        color={Palette.Amber600}
                                    />
                                    <CustomText style={styles.monthBadgeText}>
                                        {isChallengeSpotlight ? `Challenge • ${formattedMonth}` : formattedMonth}
                                    </CustomText>
                                </View>

                                <View style={styles.matchPill}>
                                    <CustomIcon library="Feather" name="check-circle" size={13} color={Colors.WHITE} />
                                    <CustomText style={styles.matchPillText}>{profileMatch}% Profile Match</CustomText>
                                </View>
                            </View>

                            <CustomText variant="body" style={styles.trailNameTitle} numberOfLines={2}>
                                {trailName}
                            </CustomText>

                            <View style={styles.heroLocationRow}>
                                <CustomIcon library="Feather" name="map-pin" size={14} color={Colors.WHITE} />
                                <CustomText variant="caption" style={styles.metaText}>{province}</CustomText>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Main Body - responsive container matching HomeScreen width */}
                <View style={[styles.mainBody, isWideScreen && styles.mainBodyWide]}>
                    {/* Key Specs Bar */}
                    <View style={styles.specsCard}>
                        <View style={styles.specItem}>
                            <CustomIcon library="Feather" name="navigation" size={16} color={Colors.PRIMARY} />
                            <CustomText style={styles.specItemLabel}>Distance</CustomText>
                            <CustomText style={styles.specItemVal}>{distanceStr}</CustomText>
                        </View>

                        <View style={styles.specDivider} />

                        <View style={styles.specItem}>
                            <CustomIcon library="Feather" name="trending-up" size={16} color={Colors.PRIMARY} />
                            <CustomText style={styles.specItemLabel}>Peak</CustomText>
                            <CustomText style={styles.specItemVal}>{elevStr}</CustomText>
                        </View>

                        <View style={styles.specDivider} />

                        <View style={styles.specItem}>
                            <CustomIcon library="Feather" name="bar-chart-2" size={16} color={Colors.PRIMARY} />
                            <CustomText style={styles.specItemLabel}>Gain</CustomText>
                            <CustomText style={styles.specItemVal}>{gainStr}</CustomText>
                        </View>

                        <View style={styles.specDivider} />

                        <View style={styles.specItem}>
                            <CustomIcon library="Feather" name="percent" size={16} color={Colors.PRIMARY} />
                            <CustomText style={styles.specItemLabel}>Gradient</CustomText>
                            <CustomText style={styles.specItemVal}>{slopeStr}</CustomText>
                        </View>
                    </View>

                    {/* No Easy Trails - Challenge Notice Banner */}
                    {isChallengeOnlyMode && (
                        <View style={styles.challengeNoticeBox}>
                            <View style={styles.challengeNoticeHeader}>
                                <View style={styles.challengeNoticeIconWrap}>
                                    <CustomIcon library="Feather" name="alert-triangle" size={15} color="#92400E" />
                                </View>
                                <CustomText style={styles.challengeNoticeTitle}>
                                    Challenge Spotlight Notice
                                </CustomText>
                            </View>
                            <CustomText style={styles.challengeNoticeBody}>
                                None of the trails in our current catalog are predicted to be easy for your physical baseline. Instead of forcing a demanding trail as an easy one, we are featuring the nearest accessible challenge trail to your profile as your Challenge of the Month. Please review the physical requirements and prepare thoroughly before hiking.
                            </CustomText>
                        </View>
                    )}

                    {/* THARESYS Profile Alignment Scoreboard */}
                    <View style={styles.scoreboardCard}>
                        <View style={styles.scoreboardHeader}>
                            <View style={styles.iconCircle}>
                                <CustomIcon library="Feather" name="cpu" size={16} color={Colors.PRIMARY} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomText style={styles.scoreboardTitle}>THARESYS Profile Alignment</CustomText>
                                <CustomText style={styles.scoreboardSub}>
                                    {isChallengeOnlyMode
                                        ? "Evaluated as the nearest accessible challenge to your Easy Anchor"
                                        : "Evaluated against your calibrated Easy Anchor vector"}
                                </CustomText>
                            </View>
                            <View style={styles.similarityScoreBox}>
                                <CustomText style={styles.similarityScoreNum}>{profileMatch}%</CustomText>
                                <CustomText style={styles.similarityScoreLabel}>Match</CustomText>
                            </View>
                        </View>

                        <View style={styles.scoreRow}>
                            <View style={styles.scoreMetric}>
                                <CustomText style={styles.metricLabel}>Profile Match</CustomText>
                                <CustomText style={styles.metricVal}>
                                    {cbfScore}
                                </CustomText>
                            </View>

                            <View style={styles.scoreMetric}>
                                <CustomText style={styles.metricLabel}>Peer Similarities</CustomText>
                                <CustomText style={styles.metricVal}>
                                    {cfScore}
                                </CustomText>
                            </View>
                        </View>
                    </View>

                    {/* AI Reasoning Section (Gemini AI Coach) */}
                    <View style={styles.aiReasoningCard}>
                        <View style={styles.aiHeader}>
                            <View style={styles.aiSparkleBox}>
                                <CustomIcon library="Ionicons" name="sparkles" size={16} color={Palette.Amber600} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomText style={styles.aiTitle}>Why THARESYS Recommended This</CustomText>
                                <CustomText style={styles.aiSubtitle}>
                                    {aiReasoning?.source === "gemini" ? "Powered by Gemini AI" : "THARESYS Mountaineering Analysis"}
                                </CustomText>
                            </View>
                            {aiReasoning?.source === "gemini" && (
                                <View style={styles.aiBadge}>
                                    <CustomText style={styles.aiBadgeText}>Gemini AI</CustomText>
                                </View>
                            )}
                        </View>

                        {isAiLoading ? (
                            <View style={styles.aiLoadingBox}>
                                <ActivityIndicator size="small" color={Palette.Amber600} />
                                <CustomText style={styles.aiLoadingText}>
                                    Synthesizing personalized AI recommendation insights...
                                </CustomText>
                            </View>
                        ) : (
                            <View style={styles.aiBodyBox}>
                                {/* Executive Summary */}
                                <CustomText style={styles.aiNarrativeText}>
                                    {aiReasoning?.summary ||
                                        `Based on your calibrated average length of ${baselineMetrics.userBaseKm} km, ${trailName} (${distanceStr}) is an ideal profile match for ${formattedMonth}. Its ascent (${gainStr}) and gradient (${slopeStr}) sit comfortably within your cardiovascular comfort zone.`}
                                </CustomText>

                                {/* Numerical Profile Baseline vs. Trail Demands */}
                                <View style={styles.benchmarkCard}>
                                    <View style={styles.benchmarkHeader}>
                                        <View style={styles.benchmarkHeaderLeft}>
                                            <CustomIcon library="Feather" name="bar-chart-2" size={13} color={Palette.Slate700} />
                                            <CustomText style={styles.benchmarkHeaderTitle}>Numerical Fit vs. Your Baseline</CustomText>
                                        </View>
                                        <View style={styles.benchmarkPill}>
                                            <CustomText style={styles.benchmarkPillText}>Calibrated Metrics</CustomText>
                                        </View>
                                    </View>

                                    <View style={styles.benchmarkGrid}>
                                        {/* 3 Column Headers */}
                                        <View style={styles.benchmarkColHeaderRow}>
                                            <View style={styles.benchmarkColA}>
                                                <CustomText style={[styles.benchmarkColHeaderLabel, { textAlign: "center" }]}>
                                                    Metric
                                                </CustomText>
                                            </View>
                                            <View style={styles.benchmarkColB}>
                                                <CustomText style={[styles.benchmarkColHeaderLabel, { textAlign: "center" }]}>
                                                    Your Profile
                                                </CustomText>
                                            </View>
                                            <View style={styles.benchmarkColC}>
                                                <CustomText style={[styles.benchmarkColHeaderLabel, { textAlign: "center" }]} numberOfLines={2}>
                                                    {trailName}
                                                </CustomText>
                                            </View>
                                        </View>

                                        {/* Row 1: Length / Distance */}
                                        <View style={styles.benchmarkRow}>
                                            <View style={styles.benchmarkColA}>
                                                <CustomText style={styles.benchmarkMetricLabel}>Length</CustomText>
                                            </View>

                                            <View style={styles.benchmarkColB}>
                                                <CustomText style={styles.benchmarkProfileVal}>
                                                    {baselineMetrics.userBaseKm} km
                                                </CustomText>
                                            </View>

                                            <View style={styles.benchmarkColC}>
                                                <CustomText style={styles.benchmarkTrailVal}>{distanceStr}</CustomText>
                                            </View>
                                        </View>

                                        <View style={styles.benchmarkDivider} />

                                        {/* Row 2: Elevation Gain */}
                                        <View style={styles.benchmarkRow}>
                                            <View style={styles.benchmarkColA}>
                                                <CustomText style={styles.benchmarkMetricLabel}>Elevation Gain</CustomText>
                                            </View>

                                            <View style={styles.benchmarkColB}>
                                                <CustomText style={styles.benchmarkProfileVal}>
                                                    +{baselineMetrics.userBaseGain} m
                                                </CustomText>
                                            </View>

                                            <View style={styles.benchmarkColC}>
                                                <CustomText style={styles.benchmarkTrailVal}>{gainStr}</CustomText>
                                            </View>
                                        </View>

                                        <View style={styles.benchmarkDivider} />

                                        {/* Row 3: Gradient / Slope */}
                                        <View style={styles.benchmarkRow}>
                                            <View style={styles.benchmarkColA}>
                                                <CustomText style={styles.benchmarkMetricLabel}>Gradient</CustomText>
                                            </View>

                                            <View style={styles.benchmarkColB}>
                                                <CustomText style={styles.benchmarkProfileVal}>
                                                    ~{baselineMetrics.userBaseSlope}%
                                                </CustomText>
                                            </View>

                                            <View style={styles.benchmarkColC}>
                                                <CustomText style={styles.benchmarkTrailVal}>{slopeStr}</CustomText>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Dimension 1: Physical Dimension Fit */}
                                {aiReasoning?.physicalFit && (
                                    <View style={styles.aiSectionBox}>
                                        <View style={styles.aiSectionHeader}>
                                            <CustomIcon library="Feather" name="activity" size={14} color={Palette.Green700} />
                                            <CustomText style={styles.aiSectionTitle}>Physical Dimension Fit</CustomText>
                                        </View>
                                        <CustomText style={styles.aiSectionBody}>{aiReasoning.physicalFit}</CustomText>
                                    </View>
                                )}

                                {/* Dimension 2: Terrain & Route Alignment */}
                                {aiReasoning?.terrainFit && (
                                    <View style={styles.aiSectionBox}>
                                        <View style={styles.aiSectionHeader}>
                                            <CustomIcon library="Feather" name="compass" size={14} color={Palette.Green700} />
                                            <CustomText style={styles.aiSectionTitle}>Terrain & Route Alignment</CustomText>
                                        </View>
                                        <CustomText style={styles.aiSectionBody}>{aiReasoning.terrainFit}</CustomText>
                                    </View>
                                )}

                                {/* Dimension 3: Regional & Province Match */}
                                {aiReasoning?.provinceFit && (
                                    <View style={styles.aiSectionBox}>
                                        <View style={styles.aiSectionHeader}>
                                            <CustomIcon library="Feather" name="map-pin" size={14} color={Palette.Green700} />
                                            <CustomText style={styles.aiSectionTitle}>Regional & Province Match</CustomText>
                                        </View>
                                        <CustomText style={styles.aiSectionBody}>{aiReasoning.provinceFit}</CustomText>
                                    </View>
                                )}

                                {/* Dimension 4: Safety & Trail Tips */}
                                {aiReasoning?.safetyTips && (
                                    <View style={styles.safetyBox}>
                                        <View style={styles.safetyHeader}>
                                            <CustomIcon library="Feather" name="shield" size={14} color={Palette.Slate700} />
                                            <CustomText style={styles.safetyTitle}>Practical Trail Insights & Safety</CustomText>
                                        </View>
                                        <CustomText style={styles.safetyBody}>{aiReasoning.safetyTips}</CustomText>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Call to Action Card(s) */}
                    <View style={styles.actionGrid}>
                        {/* Column 1: Browse Offers (same primary design; with offers: prompt + button; without offers: centered text, no button) */}
                        <TouchableOpacity
                            style={[
                                styles.actionCard,
                                styles.actionCardPrimary,
                                !hasBookableOffers && styles.actionCardCentered,
                            ]}
                            activeOpacity={hasBookableOffers ? 0.85 : 1}
                            onPress={hasBookableOffers ? handleBookGuide : undefined}
                            disabled={!hasBookableOffers}
                        >
                            {hasBookableOffers ? (
                                <>
                                    <CustomText style={styles.actionPromptPrimary}>
                                        Ready to explore this trail recommendation?
                                    </CustomText>
                                    <View style={styles.actionFooter}>
                                        <CustomText style={styles.actionLabelPrimary} numberOfLines={1}>
                                            Browse Offers
                                        </CustomText>
                                        <View style={styles.actionCircleWhite}>
                                            <CustomIcon
                                                library="FontAwesome6"
                                                name="chevron-right"
                                                size={16}
                                                color={Palette.Neutral950}
                                            />
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <CustomText style={[styles.actionPromptPrimaryCentered, { fontWeight: '700' }]}>
                                    More offers coming soon!
                                </CustomText>
                            )}
                        </TouchableOpacity>

                        {/* Column 2: View trail */}
                        <TouchableOpacity
                            style={[styles.actionCard, styles.actionCardSecondary]}
                            activeOpacity={0.85}
                            onPress={() => onTrailPress(tId)}
                        >
                            <CustomText style={styles.actionPromptSecondary}>
                                Want to read more about the trail?
                            </CustomText>
                            <View style={styles.actionFooter}>
                                <CustomText style={styles.actionLabelSecondary} numberOfLines={1}>
                                    View trail
                                </CustomText>
                                <View style={styles.actionCirclePrimary}>
                                    <CustomIcon
                                        library="FontAwesome6"
                                        name="chevron-right"
                                        size={16}
                                        color={Colors.WHITE}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Recommendation Advisory & Safety Warning Box */}
                    <View style={styles.warningBox}>
                        <View style={styles.warningHeader}>
                            <View style={styles.warningIconContainer}>
                                <CustomIcon
                                    library="Feather"
                                    name="alert-triangle"
                                    size={16}
                                    color="#D97706"
                                />
                            </View>
                            <CustomText style={styles.warningTitle}>
                                Advisory & Safety Caution
                            </CustomText>
                        </View>
                        <View style={styles.warningContent}>
                            <CustomText style={styles.warningBody}>
                                All trail recommendations are based on the profile survey you have answered upon sign up and your recorded hiking activity within the application. As this approach is only based on your recorded experiences, the more trails you hike with us, the better our recommendations will be.
                            </CustomText>
                        </View>
                    </View>

                    {/* Top 2 and 3 Trail Recommendations Section */}
                    {runnerUpRecommendations.length > 0 && (
                        <View style={styles.runnerUpSection}>
                            <CustomText style={styles.runnerUpSectionTitle}>
                                Other Recommendations
                            </CustomText>

                            <View style={styles.runnerUpCardsList}>
                                {runnerUpRecommendations.map((item) => (
                                    <RunnerUpRecommendationCard
                                        key={item.id}
                                        item={item}
                                        onPress={onTrailPress}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Challenging Recommendation Section (Difficult Profile) */}
                    {recommendation?.difficult && recommendation.difficult.length > 0 && (
                        <View style={styles.challengingSection}>
                            <CustomText style={styles.challengingSectionTitle}>
                                Challenge of the Month
                            </CustomText>

                            {/* Challenge Advisory & Safety Caution */}
                            <View style={styles.warningBox}>
                                <View style={styles.warningHeader}>
                                    <View style={styles.warningIconContainer}>
                                        <CustomIcon
                                            library="Feather"
                                            name="alert-triangle"
                                            size={16}
                                            color="#D97706"
                                        />
                                    </View>
                                    <CustomText style={styles.warningTitle}>
                                        Challenge Advisory & Safety Caution
                                    </CustomText>
                                </View>
                                <View style={styles.warningContent}>
                                    <CustomText style={styles.warningBody}>
                                        The &quot;Challenge of the Month&quot; simply represents the most difficult trail that we&apos;ve calculated based on your profile and the available trail sets. It is not an invitation, especially if you are a beginner.
                                    </CustomText>
                                    <CustomText style={styles.warningBody}>
                                        For everyone&apos;s safety, we suggest staying on easy trails on your 1st to 3rd hikes to help us calibrate more your profile safely.
                                        Whether easy or not, hiking these trail without proper preparation and sufficient experience may cause injuries or accidents. As always, please proceed with caution.
                                    </CustomText>
                                    <CustomText style={styles.warningBody}>
                                        As always, please proceed with caution.
                                    </CustomText>
                                </View>
                            </View>

                            <TrailOfTheMonthCard
                                recommendation={recommendation}
                                category="difficult"
                                showHeaderTitle={false}
                                onPress={(trailId) => onTrailPress(trailId)}
                                onExplorePress={() => {
                                    const diffTrail = recommendation.difficult[0];
                                    if (diffTrail?.id) onTrailPress(diffTrail.id);
                                }}
                            />
                        </View>
                    )}
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 36,
        gap: 16,
    },
    mainBody: {
        width: "100%",
        gap: 16,
    },
    mainBodyWide: {
        maxWidth: 860,
        width: "100%",
        alignSelf: "center",
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
    },
    loadingText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    imageContainer: {
        height: 260,
        width: "100%",
        position: "relative",
        backgroundColor: Colors.GRAY_LIGHT,
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
        padding: 16,
    },
    contentContainer: {
        gap: 6,
    },
    heroBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    monthBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 12,
    },
    monthBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
    },
    matchPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: Palette.Green600,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    matchPillText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    trailNameTitle: {
        fontSize: 24,
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
    heroLocationRow: {
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
    specsCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    specItem: {
        flex: 1,
        alignItems: "center",
        gap: 3,
    },
    specItemLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    specItemVal: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    specDivider: {
        width: 1,
        height: 28,
        backgroundColor: Palette.Slate200,
    },
    scoreboardCard: {
        marginHorizontal: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 12,
    },
    scoreboardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
        alignItems: "center",
        justifyContent: "center",
    },
    scoreboardTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    scoreboardSub: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    similarityScoreBox: {
        alignItems: "flex-end",
    },
    similarityScoreNum: {
        fontSize: 18,
        fontWeight: "800",
        color: Colors.PRIMARY,
    },
    similarityScoreLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    scoreRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Palette.Slate50,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    scoreMetric: {
        flex: 1,
        alignItems: "center",
        gap: 2,
    },
    metricLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
    metricVal: {
        fontSize: 13,
        fontWeight: "700",
        fontFamily: "monospace",
        color: Colors.TEXT_PRIMARY,
    },
    aiReasoningCard: {
        marginHorizontal: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 12,
    },
    aiHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    aiSparkleBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber100,
        alignItems: "center",
        justifyContent: "center",
    },
    aiTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    aiSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    aiBadge: {
        backgroundColor: Palette.Amber100,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    aiBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber900,
    },
    regenerateBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Amber100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Amber300,
    },
    regenerateBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber900,
    },
    refreshIconBtn: {
        padding: 5,
        borderRadius: 6,
        backgroundColor: Palette.Amber100,
        borderWidth: 1,
        borderColor: Palette.Amber200,
    },
    aiLoadingBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 16,
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    aiLoadingText: {
        fontSize: 12,
        color: Palette.Slate700,
        flex: 1,
    },
    aiBodyBox: {
        gap: 14,
    },
    aiNarrativeText: {
        fontSize: 13,
        color: Palette.Slate800,
        lineHeight: 19,
        fontWeight: "500",
    },
    benchmarkCard: {
        gap: 10,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
    },
    benchmarkHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    benchmarkHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    benchmarkHeaderTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
    },
    benchmarkPill: {
        backgroundColor: Palette.Slate100,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    benchmarkPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Slate700,
    },
    benchmarkGrid: {
        gap: 8,
    },
    benchmarkColHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        marginBottom: 2,
    },
    benchmarkColHeaderLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate700,
    },
    benchmarkRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 2,
    },
    benchmarkColA: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    benchmarkColB: {
        flex: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    benchmarkColC: {
        flex: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    benchmarkMetricLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
        textAlign: "center",
    },
    benchmarkProfileVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate800,
        textAlign: "center",
    },
    benchmarkTrailVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
        textAlign: "center",
    },
    benchmarkDivider: {
        height: 1,
        backgroundColor: Palette.Slate200,
    },
    aiSectionBox: {
        gap: 4,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
    },
    aiSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    aiSectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
    },
    aiSectionBody: {
        fontSize: 12,
        color: Palette.Slate700,
        lineHeight: 18,
    },
    safetyBox: {
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
        marginTop: 4,
    },
    safetyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    safetyTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
    },
    safetyBody: {
        fontSize: 12,
        color: Palette.Slate700,
        lineHeight: 17,
    },
    actionGrid: {
        flexDirection: "row",
        marginHorizontal: 16,
        gap: 12,
        marginTop: 4,
    },
    actionCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        minHeight: 160,
        justifyContent: "space-between",
    },
    actionCardPrimary: {
        backgroundColor: Colors.PRIMARY,
    },
    actionCardSecondary: {
        backgroundColor: "#F4F5F5",
    },
    actionCardCentered: {
        justifyContent: "center",
        alignItems: "center",
    },
    actionPromptPrimaryCentered: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.WHITE,
        lineHeight: 20,
        textAlign: "center",
    },
    actionPromptPrimary: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.WHITE,
        lineHeight: 20,
        textAlign: "left",
    },
    actionPromptSecondary: {
        fontSize: 14,
        fontWeight: "500",
        color: Palette.Neutral950,
        lineHeight: 20,
        textAlign: "left",
    },
    actionFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    actionLabelPrimary: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    actionLabelSecondary: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        color: Palette.Neutral950,
    },
    actionCircleWhite: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.WHITE,
        alignItems: "center",
        justifyContent: "center",
    },
    actionCirclePrimary: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.PRIMARY,
        alignItems: "center",
        justifyContent: "center",
    },
    runnerUpSection: {
        marginHorizontal: 16,
        gap: 12,
        marginTop: 12,
    },
    runnerUpSectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: Palette.Neutral950,
        letterSpacing: -0.3,
    },
    runnerUpCardsList: {
        gap: 12,
    },
    runnerUpCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F4F5F5",
        borderRadius: 14,
        padding: 12,
        gap: 14,
    },
    runnerUpImageWrapper: {
        width: 72,
        height: 72,
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        backgroundColor: Palette.Slate300,
    },
    runnerUpImage: {
        width: "100%",
        height: "100%",
    },
    runnerUpRankBadge: {
        position: "absolute",
        top: 4,
        left: 4,
        backgroundColor: "rgba(15, 23, 42, 0.82)",
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 5,
    },
    runnerUpRankText: {
        fontSize: 12,
        fontWeight: "800",
        color: Colors.WHITE,
    },
    runnerUpContent: {
        flex: 1,
        justifyContent: "space-between",
        height: 56,
    },
    runnerUpRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    runnerUpName: {
        flex: 1,
        fontSize: 16,
        fontWeight: "800",
        color: Palette.Neutral950,
    },
    runnerUpScoreText: {
        fontSize: 16,
        fontWeight: "800",
        color: Colors.PRIMARY,
        textAlign: "right",
    },
    runnerUpLocationWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    runnerUpLocationText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "400",
        color: Palette.Slate600,
    },
    challengingSection: {
        gap: 12,
        marginTop: 12,
    },
    challengingSectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: Palette.Neutral950,
        letterSpacing: -0.3,
        marginHorizontal: 16,
    },
    warningBox: {
        marginHorizontal: 16,
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 12,
        padding: 14,
        gap: 10,
        marginTop: 12,
    },
    warningHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    warningIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
    },
    warningTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#92400E",
    },
    warningContent: {
        gap: 8,
    },
    warningBody: {
        fontSize: 12,
        fontWeight: "500",
        color: "#B45309",
        lineHeight: 18,
    },
    challengeNoticeBox: {
        marginHorizontal: 16,
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 12,
        padding: 14,
        gap: 8,
        marginTop: 12,
    },
    challengeNoticeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    challengeNoticeIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
    },
    challengeNoticeTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#92400E",
    },
    challengeNoticeBody: {
        fontSize: 12,
        fontWeight: "500",
        color: "#B45309",
        lineHeight: 18,
    },
});
