import React from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { getWeatherInfoUI } from '@/src/core/utility/weatherHelpers';
import { useLocation } from '@/src/hooks/useLocation';

const WeatherSection = ({ weatherData, loading, locationName, error, onPress }) => {

    const { icon, library } = getWeatherInfoUI(weatherData?.weatherCode);
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

    const hasData = weatherData && !error;
    const temperature = weatherData?.temperature !== undefined ? Math.round(weatherData.temperature) : '--';
    
    const today = weatherData?.forecast?.[0];
    const dayTemp = today?.temperatureMax !== undefined ? Math.round(today.temperatureMax) : '--';
    const nightTemp = today?.temperatureMin !== undefined ? Math.round(today.temperatureMin) : '--';

    const displayLocationText = geocodedName || locationName || 'Unknown location';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.row}>

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
                        library={library} 
                        name={hasData ? icon : "partly-sunny-outline"}
                        size={52} 
                        color={hasData ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                    />
                    
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
        backgroundColor: Colors.WHITE,
        borderRadius: 24,     
        
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