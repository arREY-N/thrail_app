/**
 * @file view.tsx
 * @description Controller route for viewing a tour business organizer's profile.
 * Delegates domain data orchestration to useBusinessProfile and passes clean state to BusinessScreen.
 */

import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useTrailViewNavigation } from '@/src/core/hook/navigation/useTrailViewNavigation';
import getSearchParam from '@/src/core/utility/getSearchParam';
import { useBusinessProfile } from '@/src/features/Business/hooks/useBusinessProfile';
import BusinessScreen from '@/src/features/Business/screens/BusinessScreen';

/**
 * BusinessView — Route controller for tour business organizer profile.
 *
 * @returns React.JSX.Element rendering the business screen
 */
export default function BusinessView(): React.JSX.Element {
    const { businessId: rawId } = useLocalSearchParams();
    const businessId = getSearchParam(rawId);

    const { onBackPress, onDownloadPress } = useAppNavigation();
    const { toTrailView } = useTrailViewNavigation();

    const {
        business,
        admins,
        featuredTrails,
        allTrails,
        packageCount,
        reviews,
        rating,
        reviewsCount,
        isOffersLoading,
        isReviewsLoading,
        isLoading,
        isRefreshing,
        onRefresh,
        getItemRating,
        getTrailOffersCount,
    } = useBusinessProfile(businessId);

    const handleMountainPress = useCallback(
        (trailId: string) => {
            toTrailView(trailId, 'business');
        },
        [toTrailView]
    );

    return (
        <BusinessScreen
            business={business}
            admins={admins}
            featuredTrails={featuredTrails}
            allTrails={allTrails}
            packageCount={packageCount}
            reviews={reviews}
            rating={rating}
            reviewsCount={reviewsCount}
            isOffersLoading={isOffersLoading}
            isReviewsLoading={isReviewsLoading}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onBackPress={onBackPress}
            onMountainPress={handleMountainPress}
            onDownloadPress={onDownloadPress}
            getItemRating={getItemRating}
            getTrailOffersCount={getTrailOffersCount}
        />
    );
}
