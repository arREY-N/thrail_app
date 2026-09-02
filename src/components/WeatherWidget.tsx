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
    getUVLabel,
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

            <View style={styles.gridContainer}>
                <View style={styles.gridRow}>
                    <View style={styles.gridItem}>
                        <CustomIcon library="Feather" name="thermometer" size={20} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.gridLabel}>{'Heat Index'}</CustomText>
                        <CustomText style={styles.gridValue}>{Math.round(heatVal ?? 0)}°C</CustomText>
                        <CustomText variant="caption" style={styles.gridSubtext} numberOfLines={1}>{pagasaHeat.category}</CustomText>
                    </View>
                    <View style={styles.gridItem}>
                        <CustomIcon library="Ionicons" name="rainy-outline" size={22} color={pagasaRain.alertLevel === 'danger' ? Colors.ERROR : Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.gridLabel}>{'Rain & Storm'}</CustomText>
                        <CustomText style={[styles.gridValue, pagasaRain.alertLevel === 'danger' && { color: Colors.ERROR }]}>
                            {activePrecip}%
                        </CustomText>
                        <CustomText variant="caption" style={styles.gridSubtext} numberOfLines={1}>
                            {isTodaySelected && weatherData.precipitationSum ? `${weatherData.precipitationSum.toFixed(1)} mm • ` : ''}{pagasaRain.warningLevel !== 'NORMAL' ? pagasaRain.badge : 'Fair'}
                        </CustomText>
                    </View>
                </View>
                
                <View style={styles.gridRow}>
                    <View style={styles.gridItem}>
                        <CustomIcon library="Feather" name="wind" size={20} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.gridLabel}>{'Wind & Gusts'}</CustomText>
                        <CustomText style={styles.gridValue}>{activeWind} km/h</CustomText>
                        <CustomText variant="caption" style={styles.gridSubtext} numberOfLines={1}>{beaufortWind.gustText}</CustomText>
                    </View>
                    <View style={styles.gridItem}>
                        <CustomIcon library="Feather" name="sun" size={20} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.gridLabel}>{'UV Index'}</CustomText>
                        <CustomText style={styles.gridValue}>{Math.round(activeUv)}</CustomText>
                        <CustomText variant="caption" style={styles.gridSubtext} numberOfLines={1}>{isTodaySelected && weatherData.uvIndexMax ? `Peak: ${Math.round(weatherData.uvIndexMax)}` : getUVLabel(activeUv)}</CustomText>
                    </View>
                </View>
                
                <View style={styles.gridRow}>
                    <View style={styles.gridItem}>
                        <CustomIcon library="Ionicons" name="eye-outline" size={22} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.gridLabel}>{'Summit Visibility'}</CustomText>
                        <CustomText style={styles.gridValue}>
                            {weatherData.visibility != null ? `${(weatherData.visibility / 1000).toFixed(1)} km` : '--'}
                        </CustomText>
                        <CustomText variant="caption" style={styles.gridSubtext} numberOfLines={1}>{visibilityInfo.cloudText}</CustomText>
                    </View>
                    <View style={styles.gridItem}>
                        <CustomIcon library="Ionicons" name="water-outline" size={22} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.gridLabel}>{'Atmospheric Air'}</CustomText>
                        <CustomText style={styles.gridValue}>{weatherData.humidity}% RH</CustomText>
                        <CustomText variant="caption" style={styles.gridSubtext} numberOfLines={1}>{weatherData.surfacePressure ? `${weatherData.surfacePressure} hPa` : '1013 hPa'}</CustomText>
                    </View>
                </View>
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
    
    gridContainer: {
        gap: 12,
        marginBottom: 24,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 12,
    },
    gridItem: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2, 0.06, Colors.SHADOW, { radius: 8 }),
    },
    gridLabel: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 8,
        marginBottom: 2,
    },
    gridValue: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    gridSubtext: {
        marginTop: 4,
        textAlign: 'center',
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