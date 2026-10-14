import { HomeFlow } from "@/src/core/flows/HomeFlow";
import { useLocalSearchParams } from "expo-router";

import HomeScreen from "@/src/features/Home/screens/HomeScreen";
import React from "react";

const HomePage = () => {
  const { filter } = useLocalSearchParams<{ filter?: string }>();

  // Map query parameter filters to actual Explore tab category labels
  let initialCategory = "All";
  if (filter === "recommendations") {
    initialCategory = "Recommended";
  } else if (filter === "trending") {
    initialCategory = "Discover";
  } else if (filter === "offers") {
    initialCategory = "Offers";
  }

  const {
    trailError,
    getItemRating,
    onDownloadPress,
    onWeatherPress,
    onSeeMoreRecommendationsPress,
    onSeeMoreDiscoverPress,
    onSeeMoreOffersPress,
    onGroupPress,
    trails,
    onViewTrail,
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

export default HomePage;
