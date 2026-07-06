/**
 * @file WeatherSection.tsx
 * @description A visual banner component displaying current local weather and geolocated coordinates on the home feed.
 */

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import SkeletonEffect from '@/src/components/SkeletonEffect';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { ProcessedWeatherData } from '@/src/core/types/weather';
import { formatWeatherDisplay } from '@/src/core/utility/weatherHelpers';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for the WeatherSection component.
 *
 * @param weatherData - The processed weather data to display
 * @param loading - Whether the weather data is currently loading
 * @param locationName - The fallback location name to display if geocoding is unavailable
 * @param error - Any error that occurred during weather fetching
 * @param onPress - Callback fired when the weather section is pressed
 * @param onReload - Callback fired to retry/reload weather fetching
 */
export interface WeatherSectionProps {
    weatherData: ProcessedWeatherData | null | undefined;
    loading: boolean;
    locationName?: string;
    error?: Error | string | null;
    onPress: () => void;
    onReload?: () => void;
}

/**
 * A UI section that displays current local weather and coordinates it with
 * device location tracking.
 */
const WeatherSection: React.FC<WeatherSectionProps> = ({ weatherData, loading, locationName, error, onPress, onReload }) => {

    const display = formatWeatherDisplay(weatherData);

    // 1. Loading / Locating State
    if (loading && !weatherData) {
        return (
            <View style={styles.container}>
                <View style={styles.topRow}>
                    <View style={styles.leftColumn}>
                        <View style={styles.tempAndCondition}>
                            <SkeletonEffect style={styles.skeletonTemp} />
                            <SkeletonEffect style={styles.skeletonCondition} />
                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <SkeletonEffect style={styles.skeletonIcon} />
                    </View>
                </View>

                <View style={styles.bottomRow}>
                    <View style={styles.locationRow}>
                        <SkeletonEffect style={styles.skeletonLocIcon} />
                        <SkeletonEffect style={styles.skeletonLocText} />
                    </View>
                    <SkeletonEffect style={styles.skeletonBadge} />
                </View>
            </View>
        );
    }

    // 2. Error / Connection Failed State
    if (error && !weatherData) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <CustomIcon library="Ionicons" name="cloud-offline-outline" size={32} color={Colors.ERROR} />
                <CustomText variant="caption" style={[styles.stateText, { color: Colors.ERROR }]}>
                    Unable to load weather.
                </CustomText>
                {onReload && (
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={onReload}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="refresh-cw" size={14} color={Colors.WHITE} />
                        <CustomText style={styles.retryButtonText}>Reload</CustomText>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    // 3. Unavailable / No Data State
    if (!weatherData && !loading && !error) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <CustomIcon library="Ionicons" name="location-outline" size={32} color={Colors.GRAY_MEDIUM} />
                <CustomText variant="caption" style={styles.stateText}>
                    Location services disabled or weather stats unavailable.
                </CustomText>
                {onReload && (
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={onReload}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="refresh-cw" size={14} color={Colors.WHITE} />
                        <CustomText style={styles.retryButtonText}>Retry Location</CustomText>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    const displayLocationText = locationName || 'Unknown location';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.leftColumn}>
                    <View style={styles.tempAndCondition}>
                        <View style={styles.tempWrapper}>
                            <CustomText style={styles.tempText}>
                                {display.hasData ? display.temperature : '--'}
                            </CustomText>
                            <CustomText style={styles.degreeSymbol}>
                                °C
                            </CustomText>
                        </View>

                        {display.hasData && (
                            <CustomText style={styles.conditionText}>
                                {display.condition}
                            </CustomText>
                        )}
                    </View>
                </View>

                <View style={styles.rightColumn}>
                    <CustomIcon 
                        library={display.library as IconLibrary} 
                        name={display.hasData ? display.icon : "partly-sunny-outline"}
                        size={72} 
                        color={display.hasData ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                    />
                </View>
            </View>

            <View style={styles.bottomRow}>
                
                <View style={styles.locationRow}>
                    <CustomIcon 
                        library="FontAwesome6" 
                        name="location-dot" 
                        size={16} 
                        color={Colors.PRIMARY} 
                    />
                    <CustomText 
                        style={styles.locationText}
                        numberOfLines={1}
                    >
                        {displayLocationText}
                    </CustomText>
                </View>

                <View style={styles.hiLoBadge}>
                    <CustomText variant="caption" style={styles.dayNightText}>
                        Day <CustomText style={styles.hiLoValue}>{display.dayTemp}°</CustomText> / Night <CustomText style={styles.hiLoValue}>{display.nightTemp}°</CustomText>
                    </CustomText>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16, 
        marginTop: 8,
        marginBottom: 16,     
        paddingHorizontal: 20, 
        paddingVertical: 14,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,     
        ...GlobalStyles.dropShadow(3),
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 130,
        gap: 10,
    },
    stateText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftColumn: {
        flex: 1.2,
        justifyContent: 'center',
        paddingRight: 12,
    },
    tempAndCondition: {
        flexDirection: 'column', 
        alignItems: 'flex-start',
    },
    tempWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    tempText: {
        fontSize: 56,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 64, 
        letterSpacing: -2,
    },
    degreeSymbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
        marginLeft: 2,
    },
    conditionText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.PRIMARY,
        textTransform: 'capitalize',
        marginTop: -2,
        marginLeft: 2,
    },

    rightColumn: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4, 
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 2,
        flexShrink: 1,
        marginRight: 8,
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 1,
    },

    hiLoBadge: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    dayNightText: {
        fontSize: 12, 
        color: Colors.TEXT_SECONDARY,
    },
    hiLoValue: {
        fontSize: 12, 
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        marginTop: 4,
    },
    retryButtonText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },
    
    skeletonTemp: {
        width: 90,
        height: 56,
        borderRadius: 8,
    },
    skeletonCondition: {
        width: 80, 
        height: 18,
        borderRadius: 4,
        marginTop: 4, 
        marginLeft: 2,
    },
    skeletonIcon: {
        width: 72, 
        height: 72,
        borderRadius: 36,
    },
    skeletonLocIcon: {
        width: 16, 
        height: 16,
        borderRadius: 8,
    },
    skeletonLocText: {
        width: 110,
        height: 14, 
        borderRadius: 4,
    },
    skeletonBadge: {
        width: 135,
        height: 32, 
        borderRadius: 16,
    },
});

export default WeatherSection;
