/**
 * @file HomeScreen.tsx
 * @description The main presentation screen for the Home tab, featuring weather, recommendations, discover feed, and active hike offers.
 */

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

import MountainCard from '@/src/components/MountainCard';
import WeatherSection from '@/src/features/Home/components/WeatherSection';

import { ITrail } from '@/src/core/models/Trail/Trail.types';
import { fetchTrailWeatherBadges, TrailWeatherBadge } from "@/src/core/utility/weatherHelpers";

/**
 * Props for the HomeScreen component.
 * 
 * @param locationTemp - Unused legacy prop, maintained for signature consistency.
 * @param onWeatherPress - Callback when the weather section is pressed.
 * @param onSeeMoreRecommendationsPress - Callback to view all recommended trails.
 * @param onViewAllTrendingPress - Callback to view all trending/discover trails.
 * @param onSeeMoreDiscoverPress - Callback to view all discover trails.
 * @param onSeeMoreOffersPress - Callback to view all trails with offers.
 * @param recommendedTrails - Array of recommended trails.
 * @param discoverTrails - Array of discover trails.
 * @param trailsWithOffers - Array of trails that have upcoming offers.
 * @param isOffersLoading - Loading state of offers list.
 * @param onMountainPress - Callback when a specific mountain/trail is pressed.
 * @param onDownloadPress - Callback to download a trail.
 * @param onGroupPress - Callback when the group FAB is pressed.
 * @param getItemRating - Function to retrieve the rating for a specific item.
 * @param isLoading - Global loading state.
 * @param offers - Array of hiking offers.
 * @param recommendationsError - Recommendations fetch error.
 * @param isRecommendationsLoading - Recommendations loading state.
 * @param isNewAccount - New account flag.
 * @param onRetryRecommendations - Callback to retry recommendations.
 * @param discoverError - Discover/trails fetch error.
 * @param onRetryDiscover - Callback to retry discover trails.
 */
export interface HomeScreenProps {
    locationTemp?: Record<string, unknown>;
    onWeatherPress: () => void;
    onSeeMoreRecommendationsPress: () => void;
    onViewAllTrendingPress?: () => void;
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
    offers?: any[];
    recommendationsError?: string | null;
    isRecommendationsLoading?: boolean;
    isNewAccount?: boolean;
    onRetryRecommendations?: () => void;
    discoverError?: string | null;
    onRetryDiscover?: () => void;
}

/**
 * HomeScreen — The main dashboard screen showing localized weather conditions,
 * curated trail recommendations, discover lists, and interactive hike offers.
 */
