import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
    getHikingSafetyStatus,
    getHourlyForecastForDay,
    getPAGASAHeatIndexInfo,
    getPAGASARainfallWarning,
    getSummitVisibilityInfo,
    getWeatherInfoUI,
} from '../core/utility/weatherHelpers';
import { useWeather } from '../hooks/useWeather';

interface WeatherWidgetProps {
    latitude: number;
    longitude: number;
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
}

const BentoBox: React.FC<BentoBoxProps> = ({ 
    title, 
    value, 
    unit, 
    desc, 
    icon, 
    lib, 
    alertLevel = 'normal', 
    subValue 
}) => {
    const iconColor = alertLevel === 'danger' ? Colors.ERROR : alertLevel === 'warning' ? Colors.WARNING : Colors.PRIMARY;
    const valueColor = alertLevel === 'danger' ? Colors.ERROR : alertLevel === 'warning' ? Colors.WARNING : Colors.TEXT_PRIMARY;

    return (
        <View style={styles.bentoBox}>
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

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    latitude,
    longitude,
    trailName,
    showSafetyCard = true,
}) => {
    const { weatherData: data, error, refetch } = useWeather(latitude, longitude);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

    const lastUpdatedLabel = useMemo(
        () => formatLastUpdatedLabel(data?.lastUpdated),
        [data?.lastUpdated]
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    if (error && !data) {
        return (
            <View style={styles.centerContent}>
                <CustomIcon library="Ionicons" name="warning-outline" size={32} color={Colors.ERROR} />
                <CustomText style={styles.errorText}>Unable to load weather data</CustomText>
            </View>
        );
    }

    if (isRefreshing || !data) {
        return <WeatherWidgetSkeleton />;
    }

    const weatherData = data as ProcessedWeatherData;
    const { condition: currentCondition } = getWeatherInfoUI(weatherData.weatherCode);
    const safetyLevel = getHikingSafetyStatus(weatherData);

    const activeDay = weatherData.forecast?.at(selectedDayIndex) ?? weatherData.forecast?.at(0);
    const isTodaySelected = selectedDayIndex === 0;

    const activeHourlyList = getHourlyForecastForDay(weatherData, selectedDayIndex);

    const activeWind = isTodaySelected ? (weatherData.windSpeed ?? 0) : (activeDay?.windSpeedMax ?? 0);
    const activePrecip = isTodaySelected ? (weatherData.precipitationProbability ?? 0) : (activeDay?.precipitationProbabilityMax ?? 0);
    const activeUv = isTodaySelected ? (weatherData.uvIndex ?? 0) : (activeDay?.uvIndexMax ?? 0);

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

    const pagasaRain = getPAGASARainfallWarning(
        activePrecip,
        isTodaySelected ? (weatherData.precipitationSum ?? 0) : 0,
        isTodaySelected ? (weatherData.weatherCode ?? 0) : (activeDay?.weatherCode ?? 0)
    );

    const heatVal = isTodaySelected
        ? (weatherData.apparentTemperature != null ? weatherData.apparentTemperature : weatherData.temperature)
        : activeDay?.temperatureMax;
    const pagasaHeat = getPAGASAHeatIndexInfo(heatVal);

    const beaufortWind = getBeaufortWindInfo(
        activeWind,
        isTodaySelected ? (weatherData.windGusts ?? 0) : activeWind,
        weatherData.windDirection ?? 0
    );

    const visibilityInfo = getSummitVisibilityInfo(
        weatherData.visibility ?? 10000,
        weatherData.cloudCover ?? 0
    );

    return (
        <View style={styles.container}>
            <View style={styles.currentSection}>
                <View style={styles.tempWrapper}>
                    <View style={styles.tempSpacer} />
                    <CustomText style={styles.currentTemp}>
                        {weatherData.temperature != null && !isNaN(weatherData.temperature) ? Math.round(weatherData.temperature) : '--'}
                    </CustomText>
                    <CustomText style={styles.degreeSymbol}>°C</CustomText>
                </View>
                <CustomText style={styles.currentCondition}>{currentCondition}</CustomText>
                
                {weatherData.apparentTemperature != null && (
                    <CustomText variant="caption" style={styles.feelsLike}>
                        Feels like {Math.round(weatherData.apparentTemperature)}°C ({pagasaHeat.category})
                    </CustomText>
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

            {/* Prominent Actionable Gear Checklist & Safety Card */}
            {showSafetyCard && (
                <View style={styles.safetyCardWrapper}>
                    <WeatherSafetyCard
                        weatherData={weatherData}
                        trailName={trailName}
                        showChecklist={true}
                    />
                </View>
            )}

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.forecastScroll}
                contentContainerStyle={styles.forecastContent}
            >
                {weatherData.forecast?.map((day, index) => {
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
                            onPress={() => setSelectedDayIndex(index)}
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
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.hourlyContent}
                    >
                        {activeHourlyList.map((hour, hIdx) => {
                            const { icon, library } = getWeatherInfoUI(hour.weatherCode);
                            const isNow = hour.hourLabel === 'Now';
                            return (
                                <View key={hIdx} style={[styles.hourlyPill, isNow && styles.hourlyPillNow]}>
                                    <CustomText variant="caption" style={[styles.hourlyTime, isNow && styles.hourlyTimeNow]}>
                                        {hour.hourLabel}
                                    </CustomText>
                                    <CustomIcon library={library as IconLibrary} name={icon} size={22} color={isNow ? Colors.PRIMARY : Colors.TEXT_PRIMARY} />
                                    <CustomText variant="label" style={styles.hourlyTemp}>{hour.temperature}°</CustomText>
                                    <View style={styles.hourlyPrecip}>
                                        <CustomIcon library="Ionicons" name="water-outline" size={10} color={hour.precipitationProbability > 30 ? Colors.ERROR : Colors.TEXT_SECONDARY} />
                                        <CustomText variant="caption" style={[styles.hourlyPrecipText, hour.precipitationProbability > 30 && { color: Colors.ERROR, fontWeight: '700' }]}>
                                            {hour.precipitationProbability}%
                                        </CustomText>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
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
                />
                <BentoBox 
                    title="Precipitation" 
                    value={activePrecip} 
                    unit="%" 
                    subValue={weatherData.precipitationSum ? `${weatherData.precipitationSum.toFixed(1)} mm • ${pagasaRain.badge}` : pagasaRain.badge}
                    desc={pagasaRain.description} 
                    icon="rainy-outline" 
                    lib="Ionicons" 
                    alertLevel={pagasaRain.alertLevel} 
                />
                <BentoBox 
                    title="Wind & Gusts" 
                    value={activeWind} 
                    unit="km/h" 
                    subValue={beaufortWind.gustText}
                    desc={`${beaufortWind.directionText} • ${beaufortWind.scale}`} 
                    icon="wind" 
                    lib="Feather" 
                    alertLevel={beaufortWind.alertLevel} 
                />
                <BentoBox 
                    title="UV Index" 
                    value={Math.round(activeUv)} 
                    unit="" 
                    subValue={weatherData.uvIndexMax ? `Peak: ${Math.round(weatherData.uvIndexMax)}` : 'Low Risk'}
                    desc={getUVIndexReminder(activeUv, weatherData.cloudCover, isTodaySelected ? weatherData.weatherCode : activeDay?.weatherCode)} 
                    icon="sun"  
                    lib="Feather" 
                    alertLevel={activeUv >= 11 ? 'danger' : activeUv >= 8 ? 'warning' : 'normal'} 
                />
                <BentoBox 
                    title="Visibility" 
                    value={weatherData.visibility != null ? (weatherData.visibility / 1000).toFixed(1) : '10'} 
                    unit="km" 
                    subValue={visibilityInfo.cloudText}
                    desc={visibilityInfo.description} 
                    icon="eye-outline" 
                    lib="Ionicons" 
                    alertLevel={visibilityInfo.alertLevel} 
                />
                <BentoBox 
                    title="Atmospheric Air" 
                    value={weatherData.humidity} 
                    unit="% RH" 
                    subValue={weatherData.surfacePressure ? `${weatherData.surfacePressure} hPa` : '1013 hPa'}
                    desc={weatherData.surfacePressure && weatherData.surfacePressure < 1008 ? 'Low Pressure Area (LPA) activity.' : 'Stable tropical atmospheric pressure.'} 
                    icon="water-outline" 
                    lib="Ionicons" 
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

            <TouchableOpacity style={styles.refreshRow} onPress={handleRefresh} activeOpacity={0.6}>
                <CustomIcon library="Feather" name="refresh-cw" size={14} color={Colors.TEXT_SECONDARY} />
                <CustomText variant="caption" style={styles.refreshText}>
                    {lastUpdatedLabel ? `Updated ${lastUpdatedLabel}` : 'Tap to refresh'}
                </CustomText>
            </TouchableOpacity>
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
        marginBottom: 24,
    },
    
    forecastScroll: {
        flexGrow: 0,
        marginBottom: 32,
    },
    forecastContent: {
        flexGrow: 1,
        justifyContent: 'center',
        gap: 12,
    },
    forecastItem: {
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 8,
        minWidth: 70,
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
        gap: 10,
        paddingVertical: 4,
    },
    hourlyPill: {
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 14,
        gap: 6,
        minWidth: 62,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    hourlyPillNow: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.PRIMARY,
        ...GlobalStyles.dropShadow(2, 0.08, Colors.PRIMARY),
    },
    hourlyTime: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 11,
    },
    hourlyTimeNow: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
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
        justifyContent: 'space-between', 
        gap: 12, 
        marginBottom: 24,
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
    
    refreshRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 20,
        paddingVertical: 10,
    },
    refreshText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
});

export default WeatherWidget;