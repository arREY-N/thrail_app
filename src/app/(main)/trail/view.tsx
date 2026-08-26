import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useOfferDomain } from "@/src/core/hook/offer/useOfferDomain";
import useReview from '@/src/core/hook/review/useReview';
import useTrailDomain from "@/src/core/hook/trail/useTrailDomain";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { newReview } from "@/src/core/models/Review/Review";
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
        trail,
        onHikePress,
        onWriteTrail,
    } = useTrailDomain({ trailId: tId } as any);

    const {
        reviews,
        isLoading,
        onWriteReviewPress,
        isOwned,
        likeReview,
        isLiked,
    } = useReview();

    const {
        onSeeTrailOffers
    } = useOfferDomain({} as any);

    if (!trail) return <LoadingScreen />;

    console.log('Trail Reviews:', reviews.filter(r => r.trail.id === trail.id));

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
                isLoading={isLoading}
                likeReview={(review) => likeReview(newReview(review))}
                onWriteReviewPress={(review) => onWriteReviewPress(review.id)}
                isOwned={(review) => isOwned(newReview(review))}
                isLiked={(review) => isLiked(newReview(review))}
            />
        </View>
    )
}