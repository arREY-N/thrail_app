import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

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

import { fetchWeatherFromApi } from "@/src/core/repositories/weatherRepository";
import { getWeatherInfoUI } from "@/src/core/utility/weatherHelpers";

const MOUNTAIN_COORDS = {
    tagapo: { lat: 14.3392772, lon: 121.2325293 },
    marami: { lat: 14.1986108, lon: 120.6858334 },
    batulao: { lat: 14.0399434, lon: 120.8023782 },
    makiling: { lat: 14.1352241, lon: 121.1944517 },
    maculot: { lat: 13.9208682, lon: 121.0516961 },
};

const resolveCoordsForTrail = (trail) => {
    const name = (trail?.general?.name ?? "").toLowerCase();
    for (const [keyword, coords] of Object.entries(MOUNTAIN_COORDS)) {
        if (name.includes(keyword)) return coords;
    }
    return null;
};

const HomeScreen = ({
    locationTemp, // unused now but left for signature consistency
    onWeatherPress,
    onViewAllRecommendationPress,
    onViewAllTrendingPress,
    onViewAllDiscoverPress,
    recommendedTrails, 
    discoverTrails,
    onMountainPress,
    onDownloadPress,
}) => {
    
    const { latitude, longitude } = useLocation();
    const { weatherData, loading, error } = useWeather(latitude, longitude);
    const [mountainWeatherMap, setMountainWeatherMap] = useState({});
    const { width, isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const MAX_CONTAINER_WIDTH = 860;
    const effectiveWidth = Math.min(width, MAX_CONTAINER_WIDTH);
    const cardWidth = isWideScreen ? 320 : effectiveWidth * 0.8;

    const recList = Array.isArray(recommendedTrails) ? recommendedTrails.filter(Boolean) : [];
    const discList = Array.isArray(discoverTrails) ? discoverTrails.filter(Boolean) : [];
    const hasAnyTrails = recList.length > 0 || discList.length > 0;

    useEffect(() => {
        const allVisibleTrails = [...recList, ...discList];
        if (allVisibleTrails.length === 0) return;
        const uniqueTrails = Array.from(new Set(allVisibleTrails.map(t => t.id)))
            .map(id => allVisibleTrails.find(t => t.id === id));

        const fetchAllMountainsWeather = async () => {
            const targets = uniqueTrails.reduce((acc, trail) => {
                const coords = resolveCoordsForTrail(trail);
                if (coords) acc.push({ id: trail.id, ...coords });
                return acc;
            }, []);

            if (targets.length === 0) return;

            const results = await Promise.allSettled(
                targets.map(({ lat, lon }) => fetchWeatherFromApi(lat, lon)),
            );

            const nextMap = {};
            results.forEach((result, index) => {
                if (result.status === "fulfilled" && result.value) {
                    const { icon } = getWeatherInfoUI(result.value.weatherCode);
                    nextMap[targets[index].id] = {
                        icon,
                        temperature: result.value.temperature,
                    };
                }
            });

            setMountainWeatherMap(nextMap);
        };

        fetchAllMountainsWeather();
    }, [recList, discList]);

    

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
                scrollEnabled={hasAnyTrails}
            >
                <WeatherSection 
                    weatherData={weatherData}
                    loading={loading}
                    error={error}
                    onPress={onWeatherPress} 
                />

                <ListSection 
                    title="Recommendations" 
                    data={recList} 
                    onViewAll={onViewAllRecommendationPress} 
                    onMountainPress={onMountainPress}
                    onDownloadPress={onDownloadPress}
                    cardWidth={cardWidth}
                    mountainWeatherMap={mountainWeatherMap}
                />

                <ListSection 
                    title="Discover" 
                    data={discList}
                    onViewAll={onViewAllTrendingPress} 
                    onMountainPress={onMountainPress}
                    onDownloadPress={onDownloadPress}
                    cardWidth={cardWidth}
                    mountainWeatherMap={mountainWeatherMap}
                />

            </ResponsiveScrollView>
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
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
    },
    viewAllText: {
        textDecorationLine: 'underline',
    },
    horizontalList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16, 
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

const ListSection = React.memo(({ title, data, onViewAll, onMountainPress, onDownloadPress, cardWidth, mountainWeatherMap }) => {
    const items = Array.isArray(data) ? data.filter(Boolean) : [];
    const hasData = items.length > 0;

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

            {hasData ? (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList} 
                >
                    {items.map((item) => (
                        <MountainCard 
                            key={`${title}-${item?.id ?? 'trail'}`}
                            item={item}
                            onPress={() => onMountainPress(item.id)}
                            onDownload={() => onDownloadPress(item.id)}
                            style={{ width: cardWidth }}
                            weatherBadge={mountainWeatherMap[item.id] ?? null}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyStateContainer}>
                    <CustomIcon 
                        library="Ionicons" 
                        name="trail-sign-outline" 
                        size={32} 
                        color={Colors.GRAY_MEDIUM} 
                    />
                    
                    <CustomText variant="caption" style={styles.emptyStateText}>
                        No trails available yet.
                    </CustomText>
                </View>
            )}
        </View>
    );
});

export default HomeScreen;