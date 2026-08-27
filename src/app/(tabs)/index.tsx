/**
 * @file index.tsx
 * @description Controller for the Home Tab. Connects domain hooks and navigation to the pure HomeScreen UI.
 */

import { View } from 'react-native';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useHomeRefresh } from '@/src/core/hook/useHomeRefresh';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useTrailOffers } from '@/src/core/hook/useTrailOffers';
import { useRecommendationItem } from '@/src/core/models/Recommendation/Recommendation';
import { useTrailList } from '@/src/core/models/Trail/Trail';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 * 
 * @returns React.JSX.Element rendering the Home tab controller.
 */
export default function Home() {
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

    const {
        error: discoverError,
        discoverTrails,
        onViewTrail
    } = useTrailList();

    const { isNewAccount } = useAuthHook();

    const {
        isLoading: recommendationLoading,
        error: recommendationError,
    } = useRecommendationItem();

    const {
        isRefreshing,
        onRefreshPress,
    } = useHomeRefresh();

    const {
        offers,
        trailsWithOffers,
        isLoading,
    } = useTrailOffers();

    return (
        <View style={{ flex: 1 }}>
            <HomeScreen
                onWeatherPress={onWeatherPress}
                onSeeMoreRecommendationsPress={onSeeMoreRecommendationsPress}
                onSeeMoreDiscoverPress={onSeeMoreDiscoverPress}
                onSeeMoreOffersPress={onSeeMoreOffersPress}
                recommendedTrails={[]}
                isRecommendationsLoading={recommendationLoading}
                recommendationsError={recommendationError}
                isNewAccount={isNewAccount}
                discoverTrails={discoverTrails}
                discoverError={discoverError}
                trailsWithOffers={trailsWithOffers}
                isOffersLoading={isLoading}
                onMountainPress={onViewTrail}
                onDownloadPress={onDownloadPress}
                onGroupPress={onGroupPress}
                getItemRating={getItemRating}
                isLoading={isLoading}
                offers={offers}
                isRefreshing={isRefreshing}
                onRefreshPress={onRefreshPress}
            />
        </View>
    );
};

