import { DimensionValue, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { IconLibrary } from '@/src/types/ui.types';

interface AchievementBadgeProps {
    title: string;
    icon: string;
    earned?: boolean;
}

const AchievementBadge = ({ title, icon, earned }: AchievementBadgeProps) => (
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

const AchievementBadgeSkeleton = () => (
    <View style={styles.badgeContainer}>
        <SkeletonEffect style={styles.badgeShieldSkeleton} />
        <SkeletonEffect style={styles.badgeTitleSkeleton} />
    </View>
);

interface StatBentoBoxProps {
    title: string;
    value?: string | number;
    subLabel: string;
    subValue?: string;
    icon: string;
    lib?: IconLibrary;
    boxWidth: DimensionValue;
}

const StatBentoBox = ({ title, value, subLabel, subValue, icon, lib = "Ionicons", boxWidth }: StatBentoBoxProps) => (
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

interface StatBentoBoxSkeletonProps {
    boxWidth: DimensionValue;
}

const StatBentoBoxSkeleton = ({ boxWidth }: StatBentoBoxSkeletonProps) => (
    <View style={[styles.bentoBox, { width: boxWidth }]}>
        <View style={styles.bentoHeader}>
            <SkeletonEffect style={styles.bentoIconSkeleton} />
            <SkeletonEffect style={styles.bentoTitleSkeleton} />
        </View>
        
        <View style={styles.bentoMiddle}>
            <SkeletonEffect style={styles.bentoValueSkeleton} />
        </View>

        <View style={styles.bentoBottom}>
            <SkeletonEffect style={styles.bentoSubLabelSkeleton} />
            <SkeletonEffect style={styles.bentoSubValueSkeleton} />
        </View>
    </View>
);

export interface MilestonesTabProps {
    stats?: {
        achievements?: {
            beginner?: boolean;
            regular?: boolean;
            experienced?: boolean;
        };
        longestDistance?: {
            value?: string;
            trail?: string;
        };
        longestTime?: {
            value?: string;
            trail?: string;
        };
        highestPoint?: {
            value?: string;
            trail?: string;
        };
        totalHikes?: {
            value?: string;
            lastHike?: string;
        };
    };
    /** When true, renders animated skeleton placeholders instead of actual data */
    isLoading?: boolean;
}

/**
 * MilestonesTabSkeleton — Shimmering skeleton placeholders mirroring the
 * exact layout of the Achievements card and Bento stat boxes.
 */
export const MilestonesTabSkeleton = () => {
    const { isMobile } = useBreakpoints();
    const bentoBoxWidth = isMobile ? '47.5%' : '23.5%';

    return (
        <View style={styles.container}>
            <View style={styles.fullWidthCard}>
                <View style={styles.cardHeader}>
                    <SkeletonEffect style={styles.cardHeaderIconSkeleton} />
                    <SkeletonEffect style={styles.cardHeaderTitleSkeleton} />
                </View>
                
                <View style={styles.badgesRow}>
                    <AchievementBadgeSkeleton />
                    <AchievementBadgeSkeleton />
                    <AchievementBadgeSkeleton />
                </View>
            </View>

            <View style={styles.bentoGrid}>
                <StatBentoBoxSkeleton boxWidth={bentoBoxWidth} />
                <StatBentoBoxSkeleton boxWidth={bentoBoxWidth} />
                <StatBentoBoxSkeleton boxWidth={bentoBoxWidth} />
                <StatBentoBoxSkeleton boxWidth={bentoBoxWidth} />
            </View>
        </View>
    );
};

const MilestonesTab = ({ stats, isLoading }: MilestonesTabProps) => {
    const { isMobile } = useBreakpoints();
    
    const bentoBoxWidth = isMobile ? '47.5%' : '23.5%';

    if (isLoading || !stats) {
        return <MilestonesTabSkeleton />;
    }

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
        ...GlobalStyles.dropShadow(3),
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
        ...GlobalStyles.dropShadow(3),
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
        ...GlobalStyles.dropShadow(3),
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

    /* Skeleton Loading Styles */
    cardHeaderIconSkeleton: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    cardHeaderTitleSkeleton: {
        width: 110,
        height: 16,
        borderRadius: 4,
    },
    badgeShieldSkeleton: {
        width: 72,
        height: 72,
        borderRadius: 22,
    },
    badgeTitleSkeleton: {
        width: 60,
        height: 12,
        borderRadius: 4,
    },
    bentoIconSkeleton: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    bentoTitleSkeleton: {
        width: '60%',
        height: 14,
        borderRadius: 4,
    },
    bentoValueSkeleton: {
        width: '75%',
        height: 32,
        borderRadius: 6,
    },
    bentoSubLabelSkeleton: {
        width: '35%',
        height: 12,
        borderRadius: 4,
        marginBottom: 4,
    },
    bentoSubValueSkeleton: {
        width: '60%',
        height: 14,
        borderRadius: 4,
    },
});

export default MilestonesTab;
