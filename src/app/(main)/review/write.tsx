import useReview from "@/src/core/hook/review/useReview";
import { Review } from "@/src/core/models/Review/Review";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function WriteReview() {
    const { reviewId: rawId } = useLocalSearchParams();

    const reviewId = getSearchParam(rawId);

    const {
        review,
        isLoading,
        error
    } = useReview({ reviewId });

    return (
        <TestWriteReview 
            review={review}
            error={error}
            isLoading={isLoading}
        />
    )
}

export type TestWriteParams = {
    review: Review;
    error: string | null;
    isLoading: boolean;
}

export const TestWriteReview = (params: TestWriteParams) => {
    const { review, error, isLoading } = params;

    console.log('Review in Write Screen:', review);
    return(
        <View>
            <Text>Write Review</Text>
            <Text>{review.hike.review}</Text>
        </View>
    )
}