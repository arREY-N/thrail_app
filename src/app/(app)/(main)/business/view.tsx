/**
 * @file view.tsx
 * @description Controller route for viewing a tour business organizer's profile.
 * Composes domain hooks for business details, staff personnel, active trail catalog, ratings,
 * and passes clean state to BusinessScreen.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import LoadingScreen from '@/src/app/loading';
import { RecalculateTrailRating } from '@/src/core/flows/RecalculateTrailRating';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useTrailViewNavigation } from '@/src/core/hook/navigation/useTrailViewNavigation';
import { useBusinessItem, useBusinessesStore } from '@/src/core/models/Business/Business';
import { useOfferList } from '@/src/core/models/Offer/Offer';
import { ITrail, useTrailList } from '@/src/core/models/Trail/Trail';
import getSearchParam from '@/src/core/utility/getSearchParam';
import BusinessScreen from '@/src/features/Business/screens/BusinessScreen';
import {
    getTrailOffersCount,
    getTrailsWithAliveOffers,
    isAliveOffer,
} from '@/src/utils/offerHelpers';

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

    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // 1. Business entity data
    const { business, isFetching } = useBusinessItem(businessId);

    // 2. Load business admin personnel (guides / staff)
    const businessAdmins = useBusinessesStore((s) => s.businessAdmins);

    useEffect(() => {
        if (businessId) {
            useBusinessesStore.getState().loadBusinessAdmins(businessId);
        }
    }, [businessId]);

    // 3. Offers and trails data
    const { offers, isFetching: isOffersLoading, onRefreshOffers } = useOfferList();
    const { trails, trailLoading } = useTrailList();
    const { getItemRating } = RecalculateTrailRating();

    // Filter active/alive upcoming offers matching this business by id or name
    const aliveBusinessOffers = useMemo(() => {
        if (!business) return [];
        const bId = business.id?.trim();
        const bName = business.name?.trim().toLowerCase();

        return offers.filter((o) => {
            if (!isAliveOffer(o)) return false;
            if (bId && o.business?.id) {
                return o.business.id.trim() === bId;
            }
            if (bName && o.business?.name) {
                return o.business.name.trim().toLowerCase() === bName;
            }
            return false;
        });
    }, [business, offers]);

    // Top 3 soonest bookable upcoming packages
    const featuredTrails = useMemo(() => {
        if (aliveBusinessOffers.length === 0 || trails.length === 0) return [];

        const bookableOffers = aliveBusinessOffers
            .filter((o) => {
                const hasSlots =
                    !o.maxPax ||
                    Number(o.maxPax) <= 0 ||
                    (Number(o.reservedPax) || 0) < Number(o.maxPax);
                return hasSlots;
            })
            .sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
                const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
                return dateA - dateB;
            });

        const trailIdOrder: string[] = [];
        bookableOffers.forEach((o) => {
            if (o.trail?.id && !trailIdOrder.includes(o.trail.id)) {
                trailIdOrder.push(o.trail.id);
            }
        });

        const top3TrailIds = trailIdOrder.slice(0, 3);
        return top3TrailIds
            .map((id) => trails.find((t) => t.id === id))
            .filter((t): t is ITrail => Boolean(t));
    }, [aliveBusinessOffers, trails]);

    // All unique trails with active upcoming offers from this business
    const allBusinessTrails = useMemo(() => {
        return getTrailsWithAliveOffers(trails, aliveBusinessOffers);
    }, [trails, aliveBusinessOffers]);

    const getBusinessTrailOffersCount = useCallback(
        (trailId: string): number => {
            return getTrailOffersCount(trailId, aliveBusinessOffers);
        },
        [aliveBusinessOffers]
    );

    const handleRefresh = useCallback(async () => {
        if (!businessId) return;
        setIsRefreshing(true);
        try {
            await Promise.all([
                useBusinessesStore.getState().load(businessId),
                useBusinessesStore.getState().reloadBusinessAdmins(businessId),
                onRefreshOffers(),
            ]);
        } finally {
            setIsRefreshing(false);
        }
    }, [businessId, onRefreshOffers]);

    const handleMountainPress = useCallback(
        (trailId: string) => {
            toTrailView(trailId, 'business');
        },
        [toTrailView]
    );

    if (isFetching && !business) {
        return <LoadingScreen />;
    }

    // NOTE(backend): Placeholder rating & review metrics for tour operators.
    // Wire to real aggregate ratings from ReviewRepo / business reviews subcollection once implemented.
    const businessRating = 4.9;
    const businessReviewsCount = 60;

    return (
        <BusinessScreen
            business={business}
            admins={businessAdmins}
            featuredTrails={featuredTrails}
            allTrails={allBusinessTrails}
            packageCount={aliveBusinessOffers.length}
            rating={businessRating}
            reviewsCount={businessReviewsCount}
            isLoading={isFetching || isOffersLoading || trailLoading}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onBackPress={onBackPress}
            onMountainPress={handleMountainPress}
            onDownloadPress={onDownloadPress}
            getItemRating={getItemRating}
            getTrailOffersCount={getBusinessTrailOffersCount}
        />
    );
}
