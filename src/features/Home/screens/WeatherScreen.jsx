import React, { useCallback, useState } from 'react';
import {
    Platform,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatSunTime } from '@/src/core/utility/date';
import { getWeatherInfoUI } from '@/src/core/utility/weatherHelpers';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';

import WeatherSkeleton from '@/src/features/Home/components/WeatherSkeleton';

const WeatherScreen = ({ 
    latitude, 
    longitude, 
    locationName, 
    onBackPress, 
    onRefreshPress 
}) => {
    
    // Abstracted hooks for fetching coords and reverse geocoding
    const { 
        latitude: activeLat, 
        longitude: activeLon, 
        locationName: displayName,
        geocodedName
    } = useLocation({ 
        propLatitude: latitude, 
        propLongitude: longitude, 
        propLocationName: locationName 
    });

    const [refreshing, setRefreshing] = useState(false);

    // Weather hook
    const { weatherData, loading, error, refetch } = useWeather(activeLat, activeLon);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (onRefreshPress) await onRefreshPress(); 
        await refetch();
        setRefreshing(false);
    }, [onRefreshPress, refetch]);

    const hasData = weatherData && !error;
    const { condition, icon: mainIcon, library: mainLib } = getWeatherInfoUI(weatherData?.weatherCode);
    const temperature = weatherData?.temperature !== undefined ? Math.round(weatherData.temperature) : "--";
    const dayTemp = weatherData?.forecast?.[0]?.temperatureMax !== undefined ? Math.round(weatherData.forecast[0].temperatureMax) : "--";
    const nightTemp = weatherData?.forecast?.[0]?.temperatureMin !== undefined ? Math.round(weatherData.forecast[0].temperatureMin) : "--";
    
    const wind = weatherData?.windSpeed !== undefined ? `${weatherData.windSpeed} km/h` : "--";
    const precipAmount = weatherData?.precipitationSum !== undefined ? `${weatherData.precipitationSum} mm` : "--";
    const precipChance = weatherData?.precipitationProbability !== undefined ? `${weatherData.precipitationProbability}%` : "--";
    const uvIndex = weatherData?.uvIndex !== undefined ? String(weatherData.uvIndex) : "--";
    const humidity = weatherData?.humidity !== undefined ? `${Math.round(weatherData.humidity)}%` : "--";
    const sunrise = weatherData?.sunrise ? formatSunTime(weatherData.sunrise) : "--:-- AM";
    const sunset = weatherData?.sunset ? formatSunTime(weatherData.sunset) : "--:-- PM";

    let updateText = null;
    if (weatherData?.isStale && weatherData?.lastUpdated) {
        const minDiff = Math.max(1, Math.floor((new Date() - new Date(weatherData.lastUpdated)) / 60000));
        updateText = `Last updated ${minDiff} min${minDiff > 1 ? 's' : ''} ago`;
    }

    if (loading && !weatherData) {
        return <WeatherSkeleton onBackPress={onBackPress} />;
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <CustomHeader 
                title="Weather" 
                centerTitle={true}
                onBackPress={onBackPress} 
            />

            <ResponsiveScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={[Colors.PRIMARY]}
                    />
                }
            >
                <Animated.View entering={FadeIn.duration(800)} style={styles.heroSection}>
                    <View style={styles.heroTop}>
                        <View style={styles.heroTextWrapper}>
                            <View style={styles.tempContainer}>
                                <CustomText variant="title" style={styles.mainTemp}>
                                    {temperature}°
                                </CustomText>
                                <CustomText variant="subtitle" style={styles.tempUnit}>
                                    C
                                </CustomText>
                            </View>
                            <View style={styles.locationWrapper}>
                                <View style={styles.locationRow}>
                                    <CustomIcon 
                                        library="FontAwesome6" 
                                        name="location-dot" 
                                        size={16} 
                                        color={Colors.BLACK} 
                                    />
                                    <CustomText variant="body" style={styles.locationLabel}>
                                        {displayName}
                                    </CustomText>
                                </View>
                                {geocodedName !== displayName && (
                                    <CustomText variant="caption" style={styles.geocodedLabel} numberOfLines={1}>
                                        {geocodedName || "Fetching exact location..."}
                                    </CustomText>
                                )}
                            </View>
                        </View>

                        <CustomIcon 
                            library={mainLib} 
                            name={hasData ? mainIcon : "cloud"} 
                            size={96} 
                            color={Colors.BLACK} 
                        />
                    </View>
                    
                    <View style={styles.heroDivider} />
                    
                    <View style={styles.heroBottom}>
                        <CustomText variant="body" style={styles.heroSubText}>
                            {hasData ? condition : "Loading"}
                            {updateText ? `  •  ${updateText}` : ''}
                        </CustomText>
                        <CustomText variant="body" style={styles.heroSubText}>
                            Day: {dayTemp}° | Night: {nightTemp}°
                        </CustomText>
                    </View>
                </Animated.View>

                {error ? (
                    <Animated.View entering={FadeInDown.springify()} style={styles.errorContainer}>
                        <CustomIcon library="Feather" name="alert-triangle" size={48} color={Colors.ERROR} />
                        <CustomText variant="body" style={styles.errorText}>
                            {error || "Unable to load weather data."}
                        </CustomText>
                        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                            <CustomText style={styles.retryText}>Retry Connection</CustomText>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <>
                        <Animated.View entering={FadeInDown.delay(100).springify().damping(14)} style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <CustomIcon 
                                    library="Ionicons" 
                                    name="calendar" 
                                    size={18} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText variant="body" style={styles.cardHeaderTitle}>
                                    4-Day Forecast
                                </CustomText>
                            </View>
                            <View style={styles.forecastRow}>
                                {weatherData?.forecast?.slice(0, 4).map((day, idx) => {
                                    const { icon, library } = getWeatherInfoUI(day.weatherCode);
                                    const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                                    return (
                                        <ForecastItem 
                                            key={idx}
                                            day={dayName} 
                                            icon={icon} 
                                            lib={library}
                                            low={Math.round(day.temperatureMin)} 
                                            high={Math.round(day.temperatureMax)} 
                                        />
                                    );
                                })}
                            </View>
                        </Animated.View>

                        <View style={styles.bentoGrid}>
                            <BentoBox index={0} title="Wind" value={wind} desc="Current speed" icon="wind" lib="Feather" />
                            <BentoBox index={1} title="Precipitation" value={precipAmount} desc={`${precipChance} chance`} icon="rainy" lib="Ionicons" />
                            <BentoBox index={2} title="UV Index" value={uvIndex} desc="Current level" icon="sun" lib="Feather" />
                            <BentoBox index={3} title="Humidity" value={humidity} desc="Relative humidity" icon="water" lib="Ionicons" />
                        </View>

                        <Animated.View entering={FadeInDown.delay(400).springify().damping(14)} style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <CustomIcon 
                                    library="Ionicons" 
                                    name="sunny" 
                                    size={18} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText variant="body" style={styles.cardHeaderTitle}>
                                    Sun
                                </CustomText>
                            </View>
                            
                            <View style={styles.sunTimeRow}>
                                <View style={styles.sunItem}>
                                    <CustomIcon library="Feather" name="sunrise" size={32} color={Colors.BLACK} />
                                    <CustomText variant="subtitle" style={styles.sunTimeText}>{sunrise}</CustomText>
                                    <CustomText variant="caption" style={styles.sunLabel}>Sunrise</CustomText>
                                </View>

                                <View style={[styles.sunItem, { alignItems: 'flex-end' }]}>
                                    <CustomIcon library="Feather" name="sunset" size={32} color={Colors.BLACK} />
                                    <CustomText variant="subtitle" style={styles.sunTimeText}>{sunset}</CustomText>
                                    <CustomText variant="caption" style={styles.sunLabel}>Sunset</CustomText>
                                </View>
                            </View>
                        </Animated.View>
                    </>
                )}
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const ForecastItem = ({ day, icon, lib, low, high }) => (
    <View style={styles.fItem}>       
        <View style={styles.fIconWrapper}>
            <CustomIcon library={lib || "MaterialCommunityIcons"} name={icon} size={32} color={Colors.BLACK} />
        </View>
        <CustomText variant="caption" style={styles.fDay}>{day}</CustomText>
        <View style={styles.fTempRow}>
            <CustomText variant="body" style={styles.fTempHigh}>{high}°</CustomText>
            <CustomText style={styles.fTempSeparator}>/</CustomText>
            <CustomText variant="caption" style={styles.fTempLow}>{low}°</CustomText>
        </View> 
    </View>
);

