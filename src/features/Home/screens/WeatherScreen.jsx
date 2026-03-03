import React, { useCallback, useEffect, useState } from 'react';
import {
    Animated,
    Easing,
    Platform,
    RefreshControl,
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

const WeatherScreen = ({ locationWeather, onBackPress, onRefreshPress, isFetching }) => {
    console.log("RECEIVED DATA:", locationWeather);
    const [testLoading, setTestLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTestLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const isLoading = testLoading || !locationWeather;

    const temperature = locationWeather?.temperature ?? "--";
    const location = locationWeather?.location ?? "Location Not Set";
    const dayTemp = locationWeather?.day ?? "--";
    const nightTemp = locationWeather?.night ?? "--";

    const precipAmount = locationWeather?.precipitation?.amount ? `${locationWeather.precipitation.amount} mm` : "--";
    const precipChance = locationWeather?.precipitation?.chance ? `${Math.round(locationWeather.precipitation.chance * 100)}%` : "--";
    const wind = locationWeather?.wind ? `${locationWeather.wind} m/s` : "--";
    const humidity = locationWeather?.humidity ? `${Math.round(locationWeather.humidity * 100)}%` : "--";
    const uvIndex = locationWeather?.UV ? String(locationWeather.UV) : "--";

    const onRefresh = useCallback(async () => {
        console.log("Pull-to-refresh triggered!");
        setRefreshing(true);

        if (onRefreshPress) {
            console.log("Calling backend refresh function...");
            await onRefreshPress(); 
        }
        setRefreshing(false);
        console.log("Refresh loading stopped.");
    }, [onRefreshPress]);

    const WebRefreshButton = Platform.OS === 'web' ? (
        <TouchableOpacity onPress={onRefresh} style={{ padding: 8 }}>
            <CustomIcon 
                library="Ionicons" 
                name="refresh" 
                size={24} 
                color={Colors.TEXT_INVERSE} 
            />
        </TouchableOpacity>
    ) : null;

    if (isLoading) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Weather" onBackPress={onBackPress} />
                <View style={styles.scrollContent}>
                    <View style={styles.heroSection}>
                        <View style={styles.heroTop}>
                            <SkeletonEffect style={{ width: 120, height: 80 }} />
                            <SkeletonEffect style={{ width: 96, height: 96, borderRadius: 48 }} />
                        </View>
                        <SkeletonEffect style={{ width: '100%', height: 2, marginVertical: 16 }} />
                        <View style={styles.heroBottom}>
                            <SkeletonEffect style={{ width: 100, height: 20 }} />
                            <SkeletonEffect style={{ width: 150, height: 20 }} />
                        </View>
                    </View>
                    
                    <View style={styles.fullWidthCard}>
                        <View style={styles.forecastRow}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.fItem}>
                                    <SkeletonEffect style={{ width: 40, height: 60, borderRadius: 20 }} />
                                    <SkeletonEffect style={{ width: 30, height: 15 }} />
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.fullWidthCard}>
                        <View style={styles.forecastRow}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.fItem}>
                                    <SkeletonEffect style={{ width: 40, height: 40, borderRadius: 20 }} />
                                    <SkeletonEffect style={{ width: 30, height: 15 }} />
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.fullWidthCard}>
                        <View style={styles.forecastRow}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.fItem}>
                                    <SkeletonEffect style={{ width: 40, height: 40, borderRadius: 20 }} />
                                    <SkeletonEffect style={{ width: 30, height: 15 }} />
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.fullWidthCard}>
                        <View style={styles.forecastRow}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.fItem}>
                                    <SkeletonEffect style={{ width: 40, height: 40, borderRadius: 20 }} />
                                    <SkeletonEffect style={{ width: 30, height: 15 }} />
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.fullWidthCard}>
                        <View style={styles.forecastRow}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.fItem}>
                                    <SkeletonEffect style={{ width: 40, height: 40, borderRadius: 20 }} />
                                    <SkeletonEffect style={{ width: 30, height: 15 }} />
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <CustomHeader 
                title="Weather" 
                onBackPress={onBackPress} 
                rightActions={WebRefreshButton}
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
                <View style={styles.heroSection}>
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
                            <View style={styles.locationRow}>

                                <CustomIcon 
                                    library="FontAwesome6" 
                                    name="location-dot" 
                                    size={16} 
                                    color={Colors.BLACK} 
                                />

                                <CustomText variant="body" style={styles.locationLabel}>
                                    {location}
                                </CustomText>
                            </View>
                        </View>

                        <CustomIcon 
                            library="MaterialCommunityIcons" 
                            name="weather-partly-cloudy" 
                            size={96} 
                            color={Colors.BLACK} 
                        />
                    </View>
                    
                    <View style={styles.heroDivider} />
                    
                    <View style={styles.heroBottom}>
                        <CustomText variant="body" style={styles.heroSubText}>
                            Mostly Cloudy
                        </CustomText>

                        <CustomText variant="body" style={styles.heroSubText}>
                            Day: {dayTemp}° | Night: {nightTemp}°
                        </CustomText>
                    </View>
                </View>

                <View style={styles.fullWidthCard}>
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
                        <ForecastItem day="Mon" icon="weather-sunny" low="25" high="32" />
                        <ForecastItem day="Tue" icon="weather-cloudy" low="26" high="29" />
                        <ForecastItem day="Wed" icon="weather-pouring" low="26" high="30" />
                        <ForecastItem day="Thu" icon="weather-lightning" low="26" high="30" />
                    </View>
                </View>

                <View style={styles.bentoGrid}>
                    <BentoBox 
                        title="Wind" 
                        value={wind}
                        desc="From Southeast" 
                        icon="wind" 
                        lib="Feather" 
                    />
                    <BentoBox 
                        title="Precipitation" 
                        value={precipAmount}
                        desc={`${precipChance} chance`} 
                        icon="rainy" 
                        lib="Ionicons" 
                    />
                    <BentoBox 
                        title="UV Index" 
                        value={uvIndex} 
                        desc="Moderate" 
                        icon="sun" 
                        lib="Feather" 
                    />
                    <BentoBox 
                        title="Humidity" 
                        value={humidity}
                        desc="Humid air" 
                        icon="water" 
                        lib="Ionicons" 
                    />
                </View>

                <View style={styles.fullWidthCard}>
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

                            <CustomIcon 
                                library="Feather" 
                                name="sunrise" 
                                size={32} 
                                color={Colors.BLACK} 
                            />
                            <CustomText variant="subtitle" style={styles.sunTimeText}>
                                6:02 AM
                            </CustomText>

                            <CustomText variant="caption" style={styles.sunLabel}>
                                Sunrise
                            </CustomText>
                        </View>

                        <View style={[styles.sunItem, { alignItems: 'flex-end' }]}>

                            <CustomIcon 
                                library="Feather" 
                                name="sunset" 
                                size={32} 
                                color={Colors.BLACK} 
                            />
                            <CustomText variant="subtitle" style={styles.sunTimeText}>
                                6:15 PM
                            </CustomText>

                            <CustomText variant="caption" style={styles.sunLabel}>
                                Sunset
                            </CustomText>
                        </View>
                    </View>
                </View>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const SkeletonEffect = ({ style }) => {
    const opacity = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return <Animated.View style={[{ backgroundColor: Colors.GRAY_LIGHT, borderRadius: 8 }, style, { opacity }]} />;
};

