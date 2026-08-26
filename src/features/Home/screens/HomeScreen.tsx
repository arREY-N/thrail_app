/**
 * @file HomeScreen.tsx
 * @description The main presentation screen for the Home tab, featuring weather, recommendations, discover feed, and active hike offers.
 */

import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import MountainCard from '@/src/components/MountainCard';
import MountainCardSkeleton from '@/src/components/MountainCardSkeleton';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

import WeatherSection from '@/src/features/Home/components/WeatherSection';

import { IOffer } from '@/src/core/models/Offer/interfaces/Offer.types';
import { ITrail } from '@/src/core/models/Trail/interfaces/Trail.types';
import { fetchTrailWeatherBadges, TrailWeatherBadge } from "@/src/core/utility/weatherHelpers";

/**
 * Props for the HomeScreen component.
 * 
 * @param onWeatherPress - Callback when the weather section is pressed.
 * @param onSeeMoreRecommendationsPress - Callback to view all recommended trails.
 * @param onSeeMoreDiscoverPress - Callback to view all discover trails.
 * @param onSeeMoreOffersPress - Callback to view all trails with offers.
 * @param recommendedTrails - Array of recommended trails.
 * @param discoverTrails - Array of discover trails.
 * @param trailsWithOffers - Array of trails that have upcoming active offers.
 * @param isOffersLoading - Loading state for the offers list.
 * @param onMountainPress - Callback when a specific mountain or trail card is pressed.
 * @param onDownloadPress - Callback to download offline trail data for a mountain.
 * @param onGroupPress - Callback when the group FAB is pressed.
 * @param getItemRating - Function returning the numerical review rating for a given trail ID.
 * @param isLoading - Global loading state.
 * @param offers - Array of active hike offers.
 * @param recommendationsError - Error message when recommendations fetch fails.
 * @param isRecommendationsLoading - Loading state for the recommendations list.
 * @param isNewAccount - Flag indicating if the logged-in user is a cold-start new account.
 * @param discoverError - Error message when discover trails fetch fails.
 * @param isRefreshing - Active pull-to-refresh state boolean.
 * @param onRefreshPress - Callback triggered when user performs a pull-to-refresh gesture.
 */
export interface HomeScreenProps {
    onWeatherPress: () => void;
    onSeeMoreRecommendationsPress: () => void;
    onSeeMoreDiscoverPress: () => void;
    onSeeMoreOffersPress: () => void;
    recommendedTrails: ITrail[];
    discoverTrails: ITrail[];
    trailsWithOffers: ITrail[];
    isOffersLoading: boolean;
    onMountainPress: (id: string) => void;
    onDownloadPress: (id: string) => void;
    onGroupPress: () => void;
    getItemRating: (id: string) => number;
    isLoading: boolean;
    offers?: IOffer[];
    recommendationsError?: string | null;
    isRecommendationsLoading?: boolean;
    isNewAccount?: boolean;
    discoverError?: string | null;
    isRefreshing?: boolean;
    onRefreshPress?: () => void;
}

/**
 * Props for the internal ListSection component.
 * 
 * @param title - Section header title.
 * @param data - Array of ITrail items to display.
 * @param onViewAll - Callback when "See more" text button is pressed.
 * @param isSectionLoading - Loading state for this specific section.
 * @param error - Error string if fetching failed for this section.
 * @param isNewAccountSection - Indicates if section is showing cold-start onboarding state.
 * @param cardWidth - Dynamic responsive card width in pixels.
 * @param effectiveWidth - Max-width constrained container width.
 * @param getItemRating - Function retrieving trail rating by ID.
 * @param onMountainPress - Callback when card is pressed.
 * @param onDownloadPress - Callback when trail download icon is pressed.
 * @param getTrailOffersCount - Helper returning count of upcoming active offers for a trail ID.
 * @param isRefreshing - Active pull-to-refresh state boolean.
 */
interface ListSectionProps {
    title: string;
    data: ITrail[];
    onViewAll: () => void;
    isSectionLoading: boolean;
    isRefreshing?: boolean;
    error?: string | null;
    isNewAccountSection?: boolean;
    cardWidth: number;
    effectiveWidth: number;
    getItemRating: (id: string) => number;
    onMountainPress: (id: string) => void;
    onDownloadPress: (id: string) => void;
    getTrailOffersCount: (trailId: string) => number;
}

/**
 * Renders a horizontal list section of MountainCards or MountainCardSkeletons.
 * 
 * @param props - ListSectionProps containing data, callbacks, and layout parameters.
 * @returns React.JSX.Element rendering section header and horizontal card list.
 */
