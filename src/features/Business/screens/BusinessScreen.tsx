/**
 * @file BusinessScreen.tsx
 * @description Pure presentation screen for the Tour Business profile.
 * Features a Recommendation-style scenic cover banner + 4-column key specs bar (BusinessHeroCard),
 * followed by a sticky segmented pill 3-tab switcher (Offers | About | Reviews).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Admin } from '@/src/core/models/Admin/Admin';
import { Business } from '@/src/core/models/Business/Business';
import { BusinessReview } from '@/src/core/models/BusinessReview/BusinessReview';
import { ITrail } from '@/src/core/models/Trail/Trail';
import BusinessHeroCard from '@/src/features/Business/components/BusinessHeroCard';
import BusinessProfileSkeleton from '@/src/features/Business/components/BusinessProfileSkeleton';
import BusinessOffersTab from '@/src/features/Business/tabs/BusinessOffersTab';
import BusinessPermitsAboutTab, {
    LOCAL_BUSINESS_PERMIT_ASSETS,
} from '@/src/features/Business/tabs/BusinessPermitsAboutTab';
import BusinessReviewsTab from '@/src/features/Business/tabs/BusinessReviewsTab';
import {
    BusinessTabType,
    resolveBusinessPersonnel,
} from '@/src/features/Business/utils/businessHelpers';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export type { BusinessTabType };

/**
 * Props for the BusinessScreen component.
 *
 * @param business - The tour business model data.
 * @param admins - Guide / coordinator personnel under this business.
 * @param allTrails - All unique trails with active offers from this business.
 * @param packageCount - Count of active upcoming offers for this business.
 * @param reviews - Collected hiker reviews from booked hikes and offers of this business.
 * @param rating - Server-aggregated review rating score.
 * @param reviewsCount - Server-aggregated total count of business reviews.
 * @param isOffersLoading - Loading state for offers and trails tab.
 * @param isReviewsLoading - Loading state for business reviews.
 * @param isLoading - Global loading state boolean.
 * @param isRefreshing - Pull-to-refresh active boolean.
 * @param onRefresh - Callback triggered on pull-to-refresh, scoped by active tab.
 * @param onBackPress - Callback for the back navigation button.
 * @param onMountainPress - Callback when a mountain card is clicked (navigates to TrailScreen).
 * @param onDownloadPress - Callback when a mountain card download button is clicked.
 * @param getItemRating - Function returning rating score for a trail ID.
 * @param getTrailOffersCount - Function returning active offers count for a trail ID.
 * @param getTrailEarliestOfferTime - Function returning earliest active offer departure timestamp (ms) for a trail ID.
 * @param onLikeBusinessReview - Callback to toggle like on a business review.
 * @param isBusinessReviewLiked - Helper returning whether the current user liked a business review.
 */
