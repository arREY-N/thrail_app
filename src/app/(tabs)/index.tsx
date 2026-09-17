/**
 * @file index.tsx
 * @description Controller for the Home Tab. Connects domain hooks and navigation to the pure HomeScreen UI.
 */


import { HomeFlow } from '@/src/core/flows/HomeFlow';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 * 
 * @returns React.JSX.Element rendering the Home tab controller.
 */
export default function Home() {
    const {
        getItemRating,
        onDownloadPress,
        onWeatherPress,
        onSeeMoreRecommendationsPress,
        onSeeMoreDiscoverPress,
        onSeeMoreOffersPress,
        onGroupPress,
        trailError,
        trails,
        onViewTrail,
        isNewAccount,
        recommendationError,
        recommendationIsLoading,
        offers,
        trailsWithOffers,
        trailOfferIsLoading,
        trailLoading,
        isRefreshing,
        onRefreshPress,
    } = HomeFlow();

    return (
        <HomeScreen
            onWeatherPress={onWeatherPress}
            onSeeMoreRecommendationsPress={onSeeMoreRecommendationsPress}
            onSeeMoreDiscoverPress={onSeeMoreDiscoverPress}
            onSeeMoreOffersPress={onSeeMoreOffersPress}
            recommendedTrails={[]}
            isRecommendationsLoading={recommendationIsLoading}
            recommendationsError={recommendationError}
            isNewAccount={isNewAccount}
            discoverTrails={trails}
            discoverError={trailError}
            trailsWithOffers={trailsWithOffers}
            isOffersLoading={trailOfferIsLoading}
            onMountainPress={onViewTrail}
            onDownloadPress={onDownloadPress}
            onGroupPress={onGroupPress}
            getItemRating={getItemRating}
            isLoading={trailLoading}
            offers={offers}
            isRefreshing={isRefreshing}
            onRefreshPress={onRefreshPress}
        />
    );
};