const BentoBox = ({ title, value, desc, icon, lib, index = 0 }) => (
    <Animated.View 
        entering={FadeInDown.delay(150 + (index * 50)).springify().damping(14)} 
        style={styles.bentoBox}
    >
        <View style={styles.bentoHeader}>
            <CustomIcon library={lib} name={icon} size={18} color={Colors.TEXT_SECONDARY} />
            <CustomText variant="body" style={styles.bentoTitle}>{title}</CustomText>
        </View>
        <View>
            <CustomText variant="subtitle" style={styles.bentoValue}>{value}</CustomText>
            <CustomText variant="caption" style={styles.bentoDesc}>{desc}</CustomText>
        </View>
    </Animated.View>
);

const dropShadow = Platform.select({
    ios: {
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    android: {
        elevation: 3,
    },
    web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 32,
    },
    heroSection: {
        paddingVertical: 16,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroTextWrapper: {
        alignItems: 'flex-start',
        flex: 1,
        paddingRight: 16,
    },
    tempContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    mainTemp: {
        fontSize: 72,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -3,
        includeFontPadding: false,
    },
    tempUnit: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
        marginLeft: 2,
        color: Colors.TEXT_PRIMARY,
    },
    locationWrapper: {
        alignItems: 'flex-start',
        marginTop: -8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationLabel: {
        fontWeight: '600',
    },
    geocodedLabel: {
        marginLeft: 20,
        marginTop: 0,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
        fontSize: 12,
    },
    heroDivider: {
        height: 2,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 16,
        opacity: 0.5,
    },
    heroBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    heroSubText: {
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },

    fullWidthCard: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 16,
        padding: 16,
        gap: 16,
        ...dropShadow, 
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardHeaderTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },

    forecastRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    fItem: {
        alignItems: 'center',
        gap: 4,
    },
    fIconWrapper: {
        height: 32, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    fDay: {
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY, 
    },
    fTempRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fTempHigh: {
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    fTempSeparator: {
        fontSize: 14,
        color: Colors.GRAY_MEDIUM, 
        marginHorizontal: 4,
    },
    fTempLow: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY, 
    },

    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    bentoBox: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 16,
        padding: 16,
        margin: 8,
        flex: 1,
        minWidth: 140,
        minHeight: 160,
        justifyContent: 'space-between',
        ...dropShadow, 
    },
    bentoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bentoTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },
    bentoValue: {
        fontWeight: 'bold',
        marginBottom: 8, 
    },
    bentoDesc: {
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },

    sunTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 0,
    },
    sunItem: {
        gap: 8,
    },
    sunTimeText: {
        fontWeight: 'bold',
        marginBottom: 0,
    },
    sunLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
    },
    
    errorContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
    },
    errorText: {
        color: Colors.ERROR,
        textAlign: 'center',
        marginBottom: 8,
    },
    retryBtn: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    }
});

export default WeatherScreen;