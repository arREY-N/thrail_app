import useReviewWrite from "@/src/core/hook/review/useReviewWrite";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import WriteReviewScreen from "@/src/features/Navigation/screens/WriteReviewScreen";

export default function WriteReview() {
    const { reviewId: rawId, trailId: rawTrail } = useLocalSearchParams();

    const reviewId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);

    const  { onBackPress } = useAppNavigation();

    const {
        review,
        isLoading,
        error,
        onUpdatePress,
        onSaveReview,
    } = useReviewWrite({ reviewId, trailId });

    return (
        <WriteReviewScreen 
            review={review}
            error={error}
            isLoading={isLoading}
            onUpdatePress={onUpdatePress}
            onSaveReview={onSaveReview}
            onBackPress={onBackPress}
        />
    )
}