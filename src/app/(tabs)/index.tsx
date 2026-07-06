/**
 * @file index.tsx
 * @description Controller for the Home Tab. Connects domain hooks and navigation to the pure HomeScreen UI.
 */

import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailView from '@/src/core/hook/trail/useTrailView';
import { useOffersStore } from '@/src/core/stores/offersStore';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 */
const home = () => {
    const { 
        trails, 
        onViewTrail,
        isLoading,
    } = useTrailView();

    const {
        onDownloadPress, 
        onWeatherPress, 
        onSeeMoreRecommendationsPress, 
        onSeeMoreDiscoverPress,
        onSeeMoreOffersPress,
        onGroupPress
    } = useAppNavigation();

    const {
        getItemRating,
    } = useReview();

    // Fetch Offers
    const offers = useOffersStore(s => s.data);
    const fetchOffers = useOffersStore(s => s.fetchAll);
    const isOffersLoading = useOffersStore(s => s.isLoading);

    useEffect(() => {
        fetchOffers().catch(() => {});
    }, [fetchOffers]);

    // For discover, show first 3 trails
    const discoverTrails = useMemo(() => {
        return trails.slice(0, 3);
    }, [trails]);

    // Trails with upcoming offers
    const trailsWithOffers = useMemo(() => {
        const now = new Date();
        const upcomingOffers = offers.filter(o => o.date && new Date(o.date).getTime() > now.getTime());
        const trailIds = upcomingOffers.map(o => o.trail?.id).filter(Boolean);
        const uniqueIds = Array.from(new Set(trailIds));
        return trails.filter(t => uniqueIds.includes(t.id));
    }, [trails, offers]);

    return (
        <View style={{ flex: 1 }}>
            <HomeScreen 
                onWeatherPress={onWeatherPress}
                onSeeMoreRecommendationsPress={onSeeMoreRecommendationsPress}
                onSeeMoreDiscoverPress={onSeeMoreDiscoverPress}
                onSeeMoreOffersPress={onSeeMoreOffersPress}
                recommendedTrails={[]}
                discoverTrails={discoverTrails}
                trailsWithOffers={trailsWithOffers}
                isOffersLoading={isOffersLoading}
                onMountainPress={onViewTrail}
                onDownloadPress={onDownloadPress}
                onGroupPress={onGroupPress}
                getItemRating={getItemRating}
                isLoading={isLoading}
                offers={offers}
            />
        </View>
    );
};

export default home;
