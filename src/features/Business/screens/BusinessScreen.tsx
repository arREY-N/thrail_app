/**
 * @file BusinessScreen.tsx
 * @description Pure presentation screen for the Tour Business profile.
 * Matches ProfileScreen's sticky open identity banner and segmented pill 3-tab switcher
 * (Offers | Permits & About | Team & Guides).
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
import { ITrail } from '@/src/core/models/Trail/Trail';
import BusinessHeroCard from '@/src/features/Business/components/BusinessHeroCard';
import BusinessOffersTab from '@/src/features/Business/tabs/BusinessOffersTab';
import BusinessPermitsAboutTab from '@/src/features/Business/tabs/BusinessPermitsAboutTab';
import BusinessTeamTab from '@/src/features/Business/tabs/BusinessTeamTab';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export type BusinessTabType = 'Offers' | 'About' | 'Team';

/**
 * Props for the BusinessScreen component.
 *
 * @param business - The tour business model data.
 * @param admins - Guide / coordinator personnel under this business.
 * @param featuredTrails - Top 3 soonest upcoming bookable trail packages.
 * @param allTrails - All unique trails with active offers from this business.
 * @param packageCount - Count of active upcoming packages/offers for this business.
 * @param rating - Optional public review rating score.
 * @param reviewsCount - Optional total count of public reviews.
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
    rating?: number;
    reviewsCount?: number;
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
 * BusinessScreen — Presentation view displaying a tour organizer's profile, credentials, and package offerings.
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
    rating,
    reviewsCount,
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
    const contentMaxWidth: number | `${number}%` = isDesktop ? 800 : (isTablet ? 650 : '100%');
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
            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            requestAnimationFrame(() => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            });
        },
        [activeTab]
    );

    // Calculate verified permits count
    const permitsCount = [
        business?.permits?.denr,
        business?.permits?.dti,
        business?.permits?.bir,
    ].filter(Boolean).length;

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
                stickyHeaderIndices={[0]}
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
                {/* 1. STICKY HEADER SECTION (Open Banner + Segmented Pill Tabs matching ProfileScreen) */}
                <View style={styles.stickyHeaderSection}>
                    <View style={responsiveAlignStyle}>
                        <BusinessHeroCard
                            business={business}
                            packageCount={packageCount}
                            guidesCount={uniqueTeamCount}
                            permitsCount={permitsCount}
                            rating={rating}
                            reviewsCount={reviewsCount}
                        />
                    </View>

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
                                name="shield"
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
                                activeTab === 'Team' && styles.tabButtonActive,
                            ]}
                            onPress={() => handleTabChange('Team')}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Feather"
                                name="users"
                                size={activeTab === 'Team' ? 18 : 16}
                                color={activeTab === 'Team' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'Team' && styles.tabTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                Team
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. TAB CONTENT CONTAINER */}
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
                        <BusinessPermitsAboutTab business={business} />
                    )}

                    {activeTab === 'Team' && (
                        <BusinessTeamTab
                            owner={business.owner}
                            admins={admins}
                            businessName={business.name}
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
    stickyHeaderSection: {
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 12,
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
        paddingTop: 16,
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
