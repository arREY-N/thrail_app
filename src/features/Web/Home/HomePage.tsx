import { HomeFlow } from "@/src/core/flows/HomeFlow";
import { useTrailViewNavigation } from "@/src/core/hook/navigation/useTrailViewNavigation";
import { useCallback } from "react";

import HomeScreen from "@/src/features/Home/screens/HomeScreen";

const HomePage = () => {
  const {
    trailError,
    getItemRating,
    onDownloadPress,
    onWeatherPress,
    onSeeMoreRecommendationsPress,
    onTrailOfTheMonthPress,
    onSeeMoreDiscoverPress,
    onSeeMoreOffersPress,
    onGroupPress,
    trails,
    recommendation,
    isNewAccount,
    recommendationError,
    recommendationIsLoading,
    offers,
    trailsWithOffers,
    trailOfferIsLoading,
    isRefreshing,
    onRefreshPress,
    trailLoading
  } = HomeFlow();

  const { toTrailView } = useTrailViewNavigation();

  const handleViewTrail = useCallback((trailId: string) => {
    toTrailView(trailId, 'home');
  }, [toTrailView]);

  return (
    <HomeScreen
      onWeatherPress={onWeatherPress}
      onSeeMoreRecommendationsPress={onSeeMoreRecommendationsPress}
      onTrailOfTheMonthPress={onTrailOfTheMonthPress}
      onSeeMoreDiscoverPress={onSeeMoreDiscoverPress}
      onSeeMoreOffersPress={onSeeMoreOffersPress}
      recommendedTrails={[]}
      recommendation={recommendation}
      isRecommendationsLoading={recommendationIsLoading}
      recommendationsError={recommendationError}
      isNewAccount={isNewAccount}
      discoverTrails={trails}
      discoverError={trailError}
      trailsWithOffers={trailsWithOffers}
      isOffersLoading={trailOfferIsLoading}
      onMountainPress={handleViewTrail}
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

export default HomePage;
