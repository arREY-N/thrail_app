import { useLocalSearchParams } from 'expo-router';

import { RecalculateTrailRating } from '@/src/core/flows/RecalculateTrailRating';
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailViewNavigation } from "@/src/core/hook/navigation/useTrailViewNavigation";
import { useOfferList } from '@/src/core/models/Offer/Offer';
import { useTrailList } from '@/src/core/models/Trail/Trail';
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import React, { useCallback } from 'react';

/**
 * Controller component for the Explore tab.
 * Responsible for fetching trail data and passing navigation callbacks.
 */
export default function Explore() {
    const { filter } = useLocalSearchParams<{ filter?: string }>();

    const {
        trails,
        trailLoading,
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
        offers
    } = useOfferList();


    // Map query parameter filters to actual Explore tab category labels
    let initialCategory = "All";
    if (filter === 'recommendations') {
        initialCategory = "Recommended";
    } else if (filter === 'trending') {
        initialCategory = "Discover";
    } else if (filter === 'offers') {
        initialCategory = "Offers";
    }

    return (
        <ExploreScreen
            getItemRating={getItemRating}
            trails={trails}
            onViewMountain={handleViewTrail}
            onGroupPress={onGroupPress}
            isLoading={trailLoading}
            initialCategory={initialCategory}
            offers={offers}
        />
    );
}
