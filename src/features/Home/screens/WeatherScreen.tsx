/**
 * @file WeatherScreen.tsx
 * @description A comprehensive weather dashboard displaying current conditions, 7-day forecast, and environmental metrics.
 */

import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { formatLastUpdatedLabel, formatWeatherDisplay, getWeatherInfoUI } from '@/src/core/utility/weatherHelpers';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';
import { IconLibrary } from '@/src/types/ui.types';

import WeatherSkeleton from '@/src/features/Home/components/WeatherSkeleton';

/**
 * Standardized alert levels for weather metrics.
 */
export type AlertLevel = 'normal' | 'warning' | 'danger';

/**
 * Helper to determine the severity alert level of a weather metric.
 */
const getMetricAlertLevel = (type: 'wind' | 'precip' | 'uv', value: number | undefined | null): AlertLevel => {
    if (value === undefined || value === null) return 'normal';
    if (type === 'wind') return value >= 60 ? 'danger' : value >= 40 ? 'warning' : 'normal';
    if (type === 'precip') return value >= 70 ? 'danger' : value >= 50 ? 'warning' : 'normal';
    if (type === 'uv') return value >= 11 ? 'danger' : value >= 8 ? 'warning' : 'normal';
    return 'normal';
};

/**
 * Helper to generate a supportive safety reminder based on the UV index value.
 * 
 * @param value - The numerical UV index value.
 * @returns The safety description string.
 */
const getUVIndexReminder = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "No UV data available";
    if (value <= 2) return "Low risk.";
    if (value <= 5) return "Moderate risk.";
    if (value <= 7) return "High risk.";
    if (value <= 10) return "Very high risk.";
    return "Extreme risk.";
};

/**
 * Props for the main WeatherScreen component.
 */
export interface WeatherScreenProps {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    onBackPress?: () => void;
    onRefreshPress?: () => Promise<void> | void;
}

/**
 * A comprehensive weather dashboard displaying current conditions, 
 * a 7-day forecast, and various environmental metrics (Wind, UV, etc.).
 */
