/**
 * @file BusinessScreen.tsx
 * @description Pure presentation screen for the Tour Business profile.
 * Features a Recommendation-style scenic cover banner + 4-column key specs bar (BusinessHeroCard),
 * followed by a sticky segmented pill 3-tab switcher (Offers | About | Reviews).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Admin } from '@/src/core/models/Admin/Admin';
import { Business } from '@/src/core/models/Business/Business';
import { BusinessReview } from '@/src/core/models/BusinessReview/interfaces/BusinessReview';
import { IReview } from '@/src/core/models/Review/Review';
import { ITrail } from '@/src/core/models/Trail/Trail';
import BusinessHeroCard from '@/src/features/Business/components/BusinessHeroCard';
import BusinessOffersTab from '@/src/features/Business/tabs/BusinessOffersTab';
import BusinessPermitsAboutTab, {
    LOCAL_BUSINESS_PERMIT_ASSETS,
} from '@/src/features/Business/tabs/BusinessPermitsAboutTab';
import BusinessReviewsTab from '@/src/features/Business/tabs/BusinessReviewsTab';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export type BusinessTabType = 'Offers' | 'About' | 'Reviews';

/**
 * Props for the BusinessScreen component.
 *
 * @param business - The tour business model data.
 * @param admins - Guide / coordinator personnel under this business.
 * @param featuredTrails - Top 3 soonest upcoming bookable trail packages.
 * @param allTrails - All unique trails with active offers from this business.
 * @param packageCount - Count of active upcoming packages/offers for this business.
 * @param reviews - Collected hiker reviews from booked hikes and offers of this business.
 * @param rating - Dynamically calculated review rating score.
 * @param reviewsCount - Dynamically calculated total count of business reviews.
 * @param isReviewsLoading - Loading state for business reviews.
 * @param likeReview - Callback to toggle like on a review post.
 * @param isLiked - Predicate checking if the logged-in user liked a review post.
 * @param onWriteReviewPress - Callback to edit an owned review post.
 * @param isLoading - Global loading state boolean.
 * @param isRefreshing - Pull-to-refresh active boolean.
 * @param onRefresh - Callback triggered on pull-to-refresh.
 * @param onBackPress - Callback for the back navigation button.
 * @param onMountainPress - Callback when a mountain card is clicked (navigates to TrailScreen).
 * @param onDownloadPress - Callback when a mountain card download button is clicked.
 * @param getItemRating - Function returning rating score for a trail ID.
 * @param getTrailOffersCount - Function returning active offers count for a trail ID.
 */
export interface BusinessScreenProps {
    business?: Business | null;
    admins?: Admin[];
    featuredTrails?: ITrail[];
    allTrails?: ITrail[];
    packageCount?: number;
    reviews?: BusinessReview[];
    rating?: number;
    reviewsCount?: number;
    isReviewsLoading?: boolean;
    likeReview?: (review: IReview) => void;
    isLiked?: (review: IReview) => boolean;
    onWriteReviewPress?: (review: IReview) => void;
    isLoading?: boolean;
    isRefreshing?: boolean;
    onRefresh?: () => Promise<void> | void;
    onBackPress: () => void;
    onMountainPress: (trailId: string) => void;
    onDownloadPress: (trailId: string) => void;
    getItemRating: (trailId: string) => number;
    getTrailOffersCount: (trailId: string) => number;
}

/**
 * BusinessScreen — Presentation view displaying a tour organizer's cover banner, key specs,
 * active trail offers, consolidated About/Teams/Permits info, and verified hiker reviews.
 *
 * @param props - BusinessScreenProps
 * @returns React.JSX.Element rendering the business profile screen
 */
