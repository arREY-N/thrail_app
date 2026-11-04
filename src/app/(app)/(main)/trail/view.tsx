import LoadingScreen from "@/src/app/loading";
import { RecalculateTrailRating } from "@/src/core/flows/RecalculateTrailRating";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailViewNavigation } from "@/src/core/hook/navigation/useTrailViewNavigation";
import { useHike } from "@/src/core/models/Hike/Hike";
import { useOfferList, useOfferNavigation, useOfferTrails } from "@/src/core/models/Offer/Offer";
import { useReview, useReviewList } from "@/src/core/models/Review/Review";
import { useTrailItem, useTrailList, useTrailNavigation } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";
import TrailScreen from "@/src/features/Trail/screens/TrailScreen";
import { getSimilarTrails } from "@/src/features/Trail/utils/TrailDetailsHelpers";
import { getTrailOffersCount } from "@/src/utils/offerHelpers";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import { View } from "react-native";

export default function ViewTrail() {
    const { trailId, tab } = useLocalSearchParams<{ trailId?: string | string[]; tab?: string | string[] }>();
    const tId = (Array.isArray(trailId) ? trailId[0] : trailId) as string;
    const initialTab = (Array.isArray(tab) ? tab[0] : tab) as string | undefined;

    const { onDownloadPress } = useAppNavigation();
    const { onTrailBackPress, toTrailView } = useTrailViewNavigation();

    const { isSuperadmin, isAdmin } = useAuthHook();
    const canEdit = isSuperadmin || isAdmin;

    const {
        trail
    } = useTrailItem(tId);

    const {
        trails
    } = useTrailList();

    const {
        getItemRating
    } = RecalculateTrailRating();

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
        reviewIsLoading,
        refresh: refreshReviews,
    } = useReviewList();

    const {
        onSeeTrailOffers
    } = useOfferNavigation();

    const {
        offers,
        onRefreshOffers,
    } = useOfferList();
    const { trailOffers } = useOfferTrails(tId);

    const activeOffersList = useMemo(
        () => (offers.length > 0 ? offers : trailOffers),
        [offers, trailOffers]
    );

    const offersCount = useMemo(() => {
        return getTrailOffersCount(tId, activeOffersList);
    }, [activeOffersList, tId]);

    const similarTrails = useMemo(
        () => getSimilarTrails(trail, trails, 4),
        [trail, trails]
    );

    const handleSelectSimilarTrail = useCallback((selectedTrailId: string) => {
        toTrailView(selectedTrailId, 'explore');
    }, [toTrailView]);

    const handleRefreshTrailView = useCallback(async () => {
        await Promise.all([
            onRefreshOffers(),
            refreshReviews(),
        ]);
    }, [onRefreshOffers, refreshReviews]);

    const hasOffers = offersCount > 0;

    if (!trail) return <LoadingScreen />;

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="light" />
            <TrailScreen
                trail={trail}
                onBackPress={onTrailBackPress}
                onDownloadPress={() => onDownloadPress(tId)}
                onHikePress={(id?: string) => onHikePress(id || tId)}
                onBookPress={(id?: string) => {
                    if (hasOffers) {
                        onSeeTrailOffers(id || tId);
                    }
                }}
                onEditPress={() => onWriteTrail(tId)}
                isSuperadmin={isSuperadmin}
                isAdmin={isAdmin}
                canEdit={canEdit}

                reviews={reviews.filter(r => r.trail.id === trail.id)}
                isLoading={reviewIsLoading}
                likeReview={likeReview}
                onWriteReviewPress={(review) => onWriteReviewPress(review.id)}
                isOwned={isOwned}
                isLiked={isLiked}
                offersCount={offersCount}
                initialTab={initialTab}
                bookButtonTitle={hasOffers ? "Book" : "Offers Coming Soon"}
                isBookDisabled={!hasOffers}
                onRefresh={handleRefreshTrailView}
                similarTrails={similarTrails}
                offers={activeOffersList}
                getItemRating={getItemRating}
                onSelectSimilarTrail={handleSelectSimilarTrail}
            />
        </View>
    );
}
