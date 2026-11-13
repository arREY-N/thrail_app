import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";

import { CreateReviewFlow } from "@/src/core/flows/CreateReviewFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import WriteReviewScreen from "@/src/features/Navigation/screens/WriteReviewScreen";

export default function WriteReview() {
    const {
        reviewId: rawId,
        trailId: rawTrail,
        hikeId: rawHike, distance, duration, elevation,
        bookingId: rawBookingId,
    } = useLocalSearchParams();
    const { onProfilePress } = useAppNavigation();

    const reviewId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);
    const hikeId = getSearchParam(rawHike);
    const bookingId = getSearchParam(rawBookingId);

    const parsedDistance = parseFloat(distance as string) || 0;
    const parsedDuration = parseInt(duration as string, 10) || 0;
    const parsedElevation = parseFloat(elevation as string) || 0;

    const {
        review,
        existingBusinessReview,
        isLoading,
        error,
        onUpdatePress,
        onSaveReview,
        createBusinessReview
    } = CreateReviewFlow({
        reviewId,
        trailId,
        hikeId,
        bookingId,
        distance: parsedDistance,
        duration: parsedDuration,
        elevation: parsedElevation
    });

    return (
        <WriteReviewScreen
            review={review}
            existingBusinessReview={existingBusinessReview}
            error={error}
            isLoading={isLoading}
            onUpdatePress={onUpdatePress}
            onSaveReview={onSaveReview}
            onBackPress={onProfilePress}
            createBusinessReview={createBusinessReview}
        />
    )
}