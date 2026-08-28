import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useTrailStats } from '@/src/core/hook/trail/useTrailStats';
import { IReview } from '@/src/core/models/Review/Review';
import { ITrail } from '@/src/core/models/Trail/Trail';
import { getHeroImageSource } from '@/src/features/Trail/utils/TrailDetailsHelpers';

import TrailDetailsTab from '@/src/features/Trail/tabs/TrailDetailsTab';
import TrailReviewsTab from '@/src/features/Trail/tabs/TrailReviewsTab';
import TrailWeatherTab from '@/src/features/Trail/tabs/TrailWeatherTab';

export interface TrailScreenProps {
    trail?: ITrail | null;
    onBackPress: () => void;
    onDownloadPress?: () => void;
    onHikePress: (id?: string) => void;
    onBookPress: (id?: string) => void;
    onEditPress: () => void;
    isSuperadmin: boolean;
    reviews?: IReview[] | null;
    isLoading: boolean;
    likeReview: (review: IReview) => void;
    isLiked: (review: IReview) => boolean;
    onWriteReviewPress: (review: IReview) => void;
    isOwned: (review: IReview) => boolean;
}

const TrailScreen: React.FC<TrailScreenProps> = ({
    trail,
    onBackPress,
    onDownloadPress,
    onHikePress,
    onBookPress,
    onEditPress,
    isSuperadmin,
    reviews,
    isLoading,
    likeReview,
    isLiked,
    onWriteReviewPress,
    isOwned,
}) => {
    const [activeTab, setActiveTab] = useState('Details');
    const insets = useSafeAreaInsets();

    const { stats: trailStats, isLoading: statsLoading } = useTrailStats(
        trail?.general?.name,
        trail?.geography?.startLat,
        trail?.geography?.startLong
    );

    const heroImage = getHeroImageSource(trail);
    const name = trail?.general?.name || "Unnamed Trail";

    const location = Array.isArray(trail?.general?.province)
        ? trail.general.province.join(', ')
        : (trail?.general?.province || "Unknown Location");

    const address = trail?.general?.address || location;

    const validReviewsCount = reviews?.length || 1;
    const totalRating = reviews?.reduce((acc, r) => acc + (r?.overallRating || 0), 0) ?? 0;
    const rating = (totalRating / validReviewsCount) || 0;
    const reviewsCount = reviews?.length || 0;

    const stats = {
        distance: trail?.difficulty?.length ? `${trail.difficulty.length} km` : "--",
        time: trail?.difficulty?.hours ? `${trail.difficulty.hours} hr` : "--",
        elevation: trail?.difficulty?.elevation ? `${trail.difficulty.elevation} m` : "--",
    };

    const latitude = trail?.geography?.startLat ?? null;
    const longitude = trail?.geography?.startLong ?? null;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <TouchableOpacity style={styles.backButton} onPress={onBackPress} activeOpacity={0.7}>
                <CustomIcon
                    library="Feather"
                    name="chevron-left"
                    size={28}
                    color={Colors.WHITE}
                />
            </TouchableOpacity>

            {isSuperadmin && (
                <TouchableOpacity style={styles.editButton} onPress={onEditPress} activeOpacity={0.7}>
                    <CustomIcon
                        library="Feather"
                        name="edit-2"
                        size={20}
                        color={Colors.WHITE}
                    />
                </TouchableOpacity>
            )}

            <ResponsiveScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={[styles.container, { marginTop: -insets.top }]}
            >
                <View style={styles.imageContainer}>
                    <CustomImage
                        source={heroImage}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.bodyContainer}>
                    <View style={styles.headerInfo}>
                        <View style={styles.titleRow}>
                            <View style={{ flex: 1 }}>

                                <CustomText variant="h2" style={styles.title}>
                                    {name}
                                </CustomText>

                                <CustomText variant="body" style={styles.address}>
                                    {address as string}
                                </CustomText>

                                <View style={styles.ratingRow}>
                                    <CustomIcon
                                        library="Ionicons"
                                        name="star"
                                        size={14}
                                        color={Colors.YELLOW}
                                    />

                                    <CustomText style={styles.ratingText}>
                                        {rating.toFixed(1)} ({reviewsCount})
                                    </CustomText>
                                </View>

                            </View>
                        </View>
                    </View>

                    <View style={styles.tabContainer}>
                        {['Details', 'Offline Map', 'Weather', 'Reviews'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <CustomText style={[
                                    styles.tabText,
                                    activeTab === tab && styles.activeTabText
                                ]}>
                                    {tab}
                                </CustomText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {activeTab === 'Details' && (
                        <TrailDetailsTab
                            stats={stats}
                            trailStats={trailStats}
                            statsLoading={statsLoading}
                            trail={trail}
                        />
                    )}

                    {activeTab === 'Weather' && (
                        <TrailWeatherTab
                            latitude={latitude}
                            longitude={longitude}
                            trail={trail}
                        />
                    )}

                    {activeTab === 'Reviews' && (
                        <TrailReviewsTab
                            reviews={reviews}
                            isLoading={isLoading}
                            likeReview={likeReview}
                            isLiked={isLiked}
                            onWriteReviewPress={onWriteReviewPress}
                            isOwned={isOwned}
                        />
                    )}

                </View>
            </ResponsiveScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: "Book",
                    onPress: () => onBookPress(trail?.id)
                }}
                secondaryButton={{
                    title: "Hike",
                    onPress: () => onHikePress(trail?.id),
                    variant: 'outline',
                    style: { borderColor: Colors.PRIMARY, borderWidth: 1.5 },
                    textStyle: { color: Colors.PRIMARY }
                }}
            />

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },

    scrollContent: {
        paddingBottom: 120,
    },

    imageContainer: {
        height: 350,
        width: '100%',
        position: 'relative',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 24,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    editButton: {
        position: 'absolute',
        top: 24,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },

    bodyContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 24,

        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2, 0.1, Colors.SHADOW, {
            offset: { width: 0, height: -2 },
            radius: 4
        }),
    },
    headerInfo: {
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    address: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 0,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontWeight: 'bold',
        fontSize: 14,
    },

    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 0,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.PRIMARY,
    },
    tabText: {
        fontSize: 16,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginBottom: 24,
    },
});

export default TrailScreen;