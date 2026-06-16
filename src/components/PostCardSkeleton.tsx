import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

const PostCardSkeleton = () => {
    return (
        <View style={styles.card}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <SkeletonEffect style={styles.avatarSkeleton} />
                    <View style={styles.userInfo}>
                        <SkeletonEffect style={styles.userNameSkeleton} />
                        <SkeletonEffect style={styles.dateSkeleton} />
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <SkeletonEffect style={styles.ratingBadgeSkeleton} />
                    <SkeletonEffect style={styles.likeBadgeSkeleton} />
                </View>
            </View>

            {/* Image Hero Section */}
            <View style={styles.imageWrapper}>
                <SkeletonEffect style={styles.postImageSkeleton} />
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <SkeletonEffect style={styles.statValueSkeleton} />
                    <SkeletonEffect style={styles.statLabelSkeleton} />
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statBox}>
                    <SkeletonEffect style={styles.statValueSkeleton} />
                    <SkeletonEffect style={styles.statLabelSkeleton} />
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statBox}>
                    <SkeletonEffect style={styles.statValueSkeleton} />
                    <SkeletonEffect style={styles.statLabelSkeleton} />
                </View>
            </View>

            <View style={styles.horizontalDivider} />

            {/* Tags Row */}
            <View style={styles.tagsContainer}>
                <SkeletonEffect style={styles.tagSkeletonLarge} />
                <SkeletonEffect style={styles.tagSkeletonSmall} />
            </View>

            {/* Text Body */}
            <View style={styles.textBody}>
                <SkeletonEffect style={styles.textLine1} />
                <SkeletonEffect style={styles.textLine2} />
                <SkeletonEffect style={styles.textLine3} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { 
        backgroundColor: Colors.WHITE, 
        marginBottom: 0, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        ...GlobalStyles.dropShadow(3), 
        overflow: 'hidden',
        padding: 16,
        ...Platform.select({
            web: { boxShadow: `0px 4px 8px ${Colors.SHADOW}0D` }
        })
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    
    avatarSkeleton: { width: 44, height: 44, borderRadius: 22 },
    userInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    userNameSkeleton: { width: 120, height: 16, borderRadius: 4, marginBottom: 6 },
    dateSkeleton: { width: 80, height: 12, borderRadius: 4 },
    
    ratingBadgeSkeleton: { width: 50, height: 26, borderRadius: 12 },
    likeBadgeSkeleton: { width: 50, height: 26, borderRadius: 12 },

    imageWrapper: { height: 200, width: '100%', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
    postImageSkeleton: { width: '100%', height: '100%', borderRadius: 16 },

    statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 16 },
    statBox: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    statValueSkeleton: { width: 60, height: 20, borderRadius: 4, marginBottom: 6 },
    statLabelSkeleton: { width: 50, height: 10, borderRadius: 4 },
    verticalDivider: { width: 1, height: 24, backgroundColor: Colors.GRAY_LIGHT },
    horizontalDivider: { height: 1, backgroundColor: Colors.GRAY_ULTRALIGHT, width: '100%', marginBottom: 12 },

    tagsContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tagSkeletonLarge: { width: 100, height: 24, borderRadius: 12 },
    tagSkeletonSmall: { width: 80, height: 24, borderRadius: 12 },

    textBody: { width: '100%', gap: 6 },
    textLine1: { width: '100%', height: 12, borderRadius: 4 },
    textLine2: { width: '90%', height: 12, borderRadius: 4 },
    textLine3: { width: '60%', height: 12, borderRadius: 4 },
});

export default PostCardSkeleton;
