import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const MountainCard = ({ item = {}, onPress, onDownload, style }) => {

    const { 
        name, 
        location, 
        displayLength, 
        displayElev, 
        displayTime, 
        score,
        displayTemp
    } = getMountainData(item);

    return (
        <TouchableOpacity 
            style={[styles.cardContainer, style]} 
            activeOpacity={0.9} 
            onPress={onPress}
        >
            <View style={styles.imageContainer}>
                
                <View style={styles.placeholderImage} />

                <View style={[styles.glassPill, styles.ratePosition]}>
                    <CustomIcon
                        library="AntDesign"
                        name="star"
                        size={12}
                        color={Colors.YELLOW}
                    />
                    <CustomText variant="caption" style={styles.badgeText}>
                        {score}
                    </CustomText>
                </View>

                {displayTemp && (
                    <View style={[styles.glassPill, styles.weatherPosition]}>
                        <CustomIcon
                            library="Ionicons"
                            name="partly-sunny" 
                            size={14}
                            color={Colors.WHITE}
                        />
                        <CustomText variant="caption" style={styles.badgeText}>
                            {displayTemp}
                        </CustomText>
                    </View>
                )}

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.textContainer}>
                            <CustomText variant="body" style={styles.title} numberOfLines={1}>
                                {name} 
                            </CustomText>
                            
                            <View style={styles.locationRow}>
                                <CustomIcon 
                                    library="FontAwesome6" 
                                    name="location-dot" 
                                    size={10}
                                    color={Colors.TEXT_INVERSE} 
                                />
                                <CustomText variant="caption" style={styles.location} numberOfLines={1}>
                                    {location}
                                </CustomText>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    
                    <View style={styles.statsGroup}>
                        <StatItem 
                            label="Distance" 
                            value={displayLength}
                        />

                        <View style={styles.verticalDivider} />

                        <StatItem 
                            label="Elev" 
                            value={displayElev}
                        />

                        <View style={styles.verticalDivider} />

                        <StatItem 
                            label="Time" 
                            value={displayTime} 
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.downloadButtonCircle}
                        onPress={onDownload}
                        activeOpacity={0.7}
                    >
                        <CustomIcon
                            library="Feather"
                            name="download"
                            size={18}
                            color={Colors.TEXT_INVERSE}
                        />
                    </TouchableOpacity>

                </View>
            </View>
        </TouchableOpacity>
    );
};

const getMountainData = (item) => {
    const name = item.general?.name || item.name || "Unnamed Mountain";

    let location = "Unknown Location";
    if (item.address) {
        location = item.address;
    } else if (item.general?.address) {
        location = item.general.address;
    } else if (item.province) {
        location = Array.isArray(item.province) ? item.province[0] : item.province;
    } else if (item.general?.province && Array.isArray(item.general.province) && item.general.province.length > 0) {
        location = item.general.province[0];
    } else if (item.location) {
        location = item.location;
    }
    
    const rawLength = item.length || item.difficulty?.length;
    const displayLength = rawLength ? `${rawLength} km` : "--";

    const rawElev = item.masl || item.geographical?.masl || item.difficulty?.gain || item.elevation;
    const displayElev = rawElev ? `${rawElev} masl` : "--";

    const rawTime = item.hours || item.difficulty?.hours || item.duration;
    const displayTime = rawTime ? `${rawTime} h` : "--";

    const score = item.score || item.rating || "N/A";

    const rawTemp = item.weather?.temperature || item.temperature || "26"; 
    const displayTemp = rawTemp ? `${rawTemp}°C` : null;

    return {
        name, 
        location, 
        displayLength, 
        displayElev, 
        displayTime, 
        score, 
        displayTemp
    };
};

const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
        <CustomText variant="caption" style={styles.statValue}>
            {value}
        </CustomText>
        <CustomText variant="caption" style={styles.statLabel}>
            {label}
        </CustomText>
    </View>
);

const styles = StyleSheet.create({
    cardContainer: {
        width: 280, 
        backgroundColor: Colors.WHITE,
        borderRadius: 24, 
        marginBottom: 0,
        overflow: 'hidden',
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    imageContainer: {
        height: 180, 
        width: '100%',
        position: 'relative', 
        backgroundColor: Colors.GRAY_LIGHT,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.PRIMARY,
    },

    glassPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    badgeText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    
    ratePosition: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 2,
    },
    weatherPosition: {
        position: 'absolute',
        top: 12,
        right: 12, 
        zIndex: 2,
    },

    gradientOverlay: {
        position: 'absolute', 
        left: 0,
        right: 0,
        bottom: 0,
        height: '80%', 
        justifyContent: 'flex-end',
        padding: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end', 
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
        color: Colors.TEXT_INVERSE, 
        marginBottom: 4,
        textShadowColor: Colors.SHADOW,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        gap: 8,
    },
    location: {
        color: Colors.TEXT_INVERSE, 
        fontWeight: '500',
    },
    
    statsContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: Colors.WHITE,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    statsGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 8,
    },
    statItem: {
        alignItems: 'flex-start',
        maxWidth: 60,
    },
    statValue: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    statLabel: {
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase', 
        fontWeight: '400',
        fontSize: 12,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    downloadButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MountainCard;