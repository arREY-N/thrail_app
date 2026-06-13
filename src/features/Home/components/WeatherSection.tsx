import React from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { ProcessedWeatherData } from '@/src/core/types/weather';
import { formatWeatherDisplay } from '@/src/core/utility/weatherHelpers';
import { useLocation } from '@/src/hooks/useLocation';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for the WeatherSection component.
 */
export interface WeatherSectionProps {
    /** The processed weather data to display */
    weatherData: ProcessedWeatherData | null | undefined;
    /** Whether the weather data is currently loading */
    loading: boolean;
    /** The fallback location name to display if geocoding is unavailable */
    locationName?: string;
    /** Any error that occurred during weather fetching */
    error?: Error | string | null;
    /** Callback fired when the weather section is pressed */
    onPress: () => void;
}

/**
 * A UI section that displays current local weather and coordinates it with
 * device location tracking.
 *
 * @param {WeatherSectionProps} props - The component props
 */
const WeatherSection = ({ weatherData, loading, locationName, error, onPress }: WeatherSectionProps) => {

    const display = formatWeatherDisplay(weatherData);
    const { geocodedName } = useLocation({ propLocationName: locationName });

    if (loading) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.container, styles.centerAll]}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <CustomText variant="caption" style={styles.stateText}>
                    Fetching local weather...
                </CustomText>
            </TouchableOpacity>
        );
    }

    if (error) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.container, styles.centerAll]}>
                <CustomIcon library="Ionicons" name="cloud-offline-outline" size={36} color={Colors.ERROR} />
                <CustomText variant="caption" style={[styles.stateText, { color: Colors.ERROR }]}>
                    Unable to load weather. Tap to retry.
                </CustomText>
            </TouchableOpacity>
        );
    }

    const displayLocationText = geocodedName || locationName || 'Unknown location';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.row}>

                <View style={styles.leftColumn}>
                    <View style={styles.tempWrapper}>
                        <CustomText style={styles.tempText}>
                            {display.hasData ? display.temperature : '--'}
                        </CustomText>
                        <CustomText style={styles.degreeSymbol}>
                            °C
                        </CustomText>
                    </View>
                    
                    <View style={styles.locationRow}>
                        <CustomIcon 
                            library="FontAwesome6" 
                            name="location-dot" 
                            size={16}
                            color={Colors.PRIMARY} 
                        />
                        <CustomText 
                            variant="label" 
                            style={styles.locationText}
                            numberOfLines={1}
                        >
                            {displayLocationText}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.rightColumn}>
                    <CustomIcon 
                        library={display.library as IconLibrary} 
                        name={display.hasData ? display.icon : "partly-sunny-outline"}
                        size={52} 
                        color={display.hasData ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                    />
                    
                    <View style={styles.hiLoBadge}>
                        <CustomText variant="caption" style={styles.dayNightText}>
                            Day <CustomText style={styles.hiLoValue}>{display.dayTemp}°</CustomText> / Night <CustomText style={styles.hiLoValue}>{display.nightTemp}°</CustomText>
                        </CustomText>
                    </View>
                </View>

            </View>
        </TouchableOpacity>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16, 
        marginTop: 8,
        marginBottom: 16,     
        paddingHorizontal: 24, 
        paddingVertical: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,     
        
        ...Platform.select({
            ios: {
                
                
                
                
            },
            android: {
                ...dropShadow,
            },
            web: {
                boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.06)',
            }
        })
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 130,
        gap: 12,
    },
    stateText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'center',
        gap: 12,
        paddingBottom: 8,
        paddingRight: 16,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 10,
        marginLeft: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 4,
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
        flexShrink: 1,
    },
    rightColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 12,
        flexShrink: 0,
    },
    hiLoBadge: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    dayNightText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    hiLoValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
});

export default WeatherSection;
