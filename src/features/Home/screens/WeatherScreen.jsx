import { Feather, FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { Colors } from '../../../constants/colors';

const WeatherScreen = ({ locationWeather, onBackPress }) => {
    console.log("RECEIVED DATA:", locationWeather);

    const temperature = locationWeather?.temperature ?? "--";
    const location = locationWeather?.location ?? "Location Not Set";
    const dayTemp = locationWeather?.day ?? "--";
    const nightTemp = locationWeather?.night ?? "--";

    const precipAmount = locationWeather?.precipitation?.amount ? `${locationWeather.precipitation.amount} mm` : "--";
    const precipChance = locationWeather?.precipitation?.chance ? `${Math.round(locationWeather.precipitation.chance * 100)}%` : "--";
    const wind = locationWeather?.wind ? `${locationWeather.wind} m/s` : "--";
    const humidity = locationWeather?.humidity ? `${Math.round(locationWeather.humidity * 100)}%` : "--";
    const uvIndex = locationWeather?.UV ? String(locationWeather.UV) : "--";

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Weather" onBackPress={onBackPress} />

            <ResponsiveScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.heroSection}>
                    <View style={styles.heroTop}>
                        <View style={styles.heroTextWrapper}>
                            <View style={styles.tempContainer}>
                                <CustomText style={styles.mainTemp}>{temperature}°</CustomText>
                                <CustomText style={styles.tempUnit}>C</CustomText>
                            </View>
                            <View style={styles.locationRow}>
                                <FontAwesome6 name="location-dot" size={16} color={Colors.BLACK} />
                                <CustomText variant="body" style={styles.locationLabel}>{location}</CustomText>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="weather-partly-cloudy" size={96} color={Colors.BLACK} />
                    </View>
                    
                    <View style={styles.heroDivider} />
                    
                    <View style={styles.heroBottom}>
                        <CustomText variant="body" style={styles.heroSubText}>Mostly Cloudy</CustomText>
                        <CustomText variant="body" style={styles.heroSubText}>Day: {dayTemp}° | Night: {nightTemp}°</CustomText>
                    </View>
                </View>

                <View style={styles.fullWidthCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar" size={18} color={Colors.Gray} />
                        <CustomText variant="body" style={styles.cardHeaderTitle}>4-Day Forecast</CustomText>
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
                        // value="150 m/s"
                        desc="From Southeast" 
                        icon="wind" 
                        lib="Feather" 
                    />
                    <BentoBox 
                        title="Precipitation" 
                        value={precipAmount}
                        // value="67 mm"
                        desc={`${precipChance} chance`} 
                        // desc="50% chance"
                        icon="rainy" 
                        lib="Ionicons" 
                    />
                    <BentoBox 
                        title="UV Index" 
                        value={uvIndex} 
                        // value="High"
                        desc="Moderate" 
                        icon="sun" 
                        lib="Feather" 
                    />
                    <BentoBox 
                        title="Humidity" 
                        value={humidity}
                        // value="75%"
                        desc="Humid air" 
                        icon="water" 
                        lib="Ionicons" 
                    />
                </View>

                <View style={styles.fullWidthCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="sunny" size={18} color={Colors.Gray} />
                        <CustomText variant="body" style={styles.cardHeaderTitle}>Sun</CustomText>
                    </View>
                    
                    <View style={styles.sunTimeRow}>
                        <View style={styles.sunItem}>
                            <Feather name="sunrise" size={32} color={Colors.BLACK} />
                            <CustomText variant="h2" style={styles.sunTimeText}>6:02 AM</CustomText>
                            <CustomText variant="caption" style={styles.sunLabel}>Sunrise</CustomText>
                        </View>

                        <View style={[styles.sunItem, { alignItems: 'flex-end' }]}>
                            <Feather name="sunset" size={32} color={Colors.BLACK} />
                            <CustomText variant="h2" style={styles.sunTimeText}>6:15 PM</CustomText>
                            <CustomText variant="caption" style={styles.sunLabel}>Sunset</CustomText>
                        </View>
                    </View>
                </View>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const ForecastItem = ({ day, icon, low, high }) => (
    <View style={styles.fItem}>
        <View style={styles.fIconWrapper}>
            <MaterialCommunityIcons name={icon} size={32} color={Colors.BLACK} />
        </View>
        <View style={styles.fTempRow}>
            <CustomText style={styles.fTempHigh}>{high}°</CustomText>
            <CustomText style={styles.fTempSeparator}>/</CustomText>
            <CustomText variant="caption" style={styles.fTempLow}>{low}°</CustomText>
        </View>
        <CustomText variant="caption" style={styles.fDay}>{day}</CustomText>
    </View>
);

const BentoBox = ({ title, value, desc, icon, lib }) => (
    <View style={styles.bentoBox}>
        <View style={styles.bentoHeader}>
            {lib === 'Feather' && <Feather name={icon} size={18} color={Colors.Gray} />}
            {lib === 'Ionicons' && <Ionicons name={icon} size={18} color={Colors.Gray} />}
            <CustomText variant="body" style={styles.bentoTitle}>{title}</CustomText>
        </View>
        <View>
            <CustomText variant="h2" style={styles.bentoValue}>{value}</CustomText>
            <CustomText variant="caption" style={styles.bentoDesc}>{desc}</CustomText>
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
        color: Colors.BLACK,
        letterSpacing: -4,
        lineHeight: 90,
    },
    tempUnit: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        color: Colors.BLACK,
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
        color: Colors.Gray,
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
        color: Colors.Gray,
    },

    forecastRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    
    fItem: {
        alignItems: 'center',
        gap: 8,
    },
    fIconWrapper: {
        height: 32, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    fTempRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    fTempHigh: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.BLACK,
    },
    fTempSeparator: {
        fontSize: 14,
        color: Colors.GRAY_MEDIUM, 
        marginHorizontal: 4,
    },
    fTempLow: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.Gray, 
    },
    fDay: {
        fontWeight: '600',
        color: Colors.Gray,
        marginBottom: 4, 
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
        color: Colors.Gray,
    },
    bentoValue: {
        fontWeight: 'bold',
        marginBottom: 32,
    },
    bentoDesc: {
        fontWeight: '500',
        color: Colors.Gray,
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
        color: Colors.Gray,
        textTransform: 'uppercase',
    },
    
});

export default WeatherScreen;