const WeatherScreen: React.FC<WeatherScreenProps> = ({ 
    latitude, 
    longitude, 
    locationName, 
    onBackPress, 
    onRefreshPress 
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;
    
    const { 
        latitude: activeLat, 
        longitude: activeLon, 
        locationName: displayName, 
        geocodedName,
        isLocating
    } = useLocation({ 
        propLatitude: latitude, 
        propLongitude: longitude, 
        propLocationName: locationName 
    });

    const [refreshing, setRefreshing] = useState<boolean>(false);

    const { weatherData, loading, error, refetch } = useWeather(activeLat, activeLon);

    const lastUpdatedLabel = React.useMemo(
        () => formatLastUpdatedLabel(weatherData?.lastUpdated),
        [weatherData?.lastUpdated]
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (onRefreshPress) await onRefreshPress(); 
        await refetch();
        setRefreshing(false);
    }, [onRefreshPress, refetch]);

    const display = formatWeatherDisplay(weatherData);
    const hasData = display.hasData;

    // Raw numeric values kept only for alert-level color thresholds
    const windRaw = weatherData?.windSpeed;
    const precipRaw = weatherData?.precipitationProbability;
    const uvRaw = weatherData?.uvIndex;

    if (((loading || isLocating) && !weatherData) || refreshing) {
        return <WeatherSkeleton onBackPress={onBackPress} />;
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Weather" centerTitle={true} onBackPress={onBackPress} />

            <ResponsiveScrollView 
                style={styles.container}
                contentContainerStyle={[
                    styles.scrollContent, 
                    isWideScreen && styles.scrollContentWide,
                    { paddingBottom: insets.bottom + 48 }
                ]}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={[Colors.PRIMARY]} 
                    />
                }
            >
                {error && !weatherData ? (
                    <View style={styles.errorContainer}>
                        <CustomIcon library="Ionicons" name="warning-outline" size={48} color={Colors.ERROR} />
                        <CustomText variant="body" style={styles.errorText}>
                            {error || "Unable to load weather data."}
                        </CustomText>
                        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                            <CustomText style={styles.retryText}>Retry Connection</CustomText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.heroSection}>
                            <View style={styles.heroTop}>
                                <View style={styles.hiLoContainer}>
                                    <CustomIcon library="Ionicons" name="sunny" size={14} color={Colors.WEATHER_SUN} />
                                    <CustomText variant="label" style={styles.hiLoText}>Day {display.dayTemp}°</CustomText>
                                    
                                    <View style={styles.dotSeparator} />
                                    
                                    <CustomIcon library="Ionicons" name="moon" size={14} color={Colors.WEATHER_MOON} />
                                    <CustomText variant="label" style={styles.hiLoText}>Night {display.nightTemp}°</CustomText>
                                </View>
                            </View>

                            <View style={styles.mainWeatherRow}>
                                <View style={styles.tempBlock}>
                                    <View style={styles.tempContainer}>
                                        <CustomText style={styles.mainTemp}>{display.temperature}°</CustomText>
                                        <CustomText variant="h2" style={styles.tempUnit}>C</CustomText>
                                    </View>
                                    {display.feelsLike != null && (
                                        <CustomText variant="caption" style={styles.feelsLikeHero}>
                                            Feels like {display.feelsLike}°C
                                        </CustomText>
                                    )}
                                </View>

                                <View style={styles.iconBlock}>
                                    <CustomIcon 
                                        library={display.library as IconLibrary} 
                                        name={hasData ? display.icon : "cloud-offline-outline"} 
                                        size={80} 
                                        color={Colors.PRIMARY} 
                                    />
                                    <CustomText variant="label" style={styles.conditionText}>
                                        {hasData ? display.condition : "Loading"}
                                    </CustomText>
                                </View>
                            </View>
                            
                            <View style={styles.heroDivider} />
                            
                            <View style={styles.metadataRow}>
                                <View style={styles.locationWrapper}>
                                    <View style={styles.locationRow}>
                                        <CustomIcon 
                                            library="FontAwesome6" 
                                            name="location-dot"  
                                            size={14} 
                                            color={Colors.PRIMARY} 
                                        />
                                        <CustomText variant="label" style={styles.locationLabel} numberOfLines={1}>
                                            {displayName}
                                        </CustomText>
                                    </View>
                                    {geocodedName !== displayName && (
                                        <CustomText variant="caption" style={styles.geocodedLabel} numberOfLines={1}>
                                            {geocodedName || "Fetching exact location..."}
                                        </CustomText>
                                    )}
                                </View>
                                {lastUpdatedLabel && (
                                    <CustomText variant="caption" style={styles.lastUpdatedLabel}>
                                        Updated {lastUpdatedLabel}
                                    </CustomText>
                                )}
                            </View>
                        </View>
                        <View style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <CustomIcon 
                                    library="Ionicons" 
                                    name="calendar-outline" 
                                    size={20} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText variant="label" style={styles.cardHeaderTitle}>7-Day Forecast</CustomText>
                            </View>
                            
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                contentContainerStyle={styles.forecastRow}
                            >
                                {weatherData?.forecast?.map((day, idx) => {
                                    const { icon, library } = getWeatherInfoUI(day.weatherCode);
                                    const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                                    return (
                                        <ForecastItem 
                                            key={idx} 
                                            day={dayName} 
                                            icon={icon} 
                                            lib={library as IconLibrary}
                                            low={Math.round(day.temperatureMin)} 
                                            high={Math.round(day.temperatureMax)} 
                                            isToday={idx === 0}
                                        />
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View style={styles.bentoGrid}>
                            <BentoBox 
                                title="Wind" 
                                value={display.windSpeed} 
                                unit="km/h" 
                                desc="Current speed" 
                                icon="wind" 
                                lib="Feather" 
                                alertLevel={getMetricAlertLevel('wind', windRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Precipitation" 
                                value={display.precipChance} 
                                unit="%" 
                                desc="Chance of rain" 
                                icon="rainy-outline" 
                                lib="Ionicons" 
                                alertLevel={getMetricAlertLevel('precip', precipRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="UV Index" 
                                value={display.uvIndex} 
                                subValue={weatherData?.uvIndexMax ? `Peak: ${Math.round(weatherData.uvIndexMax)}` : undefined}
                                unit="" 
                                desc={getUVIndexReminder(uvRaw)}
                                icon="thermometer-outline"  
                                lib="Ionicons" 
                                alertLevel={getMetricAlertLevel('uv', uvRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Humidity" 
                                value={display.humidity} 
                                unit="%" 
                                desc="Relative humidity" 
                                icon="water-outline" 
                                lib="Ionicons" 
                                isDesktop={isDesktop}
                            />
                        </View>

                        <View style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <CustomIcon 
                                    library="Ionicons" 
                                    name="sunny-outline" 
                                    size={20} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText variant="label" style={styles.cardHeaderTitle}>Sun</CustomText>
                            </View>
                            
                            <View style={styles.sunTimeRow}>
                                <View style={styles.sunItem}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="sunrise" 
                                        size={32} 
                                        color={Colors.WEATHER_SUN} 
                                    />
                                    <View>
                                        <CustomText style={styles.sunTimeText}>{display.sunrise}</CustomText>
                                        <CustomText variant="caption" style={styles.sunLabel}>Sunrise</CustomText>
                                    </View>
                                </View>
                                
                                <View style={styles.sunConnector} />

                                <View style={[styles.sunItem, { alignItems: 'flex-end' }]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="sunset" 
                                        size={32} 
                                        color={Colors.WEATHER_MOON} 
                                    />
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <CustomText style={styles.sunTimeText}>{display.sunset}</CustomText>
                                        <CustomText variant="caption" style={styles.sunLabel}>Sunset</CustomText>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

interface ForecastItemProps {
    day: string;
    icon: string;
    lib: IconLibrary;
    low: number;
    high: number;
    isToday: boolean;
}

const ForecastItem = ({ day, icon, lib, low, high, isToday }: ForecastItemProps) => (
    <View style={[styles.fItem, isToday && styles.fItemToday]}>        
        <CustomText variant="label" style={[styles.fDay, isToday && styles.fDayToday]}>
            {isToday ? "Today" : day}
        </CustomText>
        <View style={styles.fIconWrapper}>
            <CustomIcon 
                library={lib} 
                name={icon} 
                size={26} 
                color={Colors.PRIMARY} 
            />
        </View>
        <View style={styles.fTempRow}>
            <CustomText variant="label" style={styles.fTempHigh}>{high}°</CustomText>
            <CustomText style={styles.fTempSeparator}>/</CustomText>
            <CustomText variant="caption" style={styles.fTempLow}>{low}°</CustomText>
        </View> 
    </View>
);

interface BentoBoxProps {
    title: string;
    value: string | number | undefined;
    unit: string;
    desc: string;
    icon: string;
    lib: IconLibrary;
    alertLevel?: AlertLevel;
    isDesktop: boolean;
    subValue?: string;
}

const BentoBox: React.FC<BentoBoxProps> = ({ 
    title, 
    value, 
    unit, 
    desc, 
    icon, 
    lib, 
    alertLevel = 'normal', 
    isDesktop, 
    subValue 
}) => {
    const iconColor = alertLevel === 'danger' ? Colors.ERROR : alertLevel === 'warning' ? Colors.WARNING : Colors.PRIMARY;
    const valueColor = alertLevel === 'danger' ? Colors.ERROR : alertLevel === 'warning' ? Colors.WARNING : Colors.TEXT_PRIMARY;

    return (
        <View style={[styles.bentoBox, isDesktop && styles.bentoBoxDesktop]}>
            <View style={styles.bentoHeader}>
                <CustomIcon library={lib} name={icon} size={20} color={iconColor} />
                <CustomText variant="label" style={styles.bentoTitle}>{title}</CustomText>
            </View>

            <View style={styles.bentoMiddle}>
                <CustomText style={[styles.bentoValue, { color: valueColor }]}>
                    {value !== undefined ? value : '--'}
                </CustomText>
                {unit ? (
                    <CustomText style={[styles.bentoUnit, { color: valueColor }]}>
                        {unit}
                    </CustomText>
                ) : null}
                {subValue ? (
                    <CustomText style={styles.bentoSubValue}>
                        {subValue}
                    </CustomText>
                ) : null}
            </View>

            <View style={styles.bentoBottom}>
                <CustomText variant="caption" style={styles.bentoDesc}>{desc}</CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1,
    },
    scrollContent: { 
        paddingHorizontal: 16,
        gap: 16, 
    },

    scrollContentWide: {
        maxWidth: 860,
        width: '100%',
        alignSelf: 'center',
    },
    
    heroSection: { 
        paddingBottom: 0, 
        paddingHorizontal: 8,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    locationWrapper: {
        flex: 1,
        paddingRight: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationLabel: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 15,
    },
    geocodedLabel: {
        marginLeft: 20,
        marginTop: 2,
        color: Colors.TEXT_SECONDARY,
    },
    lastUpdatedLabel: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
        lineHeight: 18,
    },
    mainWeatherRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tempBlock: {
        alignItems: 'flex-start',
        flex: 1,
    },
    tempContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    mainTemp: {
        fontSize: 84, 
        lineHeight: 90,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -3,
    },
    tempUnit: {
        marginTop: 14,
        marginLeft: 4,
        color: Colors.TEXT_PRIMARY,
    },
    feelsLikeHero: {
        color: Colors.PRIMARY,
        fontWeight: '600',
        marginTop: -6,
        marginLeft: 6,
        fontSize: 14,
    },
    iconBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    conditionText: {
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: -4,
    },
    heroDivider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginVertical: 16, 
    },
    heroTop: {
        alignItems: 'center', 
        justifyContent: 'center',
        paddingBottom: 8,
    },
    hiLoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    hiLoText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.GRAY_MEDIUM,
        marginHorizontal: 4,
    },

    fullWidthCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 20, 
        padding: 20, 
        gap: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...GlobalStyles.dropShadow(3) 
    },
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 4 
    },
    cardHeaderTitle: { 
        color: Colors.TEXT_SECONDARY, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
    },

    forecastRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        flexGrow: 1,
        justifyContent: 'center',
    },
    fItem: { 
        alignItems: 'center', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        paddingVertical: 16, 
        paddingHorizontal: 12, 
        borderRadius: 16, 
        gap: 4, 
        minWidth: 70,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    fItemToday: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
    },
    fIconWrapper: { 
        height: 36, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    fDay: { 
        color: Colors.TEXT_SECONDARY 
    },
    fDayToday: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    fTempRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    fTempHigh: { 
        color: Colors.TEXT_PRIMARY 
    },
    fTempSeparator: { 
        fontSize: 12, 
        color: Colors.GRAY_MEDIUM, 
        marginHorizontal: 2 
    },
    fTempLow: { 
        color: Colors.TEXT_SECONDARY 
    },

    bentoGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: 16 
    },
    bentoBox: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 20, 
        padding: 16, 
        width: '47.5%', 
        minHeight: 140, 
        display: 'flex',
        flexDirection: 'column',
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...GlobalStyles.dropShadow(3) 
    },

    bentoBoxDesktop: {
        width: '23.5%',
    },
    bentoHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    bentoTitle: { 
        color: Colors.TEXT_SECONDARY 
    },
    bentoMiddle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end', 
        justifyContent: 'flex-start',
        marginTop: 16,
    },
    bentoValue: { 
        fontSize: 32, 
        fontWeight: '900', 
        includeFontPadding: false,
    },
    bentoSubValue: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginLeft: 6,
        fontWeight: '700',
        alignSelf: 'flex-end',
        marginBottom: 4,
    },
    bentoUnit: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
        marginBottom: 4, 
    },
    bentoBottom: {
        marginTop: 16,
        justifyContent: 'flex-end',
    },
    bentoDesc: { 
        color: Colors.TEXT_SECONDARY 
    },

    sunTimeRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    sunItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 
    },
    sunTimeText: { 
        fontSize: 20, 
        fontWeight: '800', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 2 
    },
    sunLabel: { 
        color: Colors.TEXT_SECONDARY, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
    },
    sunConnector: { 
        flex: 1, 
        height: 1, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed',
        marginHorizontal: 16,
    },
    
    errorContainer: { 
        marginTop: 60, 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24, 
        gap: 16 
    },
    errorText: { 
        color: Colors.ERROR, 
        textAlign: 'center', 
        marginBottom: 8 
    },
    retryBtn: { 
        backgroundColor: Colors.PRIMARY, 
        paddingHorizontal: 24, 
        paddingVertical: 12, 
        borderRadius: 12 
    },
    retryText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    }
});

export default WeatherScreen;
