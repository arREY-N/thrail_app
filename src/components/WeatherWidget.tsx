import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { WeatherSafetyCard } from '@/src/components/WeatherSafetyCard';
import { WeatherWidgetSkeleton } from '@/src/features/Home/components/WeatherSkeleton';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IconLibrary } from '@/src/types/ui.types';
import { ProcessedWeatherData } from '../core/types/weather';
import {
    formatForecastDay,
    formatLastUpdatedLabel,
    formatSunTime,
    getBeaufortWindInfo,
    getCurrentHourIndex,
    getDetailedWeatherSafety,
    getHourlyForecastForDay,
    getPAGASAHeatIndexInfo,
    getPAGASARainfallWarning,
    getSummitVisibilityInfo,
    getWeatherInfoUI,
} from '../core/utility/weatherHelpers';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useWeather } from '../hooks/useWeather';

interface WeatherWidgetProps {
    latitude: number;
    longitude: number;
    elevation?: number;
    trailName?: string;
    showSafetyCard?: boolean;
}

interface SafetyTheme {
    bg: string;
    text: string;
    icon: string;
}

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

interface BentoBoxProps {
    title: string;
    value: string | number | undefined;
    unit: string;
    desc: string;
    icon: string;
    lib: IconLibrary;
    alertLevel?: 'normal' | 'warning' | 'danger';
    subValue?: string;
    isDesktop?: boolean;
    isTablet?: boolean;
}

