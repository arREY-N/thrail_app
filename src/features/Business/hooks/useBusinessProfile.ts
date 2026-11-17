/**
 * @file useBusinessProfile.ts
 * @description Feature orchestration hook for the Tour Business profile screen.
 * Composes domain stores/hooks and pure businessHelpers to supply BusinessScreen
 * with sorted featured/all trails, active offer counts, personnel, and latest-first reviews.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { RecalculateTrailRating } from '@/src/core/flows/RecalculateTrailRating';
import { useBusinessItem, useBusinessesStore } from '@/src/core/models/Business/Business';
import {
    useBusinessReview,
    useBusinessReviewList,
    useBusinessReviewsStore,
} from '@/src/core/models/BusinessReview/BusinessReview';
import { useOfferList } from '@/src/core/models/Offer/Offer';
import { useTrailList } from '@/src/core/models/Trail/Trail';
import {
    buildTrailEarliestOfferMap,
    BusinessTabType,
    getAliveBusinessOffers,
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
    const { likeBusinessReview, isLiked } = useBusinessReview();

    const aliveBusinessOffers = useMemo(
        () => getAliveBusinessOffers(business, offers),
        [business, offers]
    );

    const earliestOfferMap = useMemo(
        () => buildTrailEarliestOfferMap(aliveBusinessOffers),
        [aliveBusinessOffers]
    );

    const allTrails = useMemo(
        () => getSortedBusinessTrails(trails, aliveBusinessOffers),
        [trails, aliveBusinessOffers]
    );

    const getTrailEarliestOfferTime = useCallback(
        (trailId: string): number =>
            earliestOfferMap.get(trailId) ?? Number.MAX_SAFE_INTEGER,
        [earliestOfferMap]
    );

    const reviews = useMemo(() => {
        const sorted = sortBusinessReviewsByLatest(rawBusinessReviews);
        if (trails.length === 0) return sorted;

        return sorted.map((item) => {
            const matchedTrail = trails.find((t) => t.id === item.trail?.id);
            const storeProvinces = matchedTrail?.general?.province?.filter(Boolean).join(', ') || '';
            const resolvedLocation =
                storeProvinces ||
                item.trail?.location?.trim() ||
                matchedTrail?.general?.address?.trim() ||
                '';

            if (!resolvedLocation || resolvedLocation === item.trail?.location) {
                return item;
            }

            return {
                ...item,
                trail: {
                    ...item.trail,
                    location: resolvedLocation,
                },
            };
        });
    }, [rawBusinessReviews, trails]);

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

    const { rating, reviewsCount } = useMemo(() => {
        const bizRating = business?.rating ?? 0;
        const bizReviewCount = business?.reviewCount ?? 0;

        if (reviews.length > 0 && (reviews.length < 30 || bizReviewCount <= reviews.length)) {
            const validRatings = reviews
                .map((r) => Number(r.rating))
                .filter((val) => !isNaN(val) && val > 0);
            const avg = validRatings.length > 0
                ? validRatings.reduce((sum, val) => sum + val, 0) / validRatings.length
                : 0;
            return {
                rating: avg,
                reviewsCount: reviews.length,
            };
        }

        if (bizReviewCount > 0) {
            return {
                rating: bizRating,
                reviewsCount: bizReviewCount,
            };
        }

        return {
            rating: 0,
            reviewsCount: 0,
        };
    }, [business?.rating, business?.reviewCount, reviews]);

    return {
        business,
        admins: businessAdmins,
        allTrails,
        packageCount: aliveBusinessOffers.length,
        reviews,
        rating,
        reviewsCount,
        isOffersLoading: isOffersLoading || trailLoading,
        isReviewsLoading: isBusinessReviewsLoading,
        isLoading: isFetching || isOffersLoading || trailLoading,
        isInitialLoading: isFetching && !business,
        isRefreshing,
        onRefresh: handleRefresh,
        getItemRating,
        getTrailOffersCount: getBusinessTrailOffersCount,
        getTrailEarliestOfferTime,
        likeBusinessReview,
        isBusinessReviewLiked: isLiked,
    };
}
