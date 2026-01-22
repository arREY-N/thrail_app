import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
//npx expo install expo-linear-gradient
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '../../../components/CustomText';
import { Colors } from '../../../constants/colors';

const MountainCard = ({ item = {}, onPress, onDownload, style }) => {

    return (
        <TouchableOpacity 
            style={[styles.cardContainer, style]} 
            activeOpacity={0.9} 
            onPress={onPress}
        >
            <View style={styles.imageContainer}>
                
                <View style={styles.placeholderImage} />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.headerContent}>
                        
                        <View style={styles.textContainer}>
                            <CustomText style={styles.title} numberOfLines={1}>
                                {item?.name || "Mountain Name"} 
                            </CustomText>
                            
                            <View style={styles.locationRow}>
                                <Ionicons name="location-sharp" size={12} color={Colors.GRAY_LIGHT} />
                                <CustomText style={styles.location} numberOfLines={1}>
                                    {item?.location || "Location"}
                                </CustomText>
                            </View>
                        </View>

                        <View style={styles.glassBadge}>
                            <Ionicons name="star" size={12} color={Colors.YELLOW} />
                            <CustomText style={styles.ratingText}>
                                {item?.score || "--"}
                            </CustomText>
                        </View>

                    </View>
                </LinearGradient>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    
                    <View style={styles.statsGroup}>
                        <StatItem label="Distance" value={item?.length || "--"} />
                        <View style={styles.verticalDivider} />
                        <StatItem label="Elev" value={item?.elevation || "--"} />
                        <View style={styles.verticalDivider} />
                        <StatItem label="Time" value={item?.duration || "--"} />
                    </View>

                    <TouchableOpacity 
                        style={styles.downloadButtonCircle}
                        onPress={onDownload}
                        activeOpacity={0.7}
                    >
                        <Feather name="download" size={18} color={Colors.WHITE} />
                    </TouchableOpacity>

                </View>
            </View>
        </TouchableOpacity>
    );
};

const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
        <CustomText style={styles.statValue}>{value}</CustomText>
        <CustomText style={styles.statLabel}>{label}</CustomText>
    </View>
);

const styles = StyleSheet.create({
    cardContainer: {
        width: 280, 
        backgroundColor: Colors.WHITE,
        borderRadius: 20, 
        marginBottom: 0, 
        overflow: 'hidden',
        
        shadowColor: "#000",
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
        backgroundColor: Colors.SECONDARY,
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
        marginRight: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.WHITE, 
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)', 
        fontWeight: '500',
    },
    
    glassBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.WHITE,
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
    },
    statsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItem: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontSize: 14, 
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 0,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.Gray,
        textTransform: 'uppercase', 
        fontWeight: '400',
    },
    verticalDivider: {
        width: 2,
        height: 32,
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