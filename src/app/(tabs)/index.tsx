/**
 * @file index.tsx
 * @description Controller for the Home Tab. Connects domain hooks and navigation to the pure HomeScreen UI.
 */

import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailView from '@/src/core/hook/trail/useTrailView';
import { useOfferStore } from '@/src/core/models/Offer/stores/offerStore';
import { useAuthStore } from '@/src/core/stores/authStores/authStore';
import { useRecommendationsStore } from '@/src/core/stores/recommendationsStore';
import { useTrailsStore } from '@/src/core/stores/trailStores/trailsStore';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 * 
 * @returns React.JSX.Element rendering the Home tab controller.
 */
export default function home() {
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
    const offers = useOfferStore(s => s.data);
    const fetchOffers = useOfferStore(s => s.fetchAll);
    const isOffersLoading = useOfferStore(s => s.isLoading);

    // Recommendations and Auth Stores
    const user = useAuthStore(s => s.user);
    const profile = useAuthStore(s => s.profile);
    
    const loadRecommendations = useRecommendationsStore(s => s.load);
    const isRecommendationsLoading = useRecommendationsStore(s => s.isLoading);
    const recommendationsError = useRecommendationsStore(s => s.error);

    const fetchAllTrails = useTrailsStore(s => s.fetchAll);
    const discoverError = useTrailsStore(s => s.error);

    useEffect(() => {
        fetchOffers().catch(() => {});
        fetchAllTrails().catch(() => {});

        if (user?.uid) {
            loadRecommendations(user.uid).catch(() => {});
        }
    }, [fetchOffers, fetchAllTrails, user?.uid, loadRecommendations]);

    // Refreshing state for pull-to-refresh with 5-second Firebase cooldown protection
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const lastRefreshTimeRef = React.useRef<number>(0);

    const onRefreshPress = async () => {
        const now = Date.now();
        // Cooldown protection: If refreshed within last 5,000ms or already in flight, skip new Firebase network reads
        if (isRefreshing || (now - lastRefreshTimeRef.current < 5000)) {
            return;
        }

        lastRefreshTimeRef.current = now;
        setIsRefreshing(true);
        try {
            const promises: Promise<void>[] = [
                fetchOffers().then(() => {}).catch(() => {}),
                fetchAllTrails().then(() => {}).catch(() => {})
            ];
            if (user?.uid) {
                promises.push(loadRecommendations(user.uid).then(() => {}).catch(() => {}));
            }
            await Promise.all(promises);
        } catch (err) {
            console.error("Error pulling to refresh Home screen:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Determine if the user is a new account (cold start for recommendations)
    const isNewAccount = useMemo(() => {
        if (!profile) return false;
        if (!profile.preferences) return true;
        return profile.preferences.hiked === false;
    }, [profile]);

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

    const isDiscoverLoading = isLoading || !profile;

    return (
        <View style={{ flex: 1 }}>
            <HomeScreen 
                onWeatherPress={onWeatherPress}
                onSeeMoreRecommendationsPress={onSeeMoreRecommendationsPress}
                onSeeMoreDiscoverPress={onSeeMoreDiscoverPress}
                onSeeMoreOffersPress={onSeeMoreOffersPress}
                recommendedTrails={[]}
                isRecommendationsLoading={isRecommendationsLoading}
                recommendationsError={recommendationsError}
                isNewAccount={isNewAccount}
                discoverTrails={discoverTrails}
                discoverError={discoverError}
                trailsWithOffers={trailsWithOffers}
                isOffersLoading={isOffersLoading}
                onMountainPress={onViewTrail}
                onDownloadPress={onDownloadPress}
                onGroupPress={onGroupPress}
                getItemRating={getItemRating}
                isLoading={isDiscoverLoading}
                offers={offers}
                isRefreshing={isRefreshing}
                onRefreshPress={onRefreshPress}
            />
        </View>
    );
};

