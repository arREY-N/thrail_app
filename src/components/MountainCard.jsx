import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const MountainCard = ({ 
    item = {},
    onPress,
    onDownload,
    onLikePress,
    style
}) => {

    const { 
        name, 
        location, 
        displayLength, 
        displayElev, 
        displayTime, 
        score,
        displayTemp,
        heroImage
    } = getMountainData(item);

    return (
        <TouchableOpacity 
            style={[styles.cardContainer, style]} 
            activeOpacity={0.9} 
            onPress={onPress}
        >
            <View style={styles.imageContainer}>
                
                <Image 
                    source={heroImage} 
                    style={styles.cardImage}
                    resizeMode="cover"
                />

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
                        onPress={onDownload & onLikePress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon
                            library="Feather"
                            name="heart"
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
    const name = item?.general?.name || "Unnamed Mountain";

    let location = "Unknown Location";
    if (item?.general?.province && item.general.province.length > 0) {
        location = item.general.province[0];
    } else if (item?.general?.address) {
        location = item.general.address;
    }
    
    const displayLength = item?.difficulty?.length ? `${item.difficulty.length} km` : "--";
    const displayElev = item?.geography?.masl ? `${item.geography.masl} masl` : "--";
    const displayTime = item?.difficulty?.hours ? `${item.difficulty.hours} h` : "--";
    const score = item?.general?.rating || "N/A";
    const displayTemp = item?.weather?.temperature ? `${item.weather.temperature}°C` : "-- °C";

    const images = [
        require('@/src/assets/images/MT1.jpg'),
        require('@/src/assets/images/MT2.jpg'),
        require('@/src/assets/images/MT3.jpg'),
        require('@/src/assets/images/MT4.jpg'),
        require('@/src/assets/images/MT5.jpg'),
        require("@/src/assets/images/Mt.Tagapo.jpg"),
    ];
    
    const uniqueString = item?.id ? String(item.id) : name;

    let hash = 0;
    for (let i = 0; i < uniqueString.length; i++) {
        const char = uniqueString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const positiveHash = Math.abs(hash);
    const imageIndex = positiveHash % images.length;
    const heroImage = images[imageIndex];

    return {
        name, 
        location, 
        displayLength, 
        displayElev, 
        displayTime, 
        score, 
        displayTemp,
        heroImage
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
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,

        ...Platform.select({
            ios: {
                shadowColor: Colors.SHADOW,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }
        })
    },
    imageContainer: {
        height: 180, 
        width: '100%',
        position: 'relative', 
        backgroundColor: Colors.GRAY_LIGHT,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.GRAY_LIGHT,
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
        height: '65%', 
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

        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: '0px 1px 4px rgba(0,0,0,0.5)', 
            }
        })
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