const ListSection: React.FC<ListSectionProps> = ({
    title,
    data,
    onViewAll,
    isSectionLoading,
    isRefreshing = false,
    error = null,
    isNewAccountSection = false,
    cardWidth,
    effectiveWidth,
    getItemRating,
    onMountainPress,
    onDownloadPress,
    getTrailOffersCount,
}) => {
    const hasData = data && data.length > 0;
    const scrollRef = React.useRef<ScrollView>(null);

    // Web drag-to-slide mouse scrolling hook for Web ScrollView
    useWebDragScroll(scrollRef, hasData);

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <CustomText variant="subtitle" style={styles.sectionTitle}>
                    {title}
                </CustomText>

                {hasData && (
                    <TouchableOpacity onPress={onViewAll}>
                        <CustomText variant="caption" style={styles.viewAllText}>
                            See more
                        </CustomText>
                    </TouchableOpacity>
                )}
            </View>

            {/* SKELETON LOADING STATE: Renders shimmering MountainCardSkeleton cards while data is fetching or refreshing */}
            {(isSectionLoading && !hasData) || isRefreshing ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    style={styles.scrollViewStyle}
                >
                    {[1, 2, 3].map((_, index) => (
                        <MountainCardSkeleton
                            key={`skeleton-${title}-${index}`}
                            style={{
                                width: cardWidth,
                                marginRight: 16
                            }}
                        />
                    ))}
                </ScrollView>
            ) : error && !hasData ? (
                <View style={styles.emptyStateContainer}>
                    <CustomIcon
                        library="Ionicons"
                        name="alert-circle-outline"
                        size={48}
                        color={Colors.RED}
                    />
                    <CustomText variant="caption" style={styles.emptyStateText}>
                        {title === "Recommendations"
                            ? "Failed to load recommendations. Pull down to refresh."
                            : "Failed to load trails. Pull down to refresh."}
                    </CustomText>
                </View>
            ) : hasData ? (
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    style={styles.scrollViewStyle}
                >
                    {data.map((item) => (
                        <MountainCard
                            rating={getItemRating(item.id)}
                            key={`${title}-${item.id}`}
                            item={item}
                            onPress={() => onMountainPress(item.id)}
                            onDownload={() => onDownloadPress(item.id)}
                            style={{
                                width: cardWidth,
                                marginRight: 16
                            }}
                            offersCount={getTrailOffersCount(item.id)}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyStateContainer}>
                    {/* EMPTY STATE: Render custom labels and illustrations based on section and user status */}
                    {title === "Recommendations" ? (
                        /* New User (Cold Start): user profile has no logged hikes */
                        isNewAccountSection ? (
                            <>
                                <CustomIcon
                                    library="Ionicons"
                                    name="bulb-outline"
                                    size={48}
                                    color={Colors.GRAY_MEDIUM}
                                />
                                <CustomText variant="caption" style={styles.emptyStateText}>
                                    No recommendations yet. Start exploring!
                                </CustomText>
                            </>
                        ) : (
                            /* Regular Empty Recommendations: user has logged hikes but no new recommendation matches */
                            <>
                                <CustomIcon
                                    library="Ionicons"
                                    name="trail-sign-outline"
                                    size={48}
                                    color={Colors.GRAY_MEDIUM}
                                />
                                <CustomText variant="caption" style={styles.emptyStateText}>
                                    No matching recommendations found.
                                </CustomText>
                            </>
                        )
                    ) : (
                        /* Standard Empty State for all other trail lists */
                        <>
                            <CustomIcon
                                library="Ionicons"
                                name="trail-sign-outline"
                                size={48}
                                color={Colors.GRAY_MEDIUM}
                            />
                            <CustomText variant="caption" style={styles.emptyStateText}>
                                No trails available yet.
                            </CustomText>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.replace('/explore')}
                        activeOpacity={0.7}
                    >
                        <CustomText style={styles.exploreButtonText}>
                            Explore Trails
                        </CustomText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

/**
 * HomeScreen — The main dashboard screen showing localized weather conditions,
 * curated trail recommendations, discover lists, and interactive hike offers.
 * 
 * @param props - HomeScreenProps containing navigation callbacks, trail data arrays, and loading flags.
 * @returns React.JSX.Element rendering the complete Home tab view.
 */
const HomeScreen: React.FC<HomeScreenProps> = ({
    onWeatherPress,
    onSeeMoreRecommendationsPress,
    onSeeMoreDiscoverPress,
    onSeeMoreOffersPress,
    recommendedTrails = [],
    discoverTrails = [],
    trailsWithOffers = [],
    isOffersLoading = false,
    onMountainPress,
    onDownloadPress,
    onGroupPress,
    getItemRating,
    isLoading,
    offers = [],
    recommendationsError = null,
    isRecommendationsLoading = false,
    isNewAccount = false,
    discoverError = null,
    isRefreshing = false,
    onRefreshPress,
}) => {
    const { latitude, longitude, locationName, geocodedName, isLocating } = useLocation();
    const { weatherData, loading, error, refetch } = useWeather(latitude, longitude);
    const { width } = useWindowDimensions();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const MAX_CONTAINER_WIDTH = 860;
    const effectiveWidth = Math.min(width, MAX_CONTAINER_WIDTH);
    const cardWidth = Math.min(width * 0.85, 360);

    const hasAnyTrails = recommendedTrails.length > 0 || discoverTrails.length > 0 || trailsWithOffers.length > 0;

    const reloadMountainWeatherBadges = useCallback(() => {
        const allVisibleTrails = [...recommendedTrails, ...discoverTrails, ...trailsWithOffers];
        if (allVisibleTrails.length === 0) return;

        const uniqueTrails = Array.from(new Set(allVisibleTrails.map(t => t.id)))
            .map(id => allVisibleTrails.find(t => t.id === id))
            .filter((t): t is ITrail => t !== undefined);

        fetchTrailWeatherBadges(uniqueTrails).then(setMountainWeatherMap);
    }, [recommendedTrails, discoverTrails, trailsWithOffers]);

    useEffect(() => {
        reloadMountainWeatherBadges();
    }, [reloadMountainWeatherBadges]);

    // Helper to calculate upcoming offers count for each card
    const getTrailOffersCount = (trailId: string) => {
        const now = new Date();
        return offers.filter(o => o.trail?.id === trailId && o.date && new Date(o.date).getTime() > now.getTime()).length;
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Home"
                showDefaultIcons={true}
            />

            <ResponsiveScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.scrollContent,
                    isWideScreen && styles.scrollContentWide
                ]}
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={true}
                overScrollMode={hasAnyTrails ? 'auto' : 'never'}
                scrollEnabled={true}
                refreshControl={
                    onRefreshPress ? (
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={async () => {
                                await refetch();
                                if (onRefreshPress) {
                                    await onRefreshPress();
                                }
                            }}
                            colors={[Colors.PRIMARY]}
                            tintColor={Colors.PRIMARY}
                        />
                    ) : undefined
                }
            >
                <WeatherSection
                    weatherData={weatherData}
                    loading={loading || isLocating}
                    isRefreshing={isRefreshing}
                    error={error}
                    onPress={onWeatherPress}
                    onReload={refetch}
                    locationName={geocodedName || locationName}
                />

                <ListSection
                    title="Recommendations"
                    data={recommendedTrails}
                    onViewAll={onSeeMoreRecommendationsPress}
                    isSectionLoading={isLoading || isRecommendationsLoading}
                    isRefreshing={isRefreshing}
                    error={recommendationsError}
                    isNewAccountSection={isNewAccount}
                    cardWidth={cardWidth}
                    effectiveWidth={effectiveWidth}
                    getItemRating={getItemRating}
                    onMountainPress={onMountainPress}
                    onDownloadPress={onDownloadPress}
                    getTrailOffersCount={getTrailOffersCount}
                />

                <ListSection
                    title="Discover"
                    data={discoverTrails}
                    onViewAll={onSeeMoreDiscoverPress}
                    isSectionLoading={isLoading}
                    isRefreshing={isRefreshing}
                    error={discoverError}
                    cardWidth={cardWidth}
                    effectiveWidth={effectiveWidth}
                    getItemRating={getItemRating}
                    onMountainPress={onMountainPress}
                    onDownloadPress={onDownloadPress}
                    getTrailOffersCount={getTrailOffersCount}
                />

                {trailsWithOffers.length > 0 && (
                    <ListSection
                        title="Upcoming Offers"
                        data={trailsWithOffers}
                        onViewAll={onSeeMoreOffersPress}
                        isSectionLoading={isLoading || isOffersLoading}
                        isRefreshing={isRefreshing}
                        cardWidth={cardWidth}
                        effectiveWidth={effectiveWidth}
                        getItemRating={getItemRating}
                        onMountainPress={onMountainPress}
                        onDownloadPress={onDownloadPress}
                        getTrailOffersCount={getTrailOffersCount}
                    />
                )}
            </ResponsiveScrollView>

            <CustomFAB onPress={onGroupPress} />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingBottom: 32,
        gap: 16,
    },
    scrollContentWide: {
        maxWidth: 860,
        width: '100%',
        alignSelf: 'center',
    },
    sectionContainer: {
        marginTop: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 8,
    },
    viewAllText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        marginTop: 6,
    },
    horizontalList: {
        paddingBottom: 4,
        paddingHorizontal: 16,
    },
    scrollViewStyle: {
        width: '100%',
        ...Platform.select({
            web: {
                paddingBottom: 4,
                marginBottom: -4,
            }
        })
    },
    emptyStateContainer: {
        width: '100%',
        paddingTop: 16,
        paddingBottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.BACKGROUND,
        opacity: 0.8,
        gap: 8,
    },
    emptyStateText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    exploreButton: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
        ...GlobalStyles.dropShadow(2),
    },
    exploreButtonText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
