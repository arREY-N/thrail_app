import React, { useCallback, useState } from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatSunTime } from '@/src/core/utility/date';
import { getWeatherInfoUI } from '@/src/core/utility/weatherHelpers';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useLocation } from '@/src/hooks/useLocation';
import { useWeather } from '@/src/hooks/useWeather';

import WeatherSkeleton from '@/src/features/Home/components/WeatherSkeleton';

const getMetricAlertLevel = (type, value) => {
    if (value === undefined || value === null) return 'normal';
    if (type === 'wind') return value >= 60 ? 'danger' : value >= 40 ? 'warning' : 'normal';
    if (type === 'precip') return value >= 70 ? 'danger' : value >= 50 ? 'warning' : 'normal';
    if (type === 'uv') return value >= 11 ? 'danger' : value >= 8 ? 'warning' : 'normal';
    return 'normal';
};

const WeatherScreen = ({ 
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
        geocodedName 
    } = useLocation({ 
        propLatitude: latitude, 
        propLongitude: longitude, 
        propLocationName: locationName 
    });

    const [refreshing, setRefreshing] = useState(false);

    const { weatherData, loading, error, refetch } = useWeather(activeLat, activeLon);

    const lastUpdatedLabel = React.useMemo(() => {
        if (!weatherData?.lastUpdated) return null;
        const diffMs = Date.now() - new Date(weatherData.lastUpdated).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        return `${diffHr}h ${diffMin % 60}m ago`;
    }, [weatherData?.lastUpdated]);

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
    
    const windRaw = weatherData?.windSpeed;
    const precipRaw = weatherData?.precipitationProbability;
    const uvRaw = weatherData?.uvIndex;
    const humidityRaw = weatherData?.humidity;
    
    const windVal = windRaw !== undefined ? windRaw : "--";
    const precipVal = precipRaw !== undefined ? precipRaw : "--";
    const uvVal = uvRaw !== undefined ? Math.round(uvRaw) : "--";
    const humVal = humidityRaw !== undefined ? Math.round(humidityRaw) : "--";
    
    const sunrise = weatherData?.sunrise ? formatSunTime(weatherData.sunrise) : "--:-- AM";
    const sunset = weatherData?.sunset ? formatSunTime(weatherData.sunset) : "--:-- PM";

    if ((loading && !weatherData) || refreshing) {
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
                    { paddingBottom: Math.max(insets.bottom + 24, 40) }
                ]}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={[Colors.PRIMARY]} 
                    />
                }
            >
                <View style={styles.heroSection}>
                    <View style={styles.heroTop}>
                        <View style={styles.hiLoContainer}>
                            <CustomIcon library="Ionicons" name="sunny" size={14} color={Colors.WEATHER_SUN} />
                            <CustomText variant="label" style={styles.hiLoText}>Day {dayTemp}°</CustomText>
                            
                            <View style={styles.dotSeparator} />
                            
                            <CustomIcon library="Ionicons" name="moon" size={14} color={Colors.WEATHER_MOON} />
                            <CustomText variant="label" style={styles.hiLoText}>Night {nightTemp}°</CustomText>
                        </View>
                    </View>

                    <View style={styles.mainWeatherRow}>
                        <View style={styles.tempBlock}>
                            <View style={styles.tempContainer}>
                                <CustomText style={styles.mainTemp}>{temperature}°</CustomText>
                                <CustomText variant="h2" style={styles.tempUnit}>C</CustomText>
                            </View>
                            {weatherData?.apparentTemperature != null && (
                                <CustomText variant="caption" style={styles.feelsLikeHero}>
                                    Feels like {Math.round(weatherData.apparentTemperature)}°C
                                </CustomText>
                            )}
                        </View>

                        <View style={styles.iconBlock}>
                            <CustomIcon 
                                library={mainLib} 
                                name={hasData ? mainIcon : "cloud-offline-outline"} 
                                size={80} 
                                color={Colors.PRIMARY} 
                            />
                            <CustomText variant="label" style={styles.conditionText}>
                                {hasData ? condition : "Loading"}
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

                {error ? (
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
                                            lib={library}
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
                                value={windVal} 
                                unit="km/h" 
                                desc="Current speed" 
                                icon="wind" 
                                lib="Feather" 
                                alertLevel={getMetricAlertLevel('wind', windRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Precipitation" 
                                value={precipVal} 
                                unit="%" 
                                desc="Chance of rain" 
                                icon="rainy-outline" 
                                lib="Ionicons" 
                                alertLevel={getMetricAlertLevel('precip', precipRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="UV Index" 
                                value={uvVal} 
                                unit="" 
                                desc={weatherData?.uvIndexMax ? `Real-time. Peak: ${Math.round(weatherData.uvIndexMax)}` : "Current level"}
                                icon="thermometer-outline"  
                                lib="Ionicons" 
                                alertLevel={getMetricAlertLevel('uv', uvRaw)} 
                                isDesktop={isDesktop}
                            />
                            <BentoBox 
                                title="Humidity" 
                                value={humVal} 
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
                                        color={Colors.PRIMARY} 
                                    />
                                    <View>
                                        <CustomText style={styles.sunTimeText}>{sunrise}</CustomText>
                                        <CustomText variant="caption" style={styles.sunLabel}>Sunrise</CustomText>
                                    </View>
                                </View>
                                
                                <View style={styles.sunConnector} />

                                <View style={[styles.sunItem, { alignItems: 'flex-end', textAlign: 'right' }]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="sunset" 
                                        size={32} 
                                        color={Colors.PRIMARY} 
                                    />
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <CustomText style={styles.sunTimeText}>{sunset}</CustomText>
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

const ForecastItem = ({ day, icon, lib, low, high, isToday }) => (
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

const BentoBox = ({ title, value, unit, desc, icon, lib, alertLevel = 'normal', isDesktop }) => {
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
            </View>

            <View style={styles.bentoBottom}>
                <CustomText variant="caption" style={styles.bentoDesc}>{desc}</CustomText>
            </View>
        </View>
    );
};

const dropShadow = Platform.select({
    ios: {
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    android: {
        elevation: 3,
    },
    web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
    }
});

const styles = StyleSheet.create({
    container: { 
        flex: 1 
    },
    scrollContent: { 
        padding: 16, 
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
        ...dropShadow 
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
        paddingRight: 16 
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
        ...dropShadow 
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
    }
});

export default WeatherScreen;