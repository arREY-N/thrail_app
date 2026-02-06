import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const WeatherSection = ({ locationTemp, onPress }) => {

    const getWeatherIcon = (temp) => {
        if (!temp) return 'partly-sunny-outline';
        
        if (temp >= 30) {
            return 'sunny';
        } else if (temp >= 24) {
            return 'partly-sunny';
        } else {
            return 'cloudy';
        }
    };

    const iconName = getWeatherIcon(locationTemp?.temperature);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.row}>
                <View>
                    <CustomText variant="title" style={styles.tempText}>
                        {locationTemp?.temperature ? `${locationTemp.temperature}°c` : '--'}
                    </CustomText>
                    
                    <View style={styles.locationRow}>
                        <CustomIcon 
                            library="FontAwesome6" 
                            name="location-dot" 
                            size={16}
                            color={Colors.TEXT_SECONDARY} 
                        />
                        
                        <CustomText variant="caption" style={styles.locationText}>
                            {locationTemp?.location || 'Locating...'}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.rightSide}>
                    <CustomIcon 
                        library="Ionicons" 
                        name={iconName}
                        size={48}
                        color={Colors.TEXT_SECONDARY} 
                    />
                    
                    <CustomText variant="caption" style={styles.dayNightText}>
                        Day {locationTemp?.day || '--'}° / Night {locationTemp?.night || '--'}°
                    </CustomText>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tempText: {
        fontSize: 56,
        fontWeight: 'bold',
        lineHeight: 60,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    locationText: {
        fontWeight: '600',
    },
    rightSide: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 60,
    },
    dayNightText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
});

export default WeatherSection;