const ForecastItem = ({ day, icon, low, high }) => (
    <View style={styles.fItem}>       
        <View style={styles.fIconWrapper}>

            <CustomIcon 
                library="MaterialCommunityIcons" 
                name={icon} 
                size={32} 
                color={Colors.BLACK} 
            />
        </View>

        <CustomText variant="caption" style={styles.fDay}>
            {day}
        </CustomText>

        <View style={styles.fTempRow}>
            <CustomText variant="body" style={styles.fTempHigh}>
                {high}°
            </CustomText>

            <CustomText style={styles.fTempSeparator}>
                /
            </CustomText>

            <CustomText variant="caption" style={styles.fTempLow}>
                {low}°
            </CustomText>
        </View> 
    </View>
);

const BentoBox = ({ title, value, desc, icon, lib }) => (
    <View style={styles.bentoBox}>
        <View style={styles.bentoHeader}>

            <CustomIcon 
                library={lib}
                name={icon}
                size={18} 
                color={Colors.TEXT_SECONDARY} 
            />
            
            <CustomText variant="body" style={styles.bentoTitle}>
                {title}
            </CustomText>
        </View>

        <View>
            <CustomText variant="subtitle" style={styles.bentoValue}>
                {value}
            </CustomText>

            <CustomText variant="caption" style={styles.bentoDesc}>
                {desc}
            </CustomText>
        </View>
    </View>
);

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
    },
    tempContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    mainTemp: {
        fontSize: 64,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -4,
        lineHeight: 90,
    },
    tempUnit: {
        fontWeight: 'bold',
        marginTop: 20,
        color: Colors.TEXT_PRIMARY,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -4,
    },
    locationLabel: {
        fontWeight: '600',
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
        backgroundColor: Colors.SECONDARY,
        borderRadius: 16,
        padding: 16,
        gap: 16,
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
        backgroundColor: Colors.SECONDARY,
        borderRadius: 16,
        padding: 16,
        margin: 8,
        flex: 1,
        minWidth: 140,
        minHeight: 160,
        justifyContent: 'space-between',
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
        marginBottom: 32,
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
    
});

export default WeatherScreen;