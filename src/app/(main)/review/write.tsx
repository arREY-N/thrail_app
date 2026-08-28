import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";

import { CreateReviewFlow } from "@/src/core/flows/CreateReviewFlow";
import WriteReviewScreen from "@/src/features/Navigation/screens/WriteReviewScreen";

export default function WriteReview() {
    const { reviewId: rawId, trailId: rawTrail, hikeId: rawHike, distance, duration, elevation } = useLocalSearchParams();

    const reviewId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);
    const hikeId = getSearchParam(rawHike);

    const parsedDistance = parseFloat(distance as string) || 0;
    const parsedDuration = parseInt(duration as string, 10) || 0;
    const parsedElevation = parseFloat(elevation as string) || 0;

    const {
        review,
        isLoading,
        error,
        onUpdatePress,
        onSaveReview,
    } = CreateReviewFlow({
        reviewId,
        trailId,
        hikeId,

        distance: parsedDistance,
        duration: parsedDuration,
        elevation: parsedElevation
    });

    return (
        <WriteReviewScreen
            review={review}
            error={error}
            isLoading={isLoading}
            onUpdatePress={onUpdatePress}
            onSaveReview={onSaveReview}
        // onBackPress={onBackPress}
        />
    )
}