const HomeScreen: React.FC<HomeScreenProps> = ({
    locationTemp,
    onWeatherPress,
    onSeeMoreRecommendationsPress,
    onViewAllTrendingPress,
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
    onRetryRecommendations,
    discoverError = null,
    onRetryDiscover,
}) => {
    const { latitude, longitude, locationName, geocodedName, isLocating } = useLocation();
    const { weatherData, loading, error, refetch } = useWeather(latitude, longitude);
    const [mountainWeatherMap, setMountainWeatherMap] = useState<Record<string, unknown>>({});
    const { width } = useWindowDimensions();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const MAX_CONTAINER_WIDTH = 860;
    const effectiveWidth = Math.min(width, MAX_CONTAINER_WIDTH);
    const cardWidth = Math.min(width * 0.85, 360);

    const hasAnyTrails = recommendedTrails.length > 0 || discoverTrails.length > 0 || trailsWithOffers.length > 0;

    useEffect(() => {
        const allVisibleTrails = [...recommendedTrails, ...discoverTrails, ...trailsWithOffers];
        if (allVisibleTrails.length === 0) return;
        
        const uniqueTrails = Array.from(new Set(allVisibleTrails.map(t => t.id)))
            .map(id => allVisibleTrails.find(t => t.id === id))
            .filter((t): t is ITrail => t !== undefined);

        fetchTrailWeatherBadges(uniqueTrails).then(setMountainWeatherMap);
    }, [recommendedTrails, discoverTrails, trailsWithOffers]);

    // Helper to calculate upcoming offers count for each card
    const getTrailOffersCount = (trailId: string) => {
        const now = new Date();
        return offers.filter(o => o.trail?.id === trailId && o.date && new Date(o.date).getTime() > now.getTime()).length;
    };

    /**
     * Props for the internal ListSection component.
     */
    interface ListSectionProps {
        title: string;
        data: ITrail[];
        onViewAll: () => void;
        isSectionLoading: boolean;
        error?: string | null;
        onRetry?: () => void;
        isNewAccountSection?: boolean;
    }

    /**
     * Renders a horizontal list section of MountainCards.
     * 
     * @param props - The properties for the ListSection.
     */
    const ListSection = ({ 
        title, 
        data, 
        onViewAll, 
        isSectionLoading,
        error = null,
        onRetry,
        isNewAccountSection = false,
    }: ListSectionProps) => {
        const hasData = data && data.length > 0;
        const scrollRef = React.useRef<ScrollView>(null);

        const totalCardsWidth = data.length * (cardWidth + 16) - 16;
        const shouldScroll = data.length > 1 && totalCardsWidth > (effectiveWidth - 32);

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

                {/* ERROR STATE: Renders if data fetching failed and no cached data exists */}
                {error && !hasData ? (
                    <View style={styles.emptyStateContainer}>
                        <CustomIcon 
                            library="Ionicons" 
                            name="alert-circle-outline" 
                            size={48} 
                            color={Colors.RED} 
                        />
                        <CustomText variant="caption" style={styles.emptyStateText}>
                            {/* Choose message based on section title */}
                            {title === "Recommendations" 
                                ? "Failed to load recommendations."
                                : "Failed to load trails."}
                        </CustomText>
                        {onRetry && (
                            <TouchableOpacity 
                                style={styles.exploreButton}
                                onPress={onRetry}
                                activeOpacity={0.7}
                            >
                                <CustomText style={styles.exploreButtonText}>
                                    Try Again
                                </CustomText>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : isSectionLoading && !hasData ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    </View>
                ) : hasData ? (
                    Platform.OS === 'web' ? (
                        /* Web Platform uses standard ScrollView with drag-to-slide to prevent clipping cut-offs */
                        <ScrollView 
                            ref={scrollRef}
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.horizontalList}
                            style={styles.scrollViewStyle} 
                        >
                            {data.map((item, index) => {
                                const isLast = index === data.length - 1;

                                return (
                                    <MountainCard 
                                        rating={getItemRating(item.id)}
                                        key={`${title}-${item.id}`}
                                        item={item}
                                        onPress={() => onMountainPress(item.id)}
                                        onDownload={() => onDownloadPress(item.id)}
                                        style={{ 
                                            width: cardWidth,
                                            marginRight: isLast ? 0 : 16 
                                        }}
                                        weatherBadge={(mountainWeatherMap[item.id] as TrailWeatherBadge) ?? null}
                                        offersCount={getTrailOffersCount(item.id)}
                                    />
                                );
                            })}
                        </ScrollView>
                    ) : (
                        /* Native Mobile platforms use high-performance Carousel slider */
                        shouldScroll ? (
                            <Carousel
                                loop={false}
                                width={cardWidth + 16}
                                height={260}
                                style={{
                                    width: effectiveWidth,
                                    height: 260,
                                    paddingLeft: 16,
                                }}
                                data={data}
                                autoPlay={false}
                                windowSize={Math.max(data.length, 5)}
                                renderItem={({ item }) => (
                                    <MountainCard 
                                        rating={getItemRating(item.id)}
                                        key={`${title}-${item.id}`}
                                        item={item}
                                        onPress={() => onMountainPress(item.id)}
                                        onDownload={() => onDownloadPress(item.id)}
                                        style={{ 
                                            width: cardWidth,
                                        }}
                                        weatherBadge={(mountainWeatherMap[item.id] as TrailWeatherBadge) ?? null}
                                        offersCount={getTrailOffersCount(item.id)}
                                    />
                                )}
                            />
                        ) : (
                            <View style={{ flexDirection: 'row', paddingLeft: 16 }}>
                                {data.map((item, index) => (
                                    <MountainCard 
                                        rating={getItemRating(item.id)}
                                        key={`${title}-${item.id}`}
                                        item={item}
                                        onPress={() => onMountainPress(item.id)}
                                        onDownload={() => onDownloadPress(item.id)}
                                        style={{ 
                                            width: cardWidth,
                                            marginRight: index === data.length - 1 ? 0 : 16
                                        }}
                                        weatherBadge={(mountainWeatherMap[item.id] as TrailWeatherBadge) ?? null}
                                        offersCount={getTrailOffersCount(item.id)}
                                    />
                                ))}
                            </View>
                        )
                    )
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
                            /* Standard Empty State for all other trail lists*/
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
                alwaysBounceVertical={false} 
                overScrollMode={hasAnyTrails ? 'auto' : 'never'} 
                scrollEnabled={true}
            >
                <WeatherSection 
                    weatherData={weatherData}
                    loading={loading || isLocating}
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
                    error={recommendationsError}
                    onRetry={onRetryRecommendations}
                    isNewAccountSection={isNewAccount}
                />

                <ListSection 
                    title="Discover" 
                    data={discoverTrails}
                    onViewAll={onSeeMoreDiscoverPress} 
                    isSectionLoading={isLoading}
                    error={discoverError}
                    onRetry={onRetryDiscover}
                />

                {trailsWithOffers.length > 0 && (
                    <ListSection 
                        title="Upcoming Offers" 
                        data={trailsWithOffers}
                        onViewAll={onSeeMoreOffersPress} 
                        isSectionLoading={isLoading || isOffersLoading}
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
    loaderContainer: {
        width: '100%',
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
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