export interface BusinessScreenProps {
    business?: Business | null;
    admins?: Admin[];
    allTrails?: ITrail[];
    packageCount?: number;
    reviews?: BusinessReview[];
    rating?: number;
    reviewsCount?: number;
    isOffersLoading?: boolean;
    isReviewsLoading?: boolean;
    isLoading?: boolean;
    isRefreshing?: boolean;
    onRefresh?: (activeTab?: BusinessTabType) => Promise<void> | void;
    onBackPress: () => void;
    onMountainPress: (trailId: string) => void;
    onDownloadPress: (trailId: string) => void;
    getItemRating: (trailId: string) => number;
    getTrailOffersCount: (trailId: string) => number;
    getTrailEarliestOfferTime?: (trailId: string) => number;
    onLikeBusinessReview?: (review: BusinessReview) => void;
    isBusinessReviewLiked?: (review: BusinessReview) => boolean;
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
    allTrails = [],
    packageCount = 0,
    reviews = [],
    rating = 0,
    reviewsCount = 0,
    isOffersLoading = false,
    isReviewsLoading = false,
    isLoading = false,
    isRefreshing = false,
    onRefresh,
    onBackPress,
    onMountainPress,
    onDownloadPress,
    getItemRating,
    getTrailOffersCount,
    getTrailEarliestOfferTime,
    onLikeBusinessReview,
    isBusinessReviewLiked,
}: BusinessScreenProps): React.JSX.Element => {
    const [activeTab, setActiveTab] = useState<BusinessTabType>('Offers');

    const scrollViewRef = useRef<ScrollView>(null);
    const lastOffsetY = useRef<number>(0);

    const { width, isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth: number | `${number}%` = isDesktop ? 892 : (isTablet ? 712 : '100%');
    const responsiveAlignStyle = {
        maxWidth: contentMaxWidth,
        alignSelf: 'center' as const,
        width: '100%' as const,
    };

    const effectiveContentWidth = typeof contentMaxWidth === 'number'
        ? Math.min(width, contentMaxWidth)
        : width;

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        lastOffsetY.current = event.nativeEvent.contentOffset.y;
    }, []);

    const handleTabChange = useCallback(
        (tab: BusinessTabType) => {
            const isSwitching = tab !== activeTab;
            if (isSwitching) {
                setActiveTab(tab);
            }
            const shouldAnimate = !isSwitching && lastOffsetY.current < 2500;
            scrollViewRef.current?.scrollTo({ y: 0, animated: shouldAnimate });
        },
        [activeTab]
    );

    // Count verified local permits wired in LOCAL_BUSINESS_PERMIT_ASSETS (DENR, DTI, BIR)
    const permitsCount = Object.keys(LOCAL_BUSINESS_PERMIT_ASSETS).length;

    // Calculate unique active team members count (owner + deduplicated active admins)
    const uniqueTeamCount = useMemo(
        () => resolveBusinessPersonnel(business?.owner, admins).uniqueTeamCount,
        [business?.owner, admins]
    );

    if (isLoading && !business) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title="Business Profile"
                    centerTitle={true}
                    onBackPress={onBackPress}
                />
                <BusinessProfileSkeleton
                    contentMaxWidth={contentMaxWidth}
                    effectiveContentWidth={effectiveContentWidth}
                />
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
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={Boolean(isRefreshing)}
                            onRefresh={() => onRefresh(activeTab)}
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
                    <View style={[styles.stickyTabsInner, responsiveAlignStyle]}>
                        <View style={styles.floatingTabsContainer}>
                        {(
                            [
                                { key: 'Offers', icon: 'compass', label: 'Offers' },
                                { key: 'About', icon: 'info', label: 'About' },
                                {
                                    key: 'Reviews',
                                    icon: 'star',
                                    label: reviewsCount > 0 ? `Reviews (${reviewsCount})` : 'Reviews',
                                },
                            ] as const
                        ).map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <Pressable
                                    key={tab.key}
                                    style={styles.tabPressable}
                                    onPress={() => handleTabChange(tab.key)}
                                >
                                    <View
                                        key={isActive ? `${tab.key}-active` : tab.key}
                                        style={[
                                            styles.tabButton,
                                            isActive && styles.tabButtonActive,
                                        ]}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name={tab.icon}
                                            size={isActive ? 18 : 16}
                                            color={isActive ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText
                                            style={[
                                                styles.tabText,
                                                isActive && styles.tabTextActive,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {tab.label}
                                        </CustomText>
                                    </View>
                                </Pressable>
                            );
                        })}
                        </View>
                    </View>
                </View>

                {/* 3. TAB CONTENT CONTAINER */}
                <View style={[styles.tabContentContainer, responsiveAlignStyle]}>
                    {activeTab === 'Offers' && (
                        <BusinessOffersTab
                            allTrails={allTrails}
                            onMountainPress={onMountainPress}
                            onDownloadPress={onDownloadPress}
                            getItemRating={getItemRating}
                            getTrailOffersCount={getTrailOffersCount}
                            getTrailEarliestOfferTime={getTrailEarliestOfferTime}
                            contentWidth={effectiveContentWidth}
                            isLoading={isOffersLoading}
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
                            totalReviewsCount={reviewsCount}
                            isLoading={isReviewsLoading}
                            onLikeReview={onLikeBusinessReview}
                            isLiked={isBusinessReviewLiked}
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
        paddingTop: 14,
        paddingBottom: 12,
        zIndex: 10,
    },
    stickyTabsInner: {
        paddingHorizontal: 16,
    },
    floatingTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 3,
        borderRadius: 20,
    },
    tabPressable: {
        flex: 1,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    tabButton: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
        elevation: 0,
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: Colors.WHITE,
        zIndex: 2,
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
