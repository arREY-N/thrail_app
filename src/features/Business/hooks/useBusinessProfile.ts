/**
 * @file useBusinessProfile.ts
 * @description Feature orchestration hook for the Tour Business profile screen.
 * Composes domain stores/hooks and pure businessHelpers to supply BusinessScreen
 * with sorted featured/all trails, active offer counts, personnel, and latest-first reviews.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { RecalculateTrailRating } from '@/src/core/flows/RecalculateTrailRating';
import { useBusinessItem, useBusinessesStore } from '@/src/core/models/Business/Business';
import { useBusinessReviewList } from '@/src/core/models/BusinessReview/hooks/useBusinessReviewList';
import { useBusinessReviewsStore } from '@/src/core/models/BusinessReview/stores/businessReviewStore';
import { useOfferList } from '@/src/core/models/Offer/Offer';
import { useTrailList } from '@/src/core/models/Trail/Trail';
import {
    BusinessTabType,
    getAliveBusinessOffers,
    getFeaturedUpcomingTrails,
    getSortedBusinessTrails,
    sortBusinessReviewsByLatest,
} from '@/src/features/Business/utils/businessHelpers';
import { getTrailOffersCount } from '@/src/utils/offerHelpers';

/**
 * Composes all data, derived lists, and refresh handlers needed by BusinessView / BusinessScreen.
 *
 * @param businessId - Target tour business document ID.
 * @returns Consolidated business profile state, sorted lists, and action callbacks.
 */
export function useBusinessProfile(businessId?: string) {
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const { business, isFetching } = useBusinessItem(businessId || '');
    const businessAdmins = useBusinessesStore((s) => s.businessAdmins);

    useEffect(() => {
        if (businessId) {
            useBusinessesStore.getState().loadBusinessAdmins(businessId);
        }
    }, [businessId]);

    const { offers, isFetching: isOffersLoading, onRefreshOffers } = useOfferList();
    const { trails, trailLoading } = useTrailList();
    const { getItemRating } = RecalculateTrailRating();

    const {
        data: rawBusinessReviews,
        isFetching: isBusinessReviewsLoading,
    } = useBusinessReviewList(businessId);

    const aliveBusinessOffers = useMemo(
        () => getAliveBusinessOffers(business, offers),
        [business, offers]
    );

    const featuredTrails = useMemo(
        () => getFeaturedUpcomingTrails(aliveBusinessOffers, trails, 3),
        [aliveBusinessOffers, trails]
    );

    const allTrails = useMemo(
        () => getSortedBusinessTrails(trails, aliveBusinessOffers),
        [trails, aliveBusinessOffers]
    );

    const reviews = useMemo(
        () => sortBusinessReviewsByLatest(rawBusinessReviews),
        [rawBusinessReviews]
    );

    const getBusinessTrailOffersCount = useCallback(
        (trailId: string): number => getTrailOffersCount(trailId, aliveBusinessOffers),
        [aliveBusinessOffers]
    );

    const handleRefresh = useCallback(async (activeTab?: BusinessTabType) => {
        if (!businessId) return;
        setIsRefreshing(true);
        try {
            if (activeTab === 'Offers') {
                await Promise.all([
                    useBusinessesStore.getState().load(businessId),
                    onRefreshOffers(),
                ]);
            } else if (activeTab === 'About') {
                await Promise.all([
                    useBusinessesStore.getState().load(businessId),
                    useBusinessesStore.getState().reloadBusinessAdmins(businessId),
                ]);
            } else if (activeTab === 'Reviews') {
                await Promise.all([
                    useBusinessesStore.getState().load(businessId),
                    useBusinessReviewsStore.getState().refreshBusiness(businessId),
                ]);
            } else {
                await Promise.all([
                    useBusinessesStore.getState().load(businessId),
                    useBusinessesStore.getState().reloadBusinessAdmins(businessId),
                    useBusinessReviewsStore.getState().refreshBusiness(businessId),
                    onRefreshOffers(),
                ]);
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [businessId, onRefreshOffers]);

    return {
        business,
        admins: businessAdmins,
        featuredTrails,
        allTrails,
        packageCount: aliveBusinessOffers.length,
        reviews,
        rating: business?.rating ?? 0,
        reviewsCount: business?.reviewCount ?? 0,
        isOffersLoading: isOffersLoading || trailLoading,
        isReviewsLoading: isBusinessReviewsLoading,
        isLoading: isFetching || isOffersLoading || trailLoading,
        isInitialLoading: isFetching && !business,
        isRefreshing,
        onRefresh: handleRefresh,
        getItemRating,
        getTrailOffersCount: getBusinessTrailOffersCount,
    };
}
