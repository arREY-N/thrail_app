import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';

import { RecalculateTrailRating } from '@/src/core/flows/RecalculateTrailRating';
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailViewNavigation } from "@/src/core/hook/navigation/useTrailViewNavigation";
import { useOfferList } from '@/src/core/models/Offer/Offer';
import { useTrailList } from '@/src/core/models/Trail/Trail';
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';

/**
 * Controller component for the Explore tab.
 * Responsible for fetching trail data and passing navigation callbacks.
 */
export default function Explore() {
    const { filter } = useLocalSearchParams<{ filter?: string }>();

    const {
        trails,
        trailLoading,
        onRefreshTrails,
    } = useTrailList();

    const { toTrailView } = useTrailViewNavigation();

    const handleViewTrail = useCallback((trailId: string) => {
        toTrailView(trailId, 'explore');
    }, [toTrailView]);

    const {
        onGroupPress
    } = useAppNavigation();

    const {
        getItemRating,
    } = RecalculateTrailRating();

    const {
        offers,
        onRefreshOffers,
    } = useOfferList();

    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                onRefreshTrails(),
                onRefreshOffers(),
            ]);
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefreshTrails, onRefreshOffers]);

    // Map query parameter filters to actual Explore tab category labels
    const initialCategory = filter === 'offers' ? "Offers" : "All";

    return (
        <ExploreScreen
            getItemRating={getItemRating}
            trails={trails}
            onViewMountain={handleViewTrail}
            onGroupPress={onGroupPress}
            isLoading={trailLoading}
            initialCategory={initialCategory}
            offers={offers}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
        />
    );
}
