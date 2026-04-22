import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const AchievementBadge = ({ title, icon, earned }) => (
    <View style={styles.badgeContainer}>
        <View style={[
            styles.badgeShield, 
            earned ? styles.badgeEarned : styles.badgeLocked
        ]}>
            <CustomIcon 
                library="Ionicons" 
                name={earned ? icon : `${icon}-outline`} 
                size={34} 
                color={earned ? Colors.WHITE : Colors.GRAY_MEDIUM} 
            />
        </View>
        <CustomText 
            variant="label" 
            style={[styles.badgeTitle, earned ? styles.badgeTitleEarned : styles.badgeTitleLocked]}
        >
            {title}
        </CustomText>
    </View>
);


const StatBentoBox = ({ title, value, subLabel, subValue, icon, lib = "Ionicons", boxWidth }) => (
    <View style={[styles.bentoBox, { width: boxWidth }]}>
        <View style={styles.bentoHeader}>
            <CustomIcon library={lib} name={icon} size={20} color={Colors.PRIMARY} />
            <CustomText variant="label" style={styles.bentoTitle}>{title}</CustomText>
        </View>
        
        <View style={styles.bentoMiddle}>
            <CustomText style={styles.bentoValue}>
                {value}
            </CustomText>
        </View>

        <View style={styles.bentoBottom}>
            <CustomText variant="caption" style={styles.bentoSubLabel}>{subLabel}</CustomText>
            <CustomText variant="label" style={styles.bentoSubValue}>
                {subValue}
            </CustomText>
        </View>
    </View>
);

const MilestonesTab = ({ stats }) => {
    const { isMobile } = useBreakpoints();
    
    const bentoBoxWidth = isMobile ? '47.5%' : '23.5%';

    if (!stats) return null;

    return (
        <View style={styles.container}>
            
            <View style={styles.fullWidthCard}>
                <View style={styles.cardHeader}>
                    <CustomIcon library="Ionicons" name="medal-outline" size={20} color={Colors.PRIMARY} />
                    <CustomText variant="label" style={styles.cardHeaderTitle}>Achievements</CustomText>
                </View>
                
                <View style={styles.badgesRow}>
                    <AchievementBadge 
                        title="Beginner" 
                        icon="trail-sign"
                        earned={stats.achievements?.beginner} 
                    />
                    <AchievementBadge 
                        title="Regular" 
                        icon="compass"
                        earned={stats.achievements?.regular} 
                    />
                    <AchievementBadge 
                        title="Experienced" 
                        icon="trophy"
                        earned={stats.achievements?.experienced} 
                    />
                </View>
            </View>

            <View style={styles.bentoGrid}>
                <StatBentoBox 
                    boxWidth={bentoBoxWidth}
                    title="Longest Distance" 
                    value={stats.longestDistance?.value} 
                    subLabel="Trail:" 
                    subValue={stats.longestDistance?.trail} 
                    icon="resize" 
                />
                <StatBentoBox 
                    boxWidth={bentoBoxWidth}
                    title="Longest Time" 
                    value={stats.longestTime?.value} 
                    subLabel="Trail:" 
                    subValue={stats.longestTime?.trail} 
                    icon="time-outline" 
                />
                <StatBentoBox 
                    boxWidth={bentoBoxWidth}
                    title="Highest Point" 
                    value={stats.highestPoint?.value} 
                    subLabel="Trail:" 
                    subValue={stats.highestPoint?.trail} 
                    icon="flag-outline" 
                />
                <StatBentoBox 
                    boxWidth={bentoBoxWidth}
                    title="Total Hikes" 
                    value={stats.totalHikes?.value} 
                    subLabel="Last hike:" 
                    subValue={stats.totalHikes?.lastHike} 
                    icon="map-outline" 
                />
            </View>

        </View>
    );
};

const dropShadow = Platform.select({
    ios: {
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    android: {
        elevation: 3,
    },
    web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
    }
});

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    fullWidthCard: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    cardHeaderTitle: {
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badgesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
    },
    badgeContainer: {
        alignItems: 'center',
        gap: 10,
    },
    badgeShield: {
        width: 72,
        height: 72,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    badgeEarned: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
        ...dropShadow,
    },
    badgeLocked: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
        borderStyle: 'dashed',
    },
    badgeTitle: {
        fontWeight: '700',
    },
    badgeTitleEarned: {
        color: Colors.TEXT_PRIMARY,
    },
    badgeTitleLocked: {
        color: Colors.TEXT_PLACEHOLDER,
    },

    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    bentoBox: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 20,
        padding: 16,

        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
    },
    bentoHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start', 
        gap: 8,
    },
    bentoTitle: {
        color: Colors.TEXT_SECONDARY,
        flex: 1,
    },
    bentoMiddle: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 12,
    },
    bentoValue: {
        fontSize: 30, 
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        includeFontPadding: false,
    },
    bentoBottom: {
        marginTop: 8,
        justifyContent: 'flex-end',
    },
    bentoSubLabel: {
        fontSize: 12,
    },
    bentoSubValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
});

export default MilestonesTab;