const BentoBox: React.FC<BentoBoxProps> = ({ 
    title, 
    value, 
    unit, 
    desc, 
    icon, 
    lib, 
    alertLevel = 'normal', 
    subValue,
    isDesktop,
    isTablet
}) => {
    const iconColor = alertLevel === 'danger' ? Colors.ERROR : alertLevel === 'warning' ? Colors.WARNING : Colors.PRIMARY;
    const valueColor = Colors.TEXT_PRIMARY;
    const isMultiColumn = isDesktop || isTablet;

    return (
        <View 
            style={[
                styles.bentoBox,
                isTablet && styles.bentoBoxTablet,
                isDesktop && styles.bentoBoxDesktop
            ]}
            {...(Platform.OS === 'web' ? { title: desc } : {})}
        >
            <View style={styles.bentoHeader}>
                <CustomIcon library={lib} name={icon} size={16} color={iconColor} />
                <CustomText variant="caption" style={styles.bentoTitle} numberOfLines={1}>
                    {title}
                </CustomText>
            </View>

            <View style={[styles.bentoMiddle, !isMultiColumn && styles.bentoMiddleMobile]}>
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
                <CustomText variant="caption" style={styles.bentoDesc} numberOfLines={isDesktop ? 3 : 2}>
                    {desc}
                </CustomText>
            </View>
        </View>
    );
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    latitude,
    longitude,
    elevation,
    trailName,
    showSafetyCard = true,
}) => {
    const { weatherData: data, loading, error, refetch } = useWeather(latitude, longitude, elevation);
    const { isDesktop, isTablet } = useBreakpoints();
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
    const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

    const forecastScrollRef = useRef<ScrollView>(null);
    const hourlyScrollRef = useRef<ScrollView>(null);

    const {
        showLeftFade: showForecastLeftFade,
        showRightFade: showForecastRightFade,
        scrollProps: forecastScrollProps,
    } = useScrollFades();

    const {
        showLeftFade: showHourlyLeftFade,
        showRightFade: showHourlyRightFade,
        scrollProps: hourlyScrollProps,
    } = useScrollFades();

    useWebDragScroll(forecastScrollRef, !!data?.forecast?.length);
    useWebDragScroll(hourlyScrollRef, !!data?.forecast?.length);

    const lastUpdatedLabel = useMemo(
        () => formatLastUpdatedLabel(data?.lastUpdated),
        [data?.lastUpdated]
    );

    const weatherData = data as ProcessedWeatherData;
    const activeDay = weatherData?.forecast?.at(selectedDayIndex) ?? weatherData?.forecast?.at(0);
    const isTodaySelected = selectedDayIndex === 0;

    const activeHourlyList = useMemo(() => {
        return weatherData ? getHourlyForecastForDay(weatherData, selectedDayIndex) : [];
    }, [weatherData, selectedDayIndex]);

    const activeHour = activeHourlyList.at(selectedHourIndex);
    const isLiveNowSelected = isTodaySelected && selectedHourIndex === 0;

    const effectiveWeatherData: ProcessedWeatherData = useMemo(() => {
        if (!weatherData) return weatherData;
        if (isLiveNowSelected || !activeHour) {
            const curIdx = getCurrentHourIndex(weatherData.hourlyForecast);
            const liveCurrentHour = activeHour ?? weatherData.hourlyForecast?.[curIdx];
            if (!liveCurrentHour) return weatherData;

            let liveCode = weatherData.weatherCode;
            if (liveCode <= 1 && (liveCurrentHour.weatherCode >= 51 || (liveCurrentHour.precipitationProbability ?? 0) >= 50)) {
                liveCode = liveCurrentHour.weatherCode >= 51 ? liveCurrentHour.weatherCode : 61;
            }

            return {
                ...weatherData,
                weatherCode: liveCode,
                precipitationProbability: liveCurrentHour.precipitationProbability ?? weatherData.precipitationProbability,
                hourlyForecast: [liveCurrentHour],
            };
        }

        return {
            ...weatherData,
            temperature: activeHour.temperature,
            apparentTemperature: activeHour.apparentTemperature,
            weatherCode: activeHour.weatherCode,
            precipitationProbability: activeHour.precipitationProbability,
            windSpeed: activeHour.windSpeed,
            windGusts: activeHour.windGusts ?? activeHour.windSpeed,
            windDirection: activeHour.windDirection ?? weatherData.windDirection,
            uvIndex: activeHour.uvIndex,
            visibility: activeHour.visibility ?? weatherData.visibility,
            hourlyForecast: [activeHour],
        };
    }, [weatherData, isLiveNowSelected, activeHour]);

    const effectiveSafetyReport = useMemo(() => {
        if (!effectiveWeatherData) return undefined;
        return getDetailedWeatherSafety(effectiveWeatherData, trailName);
    }, [effectiveWeatherData, trailName]);

    const safetyLevel = effectiveSafetyReport?.status ?? "SAFE";
    const { condition: currentCondition } = getWeatherInfoUI(effectiveWeatherData?.weatherCode);

    const getSafetyTheme = (level: string): SafetyTheme => {
        switch (level) {
            case 'SAFE':
                return { 
                    bg: Colors.WEATHER_SAFE_BG, 
                    text: Colors.WEATHER_SAFE_MAIN, 
                    icon: 'check-circle' 
                };
            case 'CAUTION':
                return { 
                    bg: Colors.WEATHER_CAUTION_BG, 
                    text: Colors.WEATHER_CAUTION_MAIN, 
                    icon: 'alert-triangle' 
                };
            case 'DANGER':
                return { 
                    bg: Colors.WEATHER_DANGER_BG, 
                    text: Colors.WEATHER_DANGER_MAIN, 
                    icon: 'alert-octagon' 
                };
            default:
                return { 
                    bg: Colors.GRAY_ULTRALIGHT, 
                    text: Colors.TEXT_SECONDARY, 
                    icon: 'info' 
                };
        }
    };

    const theme = getSafetyTheme(safetyLevel);

    const heatVal = effectiveWeatherData
        ? (effectiveWeatherData.apparentTemperature != null ? effectiveWeatherData.apparentTemperature : effectiveWeatherData.temperature)
        : 0;
    const pagasaHeat = getPAGASAHeatIndexInfo(heatVal);

    // Always match the currently selected hour's exact precipitation probability (Option A)
    const effectivePrecip = effectiveWeatherData?.precipitationProbability ?? 0;

    const pagasaRain = getPAGASARainfallWarning(
        effectivePrecip,
        isLiveNowSelected ? (weatherData?.precipitationSum ?? 0) : 0,
        effectiveWeatherData?.weatherCode ?? 0,
        isLiveNowSelected ? weatherData?.precipitationRate : undefined
    );

    const beaufortWind = getBeaufortWindInfo(
        effectiveWeatherData?.windSpeed ?? 0,
        effectiveWeatherData?.windGusts ?? effectiveWeatherData?.windSpeed ?? 0,
        effectiveWeatherData?.windDirection ?? 0
    );

    const visibilityInfo = getSummitVisibilityInfo(
        effectiveWeatherData?.visibility ?? 10000,
        effectiveWeatherData?.cloudCover ?? 0
    );

    if (error && !data) {
        return (
            <View style={styles.centerContent}>
                <CustomIcon library="Ionicons" name="warning-outline" size={32} color={Colors.ERROR} />
                <CustomText style={styles.errorText}>Unable to load weather data</CustomText>
            </View>
        );
    }

    if (!data) {
        return <WeatherWidgetSkeleton />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.currentSection}>
                <View style={styles.tempWrapper}>
                    <View style={styles.tempSpacer} />
                    <CustomText style={styles.currentTemp}>
                        {effectiveWeatherData.temperature != null && !isNaN(effectiveWeatherData.temperature) ? Math.round(effectiveWeatherData.temperature) : '--'}
                    </CustomText>
                    <CustomText style={styles.degreeSymbol}>°C</CustomText>
                </View>
                <CustomText style={styles.currentCondition}>{currentCondition}</CustomText>
                
                {effectiveWeatherData.apparentTemperature != null && (
                    <CustomText variant="caption" style={styles.feelsLike}>
                        Feels like {Math.round(effectiveWeatherData.apparentTemperature)}°C ({pagasaHeat.category})
                    </CustomText>
                )}

                {(lastUpdatedLabel || Platform.OS === 'web') && (
                    <View style={styles.lastUpdatedRow}>
                        {lastUpdatedLabel && (
                            <CustomText variant="caption" style={styles.lastUpdatedText}>
                                Updated {lastUpdatedLabel}
                            </CustomText>
                        )}
                        {Platform.OS === 'web' && (
                            <TouchableOpacity
                                style={styles.webRefreshBtn}
                                onPress={refetch}
                                disabled={loading}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel="Refresh trail weather"
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="refresh-cw"
                                    size={12}
                                    color={Colors.PRIMARY}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.pillWrapper}>
                    <View style={[styles.safetyBanner, { backgroundColor: theme.bg }]}>
                        <CustomIcon library="Feather" name={theme.icon} size={18} color={theme.text} />
                        <CustomText style={[styles.safetyText, { color: theme.text }]}>
                            {safetyLevel} CONDITIONS
                        </CustomText>
                    </View>
                </View>
            </View>

            {/* Prominent Actionable Safety Card */}
            {showSafetyCard && effectiveSafetyReport && (
                <View style={styles.safetyCardWrapper}>
                    <WeatherSafetyCard
                        report={effectiveSafetyReport}
                        weatherData={effectiveWeatherData}
                        trailName={trailName}
                    />
                </View>
            )}

            {/* 7-Day Forecast Section */}
            {weatherData.forecast && weatherData.forecast.length > 0 && (
                <View style={styles.forecastSection}>
                    <View style={styles.forecastSectionHeader}>
                        <CustomIcon library="Ionicons" name="calendar-outline" size={18} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.forecastSectionTitle}>
                            {'7-Day Forecast'}
                        </CustomText>
                    </View>
                    <View style={styles.scrollWrapper}>
                        <ScrollView 
                            ref={forecastScrollRef}
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.forecastContent}
                            {...forecastScrollProps}
                        >
                            {weatherData.forecast.map((day, index) => {
                                const { icon, library } = getWeatherInfoUI(day.weatherCode);
                                const isToday = index === 0;
                                const isSelected = selectedDayIndex === index;
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[
                                            styles.forecastItem, 
                                            isSelected ? styles.forecastItemSelected : (isToday ? styles.forecastItemToday : undefined)
                                        ]}
                                        onPress={() => {
                                            setSelectedDayIndex(index);
                                            setSelectedHourIndex(0);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <CustomText variant="label" style={[styles.forecastDate, (isSelected || isToday) && styles.forecastDateActive]}>
                                            {isToday ? "Today" : formatForecastDay(day.date, index)}
                                        </CustomText>
                                        <View style={styles.fIconWrapper}>
                                            <CustomIcon library={library as IconLibrary} name={icon} size={26} color={isSelected ? Colors.PRIMARY : Colors.TEXT_PRIMARY} />
                                        </View>
                                        <View style={styles.forecastTempRow}>
                                            <CustomText variant="label" style={styles.forecastTempHigh}>{Math.round(day.temperatureMax)}°</CustomText>
                                            <CustomText style={styles.fTempSeparator}> / </CustomText>
                                            <CustomText variant="caption" style={styles.forecastTempLow}>{Math.round(day.temperatureMin)}°</CustomText>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {showForecastLeftFade && (
                            <LinearGradient
                                colors={[Colors.WHITE, Colors.WHITE_FADE, Colors.WHITE_TRANSPARENT]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.scrollFadeLeft}
                                pointerEvents="none"
                            />
                        )}

                        {showForecastRightFade && (
                            <LinearGradient
                                colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE_FADE, Colors.WHITE]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.scrollFadeRight}
                                pointerEvents="none"
                            />
                        )}
                    </View>
                </View>
            )}

            {/* Hourly Forecast Row for Selected Day */}
            {activeHourlyList.length > 0 && (
                <View style={styles.hourlySection}>
                    <View style={styles.hourlySectionHeader}>
                        <CustomIcon library="Ionicons" name="time-outline" size={18} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.hourlySectionTitle}>
                            {isTodaySelected 
                                ? 'Hourly Forecast (Today)' 
                                : `Hourly Forecast (${new Date(activeDay?.date || '').toLocaleDateString('en-US', { weekday: 'long' })})`}
                        </CustomText>
                    </View>
                    <View style={styles.scrollWrapper}>
                        <ScrollView 
                            ref={hourlyScrollRef}
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.hourlyContent}
                            {...hourlyScrollProps}
                        >
                            {activeHourlyList.map((hour, hIdx) => {
                                const { icon, library } = getWeatherInfoUI(hour.weatherCode);
                                const isSelected = selectedHourIndex === hIdx;
                                return (
                                    <TouchableOpacity 
                                        key={hIdx} 
                                        activeOpacity={0.7}
                                        onPress={() => setSelectedHourIndex(hIdx)}
                                        style={[styles.hourlyPill, isSelected && styles.hourlyPillNow]}
                                    >
                                        <CustomText variant="label" style={[styles.hourlyTime, isSelected && styles.hourlyTimeNow]}>
                                            {hour.hourLabel}
                                        </CustomText>
                                        <View style={styles.hourlyIconWrapper}>
                                            <CustomIcon library={library as IconLibrary} name={icon} size={26} color={isSelected ? Colors.PRIMARY : Colors.TEXT_PRIMARY} />
                                        </View>
                                        <View style={styles.hourlyBottomCol}>
                                            <CustomText variant="label" style={styles.hourlyTemp}>{hour.temperature}°</CustomText>
                                            <View style={styles.hourlyPrecip}>
                                                <CustomIcon library="Ionicons" name="water-outline" size={11} color={hour.precipitationProbability > 30 ? Colors.ERROR : Colors.TEXT_SECONDARY} />
                                                <CustomText variant="caption" style={[styles.hourlyPrecipText, hour.precipitationProbability > 30 && { color: Colors.ERROR, fontWeight: '700' }]}>
                                                    {hour.precipitationProbability}%
                                                </CustomText>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {showHourlyLeftFade && (
                            <LinearGradient
                                colors={[Colors.WHITE, Colors.WHITE_FADE, Colors.WHITE_TRANSPARENT]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.scrollFadeLeft}
                                pointerEvents="none"
                            />
                        )}

                        {showHourlyRightFade && (
                            <LinearGradient
                                colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE_FADE, Colors.WHITE]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.scrollFadeRight}
                                pointerEvents="none"
                            />
                        )}
                    </View>
                </View>
            )}

            <View style={styles.bentoGrid}>
                <BentoBox 
                    title="Heat Index" 
                    value={Math.round(heatVal ?? 0)} 
                    unit="°C" 
                    subValue={pagasaHeat.category}
                    desc={pagasaHeat.description} 
                    icon="thermometer" 
                    lib="Feather" 
                    alertLevel={pagasaHeat.alertLevel} 
                    isDesktop={isDesktop}
                    isTablet={isTablet}
                />
                <BentoBox 
                    title="Precipitation" 
                    value={effectivePrecip} 
                    unit="%" 
                    subValue={(isLiveNowSelected && weatherData.precipitationSum) ? `${weatherData.precipitationSum.toFixed(1)} mm • ${pagasaRain.badge}` : pagasaRain.badge}
                    desc={pagasaRain.description} 
                    icon="rainy-outline" 
                    lib="Ionicons" 
                    alertLevel={pagasaRain.alertLevel} 
                    isDesktop={isDesktop}
                    isTablet={isTablet}
                />
                <BentoBox 
                    title="Wind & Gusts" 
                    value={effectiveWeatherData.windSpeed} 
                    unit="km/h" 
                    subValue={beaufortWind.gustText}
                    desc={beaufortWind.description} 
                    icon="wind" 
                    lib="Feather" 
                    alertLevel={beaufortWind.alertLevel} 
                    isDesktop={isDesktop}
                    isTablet={isTablet}
                />
                <BentoBox 
                    title="UV Index" 
                    value={Math.round(effectiveWeatherData.uvIndex)} 
                    unit="" 
                    subValue={weatherData.uvIndexMax ? `Peak: ${Math.round(weatherData.uvIndexMax)}` : 'Low Risk'}
                    desc={getUVIndexReminder(effectiveWeatherData.uvIndex, weatherData.cloudCover, effectiveWeatherData.weatherCode)} 
                    icon="sun"  
                    lib="Feather" 
                    alertLevel={effectiveWeatherData.uvIndex >= 11 ? 'danger' : effectiveWeatherData.uvIndex >= 8 ? 'warning' : 'normal'} 
                    isDesktop={isDesktop}
                    isTablet={isTablet}
                />
                <BentoBox 
                    title="Visibility" 
                    value={effectiveWeatherData.visibility != null ? (effectiveWeatherData.visibility / 1000).toFixed(1) : '10'} 
                    unit="km" 
                    subValue={visibilityInfo.badge}
                    desc={visibilityInfo.description} 
                    icon="eye-outline" 
                    lib="Ionicons" 
                    alertLevel={visibilityInfo.alertLevel} 
                    isDesktop={isDesktop}
                    isTablet={isTablet}
                />
            </View>

            <View style={styles.sunRow}>
                <View style={styles.sunItem}>
                    <CustomIcon library="Feather" name="sunrise" size={28} color={Colors.WEATHER_SUN} />
                    <View>
                        <CustomText variant="caption" style={styles.sunLabel}>Sunrise</CustomText>
                        <CustomText style={styles.sunTime}>{formatSunTime(weatherData.sunrise)}</CustomText>
                    </View>
                </View>
                <View style={styles.sunSeparator} />
                <View style={[styles.sunItem, { alignItems: 'flex-end'}]}>
                    <CustomIcon library="Feather" name="sunset" size={28} color={Colors.WEATHER_MOON} />
                    <View style={{ alignItems: 'flex-end' }}>
                        <CustomText variant="caption" style={styles.sunLabel}>Sunset</CustomText>
                        <CustomText style={styles.sunTime}>{formatSunTime(weatherData.sunset)}</CustomText>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8, 
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 12,
    },
    errorText: {
        color: Colors.ERROR,
        fontSize: 16,
    },
    
    currentSection: {
        alignItems: 'center',
        marginBottom: 24, 
    },
    tempWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    tempSpacer: {
        width: 24,
    },
    currentTemp: {
        fontSize: 64,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 72,
        letterSpacing: -2,
    },
    degreeSymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 12,
        width: 32, 
    },
    currentCondition: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
        textTransform: 'capitalize',
    },
    feelsLike: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
        fontSize: 14,
    },
    
    pillWrapper: {
        alignItems: 'center',
        marginTop: 12,
    },
    safetyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 100, 
        gap: 8,
    },
    safetyText: {
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    safetyCardWrapper: {
        width: '100%',
        marginBottom: 24,
    },
    
    forecastSection: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2, 0.06, Colors.SHADOW, { radius: 8 }),
    },
    forecastSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    forecastSectionTitle: {
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 12,
    },
    forecastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    forecastItem: {
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 16,
        gap: 6,
        width: 86,
        minHeight: 124,
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    forecastItemToday: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.GRAY_LIGHT,
    },
    forecastItemSelected: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
        ...GlobalStyles.dropShadow(2, 0.1, Colors.PRIMARY),
    },
    fIconWrapper: {
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    forecastDate: {
        color: Colors.TEXT_SECONDARY,
    },
    forecastDateActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    forecastDateToday: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    forecastTempRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    forecastTempHigh: {
        color: Colors.TEXT_PRIMARY,
    },
    fTempSeparator: {
        fontSize: 12,
        color: Colors.GRAY_MEDIUM,
        marginHorizontal: 2,
    },
    forecastTempLow: {
        color: Colors.TEXT_SECONDARY,
    },

    hourlySection: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2, 0.06, Colors.SHADOW, { radius: 8 }),
    },
    hourlySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    hourlySectionTitle: {
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 12,
    },
    hourlyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    scrollWrapper: {
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
            web: {
                isolation: 'isolate',
            },
        }),
    },
    scrollFadeLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 32,
        zIndex: 2,
    },
    scrollFadeRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 32,
        zIndex: 2,
    },
    hourlyPill: {
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 16,
        gap: 6,
        width: 86,
        minHeight: 124,
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    hourlyPillNow: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
        ...GlobalStyles.dropShadow(2, 0.1, Colors.PRIMARY),
    },
    hourlyTime: {
        color: Colors.TEXT_SECONDARY,
    },
    hourlyTimeNow: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    hourlyIconWrapper: {
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hourlyBottomCol: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    hourlyTemp: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '700',
        fontSize: 14,
    },
    hourlyPrecip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    hourlyPrecipText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },
    
    bentoGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'flex-start', 
        gap: 12, 
        marginBottom: 24,
    },
    bentoBox: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 18, 
        padding: 16, 
        width: '100%', 
        minHeight: 125, 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...GlobalStyles.dropShadow(2, 0.06, Colors.SHADOW, { radius: 8 }), 
    },
    bentoBoxTablet: {
        width: '48.5%',
        minHeight: 155,
    },
    bentoBoxDesktop: {
        width: '31.8%',
        minHeight: 160,
    },
    bentoHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
    },
    bentoTitle: { 
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
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
    bentoMiddleMobile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        fontSize: 14,
        fontWeight: '700',
    },
    bentoSubBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
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
        fontSize: 14,
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
        fontSize: 14,
        lineHeight: 20,
    },
    
    sunRow: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2, 0.06, Colors.SHADOW, { radius: 8 }), 
    },
    sunItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sunLabel: {
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    sunTime: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    sunSeparator: {
        width: 1,
        height: 40,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    lastUpdatedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 4,
    },
    lastUpdatedText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    webRefreshBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
});

export default WeatherWidget;