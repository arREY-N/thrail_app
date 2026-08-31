import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useHomeRefresh } from "@/src/core/hook/useHomeRefresh";
import { useTrailOffers } from "@/src/core/hook/useTrailOffers";
import { useOfferList } from "@/src/core/models/Offer/Offer";
import { useRecommendationItem } from "@/src/core/models/Recommendation/Recommendation";
import { useReview, useReviewList } from "@/src/core/models/Review/Review";
import { useTrailList, useTrailNavigation } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";

export function HomeFlow() {
    const { isNewAccount } = useAuthHook();

    const {
        onDownloadPress,
        onWeatherPress,
        onSeeMoreRecommendationsPress,
        onSeeMoreDiscoverPress,
        onSeeMoreOffersPress,
        onGroupPress
    } = useAppNavigation();

    /* Trail Data */
    const {
        trailError,
        trails,
        trailLoading
    } = useTrailList();

    const {
        onViewTrail,
    } = useTrailNavigation();

    /* Trail Offers Data */
    const {
        trailsWithOffers,
        trailOfferIsLoading,
    } = useTrailOffers();

    const {
        offers
    } = useOfferList();

    /* Review Data */
    const {
        reviewError,
        reviewIsLoading,
    } = useReviewList()

    const {
        getItemRating
    } = useReview();

    // recommendation
    const {
        isLoading: recommendationIsLoading,
        error: recommendationError,
    } = useRecommendationItem();

    // Refresh
    const {
        isRefreshing,
        onRefreshPress,
    } = useHomeRefresh();

    return {
        isRefreshing,
        onRefreshPress,
        reviewError,
        reviewIsLoading,
        offers,
        trailsWithOffers,
        trailLoading,
        trailOfferIsLoading,
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
        getItemRating,
        recommendationIsLoading,
        recommendationError,
    }
}