import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { getWeatherInfoUI } from '@/src/core/utility/weatherHelpers';

const WeatherSection = ({ weatherData, loading, error, onPress }) => {

    const { icon, library } = getWeatherInfoUI(weatherData?.weatherCode);

    const hasData = weatherData && !loading && !error;
    const temperature = weatherData?.temperature !== undefined ? Math.round(weatherData.temperature) : '--';
    
    // For Day/Night. Let's get today's forecast from weatherData.forecast[0]
    const today = weatherData?.forecast?.[0];
    const dayTemp = today?.temperatureMax !== undefined ? Math.round(today.temperatureMax) : '--';
    const nightTemp = today?.temperatureMin !== undefined ? Math.round(today.temperatureMin) : '--';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.row}>
                
                {/* LEFT COLUMN: Main Temp & Location */}
                <View style={styles.leftColumn}>
                    <View style={styles.tempWrapper}>
                        <CustomText style={styles.tempText}>
                            {hasData ? temperature : '--'}
                        </CustomText>
                        <CustomText style={styles.degreeSymbol}>
                            °C
                        </CustomText>
                    </View>
                    
                    <View style={styles.locationRow}>
                        <CustomIcon 
                            library="FontAwesome6" 
                            name="location-dot" 
                            size={14}
                            color={Colors.TEXT_SECONDARY} 
                        />
                        <CustomText variant="label" style={styles.locationText}>
                            {loading ? 'Locating...' : (error ? 'Location Error' : 'Current Location')}
                        </CustomText>
                    </View>
                </View>

                {/* RIGHT COLUMN: Icon & Day/Night Badge */}
                <View style={styles.rightColumn}>
                    {hasData ? (
                        <CustomIcon 
                            library={library} 
                            name={icon}
                            size={52} 
                            color={Colors.PRIMARY} 
                        />
                    ) : (
                        <CustomIcon 
                            library="Ionicons" 
                            name="partly-sunny-outline"
                            size={52} 
                            color={Colors.GRAY_MEDIUM} 
                        />
                    )}
                    
                    <View style={styles.hiLoBadge}>
                        <CustomText variant="caption" style={styles.dayNightText}>
                            Day <CustomText style={styles.hiLoValue}>{dayTemp}°</CustomText> / Night <CustomText style={styles.hiLoValue}>{nightTemp}°</CustomText>
                        </CustomText>
                    </View>
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
        paddingHorizontal: 24, 
        paddingVertical: 20,
        // Using GRAY_ULTRALIGHT to separate it from standard white cards
        backgroundColor: Colors.WHITE,
        borderRadius: 24,     
        
        // Deep, soft shadow for premium lift
        ...Platform.select({
            ios: {
                shadowColor: Colors.SHADOW,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.06)',
            }
        })
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    
    // --- Left Column Styles ---
    leftColumn: {
        justifyContent: 'center',
        gap: 12,
        paddingBottom: 8
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
        marginLeft: 4, // Aligns icon beautifully with the heavy font
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
    },

    // --- Right Column Styles ---
    rightColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 12,
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