const BusinessScreen = ({
    business,
    admins = [],
    featuredTrails = [],
    allTrails = [],
    packageCount = 0,
    reviews = [],
    rating = 0,
    reviewsCount = 0,
    isReviewsLoading = false,
    likeReview,
    isLiked,
    onWriteReviewPress,
    isLoading = false,
    isRefreshing = false,
    onRefresh,
    onBackPress,
    onMountainPress,
    onDownloadPress,
    getItemRating,
    getTrailOffersCount,
}: BusinessScreenProps): React.JSX.Element => {
    const [activeTab, setActiveTab] = useState<BusinessTabType>('Offers');

    const scrollViewRef = useRef<ScrollView>(null);

    const { width, isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth: number | `${number}%` = isDesktop ? 860 : (isTablet ? 680 : '100%');
    const responsiveAlignStyle = {
        maxWidth: contentMaxWidth,
        alignSelf: 'center' as const,
        width: '100%' as const,
    };

    const effectiveContentWidth = typeof contentMaxWidth === 'number'
        ? Math.min(width, contentMaxWidth)
        : width;
    const cardWidth = Math.min(width * 0.85, 360);

    const handleTabChange = useCallback(
        (tab: BusinessTabType) => {
            if (tab === activeTab) {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                return;
            }
            setActiveTab(tab);
        },
        [activeTab]
    );

    // Count verified local permits wired in LOCAL_BUSINESS_PERMIT_ASSETS (DENR, DTI, BIR)
    const permitsCount = Object.keys(LOCAL_BUSINESS_PERMIT_ASSETS).length;

    // Calculate unique active team members count (owner + deduplicated active admins)
    const uniqueTeamCount = useMemo(() => {
        const ownerId = business?.owner?.id?.trim();
        const ownerEmail = business?.owner?.email?.trim().toLowerCase();
        const activeNonOwnerAdmins = admins.filter((a) => {
            if (a.status === 'removed') return false;
            if (ownerId && a.id?.trim() === ownerId) return false;
            if (ownerEmail && a.email?.trim().toLowerCase() === ownerEmail) return false;
            return true;
        });
        return (business?.owner ? 1 : 0) + activeNonOwnerAdmins.length;
    }, [business?.owner, admins]);

    if (isLoading && !business) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title="Business Profile"
                    centerTitle={true}
                    onBackPress={onBackPress}
                />
                <CustomLoading />
            </ScreenWrapper>
        );
    }

    if (!business) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title="Business Profile"
                    centerTitle={true}
                    onBackPress={onBackPress}
                />
                <View style={styles.errorContainer}>
                    <CustomIcon
                        library="Ionicons"
                        name="alert-circle-outline"
                        size={48}
                        color={Colors.RED}
                    />
                    <CustomText variant="body" style={styles.errorText}>
                        Tour organizer details not found.
                    </CustomText>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Business Profile"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <ResponsiveScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[1]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                overScrollMode="always"
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={Boolean(isRefreshing)}
                            onRefresh={onRefresh}
                            colors={[Colors.PRIMARY]}
                            tintColor={Colors.PRIMARY}
                        />
                    ) : undefined
                }
            >
                {/* 1. SCENIC COVER BANNER & 4-COLUMN SPECS CARD (Matching Recommendation Screen) */}
                <BusinessHeroCard
                    business={business}
                    packageCount={packageCount}
                    guidesCount={uniqueTeamCount}
                    permitsCount={permitsCount}
                    rating={rating}
                    reviewsCount={reviewsCount}
                    contentMaxWidth={contentMaxWidth}
                />

                {/* 2. STICKY SEGMENTED PILL TABS (Offers | About | Reviews) */}
                <View style={styles.stickyTabsBar}>
                    <View style={[styles.floatingTabsContainer, responsiveAlignStyle]}>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'Offers' && styles.tabButtonActive,
                            ]}
                            onPress={() => handleTabChange('Offers')}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Feather"
                                name="compass"
                                size={activeTab === 'Offers' ? 18 : 16}
                                color={activeTab === 'Offers' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'Offers' && styles.tabTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                Offers
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'About' && styles.tabButtonActive,
                            ]}
                            onPress={() => handleTabChange('About')}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Feather"
                                name="info"
                                size={activeTab === 'About' ? 18 : 16}
                                color={activeTab === 'About' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'About' && styles.tabTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                About
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'Reviews' && styles.tabButtonActive,
                            ]}
                            onPress={() => handleTabChange('Reviews')}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Feather"
                                name="star"
                                size={activeTab === 'Reviews' ? 18 : 16}
                                color={activeTab === 'Reviews' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'Reviews' && styles.tabTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                {reviewsCount > 0 ? `Reviews (${reviewsCount})` : 'Reviews'}
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. TAB CONTENT CONTAINER */}
                <View style={[styles.tabContentContainer, responsiveAlignStyle]}>
                    {activeTab === 'Offers' && (
                        <BusinessOffersTab
                            featuredTrails={featuredTrails}
                            allTrails={allTrails}
                            onMountainPress={onMountainPress}
                            onDownloadPress={onDownloadPress}
                            getItemRating={getItemRating}
                            getTrailOffersCount={getTrailOffersCount}
                            cardWidth={cardWidth}
                            contentWidth={effectiveContentWidth}
                        />
                    )}

                    {activeTab === 'About' && (
                        <BusinessPermitsAboutTab
                            business={business}
                            admins={admins}
                        />
                    )}

                    {activeTab === 'Reviews' && (
                        <BusinessReviewsTab
                            reviews={reviews}
                            rating={rating}
                            reviewsCount={reviewsCount}
                            isLoading={isReviewsLoading}
                            likeReview={likeReview}
                            isLiked={isLiked}
                            onWriteReviewPress={onWriteReviewPress}
                        />
                    )}
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 32,
    },
    stickyTabsBar: {
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        zIndex: 10,
    },
    floatingTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 3,
        borderRadius: 20,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(4, 0.1, Colors.SHADOW, { radius: 8 }),
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    tabTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    tabContentContainer: {
        flex: 1,
        paddingTop: 8,
        marginBottom: 24,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
    },
    errorText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
});

export default BusinessScreen;
