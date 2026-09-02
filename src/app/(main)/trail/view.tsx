import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useHike } from "@/src/core/models/Hike/Hike";
import { useOfferNavigation } from "@/src/core/models/Offer/Offer";
import { useReview, useReviewList } from "@/src/core/models/Review/Review";
import { useTrailItem, useTrailNavigation } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";
import TrailScreen from "@/src/features/Trail/screens/TrailScreen";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function ViewTrail() {
    const { trailId } = useLocalSearchParams();
    const tId = (Array.isArray(trailId) ? trailId[0] : trailId) as string;

    const { onBackPress, onDownloadPress } = useAppNavigation();

    const { isSuperadmin } = useAuthHook();

    const {
        trail
    } = useTrailItem(tId);

    const {
        onHikePress
    } = useHike(tId);

    const {
        onWriteTrail,
    } = useTrailNavigation();

    const {
        onWriteReviewPress,
        isOwned,
        likeReview,
        isLiked,
    } = useReview();

    const {
        reviews,
        reviewIsLoading
    } = useReviewList();

    const {
        onSeeTrailOffers
    } = useOfferNavigation();

    if (!trail) return <LoadingScreen />;

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="light" />

            <TrailScreen
                trail={trail}
                onBackPress={onBackPress}
                onDownloadPress={onDownloadPress as any}
                onHikePress={onHikePress as any}
                onBookPress={onSeeTrailOffers as any}
                onEditPress={() => onWriteTrail(tId)}
                isSuperadmin={isSuperadmin}

                reviews={reviews.filter(r => r.trail.id === trail.id)}
                isLoading={reviewIsLoading}
                likeReview={likeReview}
                onWriteReviewPress={(review) => onWriteReviewPress(review.id)}
                isOwned={isOwned}
                isLiked={isLiked}
            />
        </View>
    )
}