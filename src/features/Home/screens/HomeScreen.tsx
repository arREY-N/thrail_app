import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';

import MountainCard from '@/src/components/MountainCard';
import WeatherSection from '@/src/features/Home/components/WeatherSection';

import { ITrail } from '@/src/core/models/Trail/Trail.types';
import { fetchTrailWeatherBadges, TrailWeatherBadge } from "@/src/core/utility/weatherHelpers";

/**
 * Props for the HomeScreen component.
 */
export interface HomeScreenProps {
    /** Unused legacy prop, maintained for signature consistency */
    locationTemp?: Record<string, unknown>;
    /** Callback when the weather section is pressed */
    onWeatherPress: () => void;
    /** Callback to view all recommended trails */
    onViewAllRecommendationPress: () => void;
    /** Callback to view all trending/discover trails  (optional, as not always provided) */
    onViewAllTrendingPress?: () => void;
    /** Callback to view all discover trails */
    onViewAllDiscoverPress: () => void;
    /** Array of recommended trails */
    recommendedTrails?: ITrail[];
    /** Array of discover trails */
    discoverTrails?: ITrail[];
    /** Callback when a specific mountain/trail is pressed */
    onMountainPress: (id: string) => void;
    /** Callback to download a trail */
    onDownloadPress: (id: string) => void;
    /** Callback when the group FAB is pressed */
    onGroupPress: () => void;
    /** Function to retrieve the rating for a specific item */
    getItemRating: (id: string) => number;
    /** Global loading state */
    isLoading: boolean;
}

/**
 * The main Home Screen displaying recommended trails, weather, and discover sections.
 * 
 * @param {HomeScreenProps} props - The properties for the HomeScreen component.
 */
const HomeScreen = ({
    locationTemp,
    onWeatherPress,
    onViewAllRecommendationPress,
    onViewAllTrendingPress,
    onViewAllDiscoverPress,
    recommendedTrails = [], 
    discoverTrails = [],
    onMountainPress,
    onDownloadPress,
    onGroupPress,
    getItemRating,
    isLoading,
}: HomeScreenProps) => {
    const { latitude, longitude } = useLocation();
    const { weatherData, loading, error } = useWeather(latitude, longitude);
    const [mountainWeatherMap, setMountainWeatherMap] = useState<Record<string, unknown>>({});
    const { width, isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const MAX_CONTAINER_WIDTH = 860;
    const effectiveWidth = Math.min(width, MAX_CONTAINER_WIDTH);
    const cardWidth = Math.min(width * 0.85, 360);

    const hasAnyTrails = recommendedTrails.length > 0 || discoverTrails.length > 0;

    useEffect(() => {
        const allVisibleTrails = [...recommendedTrails, ...discoverTrails];
        if (allVisibleTrails.length === 0) return;
        
        const uniqueTrails = Array.from(new Set(allVisibleTrails.map(t => t.id)))
            .map(id => allVisibleTrails.find(t => t.id === id))
            .filter((t): t is ITrail => t !== undefined);

        fetchTrailWeatherBadges(uniqueTrails).then(setMountainWeatherMap);
    }, [recommendedTrails, discoverTrails]);

    /**
     * Props for the internal ListSection component.
     */
    interface ListSectionProps {
        title: string;
        data: ITrail[];
        onViewAll: () => void;
        isSectionLoading: boolean;
    }

    /**
     * Renders a horizontal list section of MountainCards.
     * 
     * @param {ListSectionProps} props - The properties for the ListSection.
     */
    const ListSection = ({ title, data, onViewAll, isSectionLoading }: ListSectionProps) => {
        const hasData = data && data.length > 0;

        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <CustomText variant="subtitle" style={styles.sectionTitle}>
                        {title}
                    </CustomText>

                    <TouchableOpacity onPress={onViewAll}>
                        <CustomText variant="caption" style={styles.viewAllText}>
                            View All
                        </CustomText>
                    </TouchableOpacity>
                </View>

                {isSectionLoading && !hasData ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    </View>
                ) : hasData ? (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={Platform.OS === 'web'} 
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
                                />
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <CustomIcon 
                            library="Ionicons" 
                            name="trail-sign-outline" 
                            size={48} 
                            color={Colors.GRAY_MEDIUM} 
                        />
                        
                        <CustomText variant="caption" style={styles.emptyStateText}>
                            No trails available yet.
                        </CustomText>
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
                    loading={loading}
                    error={error}
                    onPress={onWeatherPress} locationName={undefined}                />

                <ListSection 
                    title="Recommendations" 
                    data={recommendedTrails} 
                    onViewAll={onViewAllRecommendationPress} 
                    isSectionLoading={isLoading}
                />

                <ListSection 
                    title="Discover" 
                    data={discoverTrails}
                    onViewAll={onViewAllDiscoverPress} 
                    isSectionLoading={isLoading}
                />
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
    },
    viewAllText: {
        textDecorationLine: 'underline',
    },
    horizontalList: {
        paddingBottom: 12,
        ...Platform.select({
            ios: { paddingHorizontal: 16 },
            android: { paddingHorizontal: 16 },
            web: { paddingHorizontal: 0 },
        })
    },
    scrollViewStyle: {
        ...Platform.select({
            web: {
                marginHorizontal: 16, 
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
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.BACKGROUND, 
        opacity: 0.8,
        gap: 8,
    },
    emptyStateText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
    }
});

export default HomeScreen;
