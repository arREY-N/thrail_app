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
import {
    formatLastUpdatedLabel,
    formatWeatherDisplay,
    getBeaufortWindInfo,
    getHourlyForecastForDay,
    getPAGASAHeatIndexInfo,
    getPAGASARainfallWarning,
    getSummitVisibilityInfo,
    getWeatherInfoUI,
} from '@/src/core/utility/weatherHelpers';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';
import { IconLibrary } from '@/src/types/ui.types';

import WeatherSkeleton from '@/src/features/Home/components/WeatherSkeleton';
import { WeatherSafetyCard } from '@/src/components/WeatherSafetyCard';

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
    if (type === 'precip') return value >= 85 ? 'warning' : value >= 50 ? 'warning' : 'normal';
    if (type === 'uv') return value >= 11 ? 'danger' : value >= 8 ? 'warning' : 'normal';
    return 'normal';
};

/**
 * Helper to generate a supportive safety reminder based on the UV index value.
 * Context-aware: notes cloud filtering when overcast or rainy.
 */
const getUVIndexReminder = (
    value: number | undefined | null,
    cloudCover?: number | null,
    weatherCode?: number | null
): string => {
    if (value === undefined || value === null) return "No UV data available";
    const isCloudyOrRainy = (cloudCover != null && cloudCover >= 70) || (weatherCode != null && weatherCode >= 51);
    if (isCloudyOrRainy) {
        return "Clouds reduce direct solar UV.";
    }
    if (value <= 2) return "Low risk.";
    if (value <= 5) return "Moderate risk.";
    if (value <= 7) return "High risk (sunscreen advised).";
    if (value <= 10) return "Very high risk (avoid midday sun).";
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

    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

    const activeDay = weatherData?.forecast?.at(selectedDayIndex) ?? weatherData?.forecast?.at(0);
    const isTodaySelected = selectedDayIndex === 0;

    const activeHourlyList = getHourlyForecastForDay(weatherData, selectedDayIndex);

    // Active metrics computed based on selected day
    const activeWindRaw = isTodaySelected ? (weatherData?.windSpeed ?? 0) : (activeDay?.windSpeedMax ?? 0);
    const activePrecipRaw = isTodaySelected ? (weatherData?.precipitationProbability ?? 0) : (activeDay?.precipitationProbabilityMax ?? 0);
    const activeUvRaw = isTodaySelected ? (weatherData?.uvIndex ?? 0) : (activeDay?.uvIndexMax ?? 0);

    const pagasaRain = getPAGASARainfallWarning(
        activePrecipRaw,
        isTodaySelected ? (weatherData?.precipitationSum ?? 0) : 0,
        isTodaySelected ? (weatherData?.weatherCode ?? 0) : (activeDay?.weatherCode ?? 0)
    );

    const heatIndexVal = isTodaySelected
        ? (weatherData?.apparentTemperature != null ? weatherData.apparentTemperature : weatherData?.temperature)
        : activeDay?.temperatureMax;
    const pagasaHeat = getPAGASAHeatIndexInfo(heatIndexVal);

    const beaufortWind = getBeaufortWindInfo(
        activeWindRaw,
        isTodaySelected ? (weatherData?.windGusts ?? 0) : activeWindRaw,
        weatherData?.windDirection ?? 0
    );

    const visibilityInfo = getSummitVisibilityInfo(
        weatherData?.visibility ?? 10000,
        weatherData?.cloudCover ?? 0
    );

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
                                    {isLocating ? (
                                        <CustomText variant="caption" style={styles.geocodedLabel} numberOfLines={1}>
                                            Fetching exact location...
                                        </CustomText>
                                    ) : geocodedName && geocodedName !== displayName ? (
                                        <CustomText variant="caption" style={styles.geocodedLabel} numberOfLines={1}>
                                            {geocodedName}
                                        </CustomText>
                                    ) : null}
                                </View>
                                {lastUpdatedLabel && (
                                    <CustomText variant="caption" style={styles.lastUpdatedLabel}>
                                        Updated {lastUpdatedLabel}
                                    </CustomText>
                                )}
                            </View>
                        </View>

                        {/* Outdoor Safety Advisory & Actionable Checklist */}
                        <WeatherSafetyCard
                            weatherData={weatherData}
                            trailName={displayName}
                            showChecklist={true}
                        />                        <View style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <CustomIcon 
                                    library="Ionicons" 
                                    name="calendar-outline" 
                                    size={20} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText variant="label" style={styles.cardHeaderTitle}>{'7-Day Forecast'}</CustomText>
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
                                            isSelected={selectedDayIndex === idx}
                                            onPress={() => setSelectedDayIndex(idx)}
                                        />
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* 24-Hour Hourly Forecast Section */}
                        {activeHourlyList.length > 0 && (
                            <View style={styles.fullWidthCard}>
                                <View style={styles.cardHeader}>
                                    <CustomIcon 
                                        library="Ionicons" 
                                        name="time-outline" 
                                        size={20} 
                                        color={Colors.PRIMARY} 
                                    />
                                    <CustomText variant="label" style={styles.cardHeaderTitle}>
                                        {isTodaySelected 
                                            ? 'Hourly Forecast (Today)' 
                                            : `Hourly Forecast (${new Date(activeDay?.date || '').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`}
                                    </CustomText>
                                </View>
                                
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    contentContainerStyle={styles.hourlyScrollContent}
                                >
                                    {activeHourlyList.map((hour, hIdx) => {
                                        const { icon, library } = getWeatherInfoUI(hour.weatherCode);
                                        return (
                                            <HourlyItem 
                                                key={hIdx}
                                                hourLabel={hour.hourLabel}
                                                icon={icon}
                                                lib={library as IconLibrary}
                                                temperature={hour.temperature}
                                                precipChance={hour.precipitationProbability}
                                                isNow={hour.hourLabel === 'Now'}
                                            />
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.bentoGrid}>
                            <BentoBox 
                                title="Heat Index" 
                                value={display.feelsLike ?? display.temperature} 
                                unit="°C" 
                                subValue={pagasaHeat.category}
                                desc={pagasaHeat.description} 
                                icon="thermometer" 
                                lib="Feather" 
                                alertLevel={pagasaHeat.alertLevel} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Precipitation" 
                                value={isTodaySelected ? display.precipChance : String(activePrecipRaw)} 
                                unit="%" 
                                subValue={weatherData?.precipitationSum ? `${weatherData.precipitationSum.toFixed(1)} mm • ${pagasaRain.warningLevel}` : `${pagasaRain.warningLevel} Warning`}
                                desc={pagasaRain.description} 
                                icon="rainy-outline" 
                                lib="Ionicons" 
                                alertLevel={pagasaRain.alertLevel} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Wind & Gusts" 
                                value={isTodaySelected ? display.windSpeed : String(activeWindRaw)} 
                                unit="km/h" 
                                subValue={beaufortWind.gustText}
                                desc={`${beaufortWind.directionText} • ${beaufortWind.scale}`} 
                                icon="wind" 
                                lib="Feather" 
                                alertLevel={beaufortWind.alertLevel} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="UV Index" 
                                value={isTodaySelected ? display.uvIndex : String(Math.round(activeUvRaw))} 
                                unit="" 
                                subValue={weatherData?.uvIndexMax ? `Peak: ${Math.round(weatherData.uvIndexMax)}` : 'Low Risk'}
                                desc={getUVIndexReminder(activeUvRaw, weatherData?.cloudCover, isTodaySelected ? weatherData?.weatherCode : activeDay?.weatherCode)} 
                                icon="sun"  
                                lib="Feather" 
                                alertLevel={getMetricAlertLevel('uv', activeUvRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Visibility" 
                                value={weatherData?.visibility != null ? (weatherData.visibility / 1000).toFixed(1) : '10'} 
                                unit="km" 
                                subValue={visibilityInfo.cloudText}
                                desc={visibilityInfo.description} 
                                icon="eye-outline" 
                                lib="Ionicons" 
                                alertLevel={visibilityInfo.alertLevel} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Atmospheric Air" 
                                value={display.humidity} 
                                unit="% RH" 
                                subValue={weatherData?.surfacePressure ? `${weatherData.surfacePressure} hPa` : '1013 hPa'}
                                desc={weatherData?.surfacePressure && weatherData.surfacePressure < 1008 ? 'Low Pressure Area (LPA) activity.' : 'Stable tropical atmospheric pressure.'} 
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
                                <CustomText variant="label" style={styles.cardHeaderTitle}>{'Sun'}</CustomText>
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
                                        <CustomText variant="caption" style={styles.sunLabel}>{'Sunrise'}</CustomText>
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
                                        <CustomText variant="caption" style={styles.sunLabel}>{'Sunset'}</CustomText>
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
    isSelected: boolean;
    onPress: () => void;
}

const ForecastItem = ({ day, icon, lib, low, high, isToday, isSelected, onPress }: ForecastItemProps) => (
    <TouchableOpacity 
        style={[
            styles.fItem, 
            isSelected ? styles.fItemSelected : (isToday ? styles.fItemToday : undefined)
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >        
        <CustomText variant="label" style={[styles.fDay, (isSelected || isToday) && styles.fDayActive]}>
            {isToday ? "Today" : day}
        </CustomText>
        <View style={styles.fIconWrapper}>
            <CustomIcon 
                library={lib} 
                name={icon} 
                size={26} 
                color={isSelected ? Colors.PRIMARY : Colors.TEXT_PRIMARY} 
            />
        </View>
        <View style={styles.fTempRow}>
            <CustomText variant="label" style={styles.fTempHigh}>{high}°</CustomText>
            <CustomText style={styles.fTempSeparator}>/</CustomText>
            <CustomText variant="caption" style={styles.fTempLow}>{low}°</CustomText>
        </View> 
    </TouchableOpacity>
);

interface HourlyItemProps {
    hourLabel: string;
    icon: string;
    lib: IconLibrary;
    temperature: number;
    precipChance: number;
    isNow: boolean;
}

const HourlyItem = ({ hourLabel, icon, lib, temperature, precipChance, isNow }: HourlyItemProps) => (
    <View style={[styles.hourlyItem, isNow && styles.hourlyItemNow]}>
        <CustomText variant="caption" style={[styles.hourTimeText, isNow && styles.hourTimeNow]}>
            {hourLabel}
        </CustomText>
        <View style={styles.hourlyIconWrapper}>
            <CustomIcon 
                library={lib} 
                name={icon} 
                size={22} 
                color={isNow ? Colors.PRIMARY : Colors.TEXT_PRIMARY} 
            />
        </View>
        <CustomText variant="label" style={styles.hourlyTempText}>
            {temperature}°
        </CustomText>
        <View style={styles.hourlyPrecipRow}>
            <CustomIcon 
                library="Ionicons" 
                name="water-outline" 
                size={10} 
                color={precipChance > 30 ? Colors.ERROR : Colors.TEXT_SECONDARY} 
            />
            <CustomText 
                variant="caption" 
                style={[
                    styles.hourlyPrecipText, 
                    precipChance > 30 && { color: Colors.ERROR, fontWeight: '700' }
                ]}
            >
                {precipChance}%
            </CustomText>
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
                <CustomIcon library={lib} name={icon} size={16} color={iconColor} />
                <CustomText variant="caption" style={styles.bentoTitle} numberOfLines={1}>
                    {title}
                </CustomText>
            </View>

            <View style={styles.bentoMiddle}>
                <View style={styles.bentoMainRow}>
                    <CustomText style={[styles.bentoValue, { color: valueColor }]} numberOfLines={1}>
                        {value !== undefined ? value : '--'}
                    </CustomText>
                    {unit ? (
                        <CustomText style={[styles.bentoUnit, { color: valueColor }]}>
                            {unit}
                        </CustomText>
                    ) : null}
                </View>

                {subValue ? (
                    <View style={[
                        styles.bentoSubBadge, 
                        alertLevel === 'danger' ? styles.badgeDanger : alertLevel === 'warning' ? styles.badgeWarning : styles.badgeNormal
                    ]}>
                        <CustomText 
                            style={[styles.bentoSubValue, alertLevel !== 'normal' && styles.bentoSubValueAlert]} 
                            numberOfLines={1}
                        >
                            {subValue}
                        </CustomText>
                    </View>
                ) : null}
            </View>

            <View style={styles.bentoBottom}>
                <CustomText variant="caption" style={styles.bentoDesc} numberOfLines={2}>
                    {desc}
                </CustomText>
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
        borderColor: Colors.GRAY_LIGHT,
    },
    fItemSelected: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
        ...GlobalStyles.dropShadow(2, 0.1, Colors.PRIMARY),
    },
    fIconWrapper: { 
        height: 36, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    fDay: { 
        color: Colors.TEXT_SECONDARY 
    },
    fDayActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
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

    hourlyScrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    hourlyItem: {
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 16,
        gap: 6,
        minWidth: 64,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    hourlyItemNow: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
        ...GlobalStyles.dropShadow(2, 0.08, Colors.PRIMARY),
    },
    hourTimeText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 12,
    },
    hourTimeNow: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    hourlyIconWrapper: {
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hourlyTempText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '700',
        fontSize: 15,
    },
    hourlyPrecipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    hourlyPrecipText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },

    bentoGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: 12, 
    },
    bentoBox: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 18, 
        padding: 14, 
        width: '48%', 
        minHeight: 155, 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...GlobalStyles.dropShadow(2, 0.06, Colors.SHADOW, { radius: 8 }), 
    },

    bentoBoxDesktop: {
        width: '23.5%',
    },
    bentoHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
    },
    bentoTitle: { 
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    bentoMiddle: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        marginVertical: 4,
    },
    bentoMainRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    bentoValue: { 
        fontSize: 26, 
        fontWeight: '900', 
        lineHeight: 30,
        includeFontPadding: false,
    },
    bentoUnit: {
        fontSize: 13,
        fontWeight: '700',
    },
    bentoSubBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        maxWidth: '100%',
        marginTop: 2,
    },
    badgeNormal: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    badgeWarning: {
        backgroundColor: '#FEF3C7',
    },
    badgeDanger: {
        backgroundColor: '#FEE2E2',
    },
    bentoSubValue: {
        fontSize: 10,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    bentoSubValueAlert: {
        fontWeight: '700',
    },
    bentoBottom: {
        marginTop: 2,
    },
    bentoDesc: { 
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        lineHeight: 14,
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
