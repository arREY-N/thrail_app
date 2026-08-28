import LoadingScreen from "@/src/app/loading";
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useOfferTrails } from "@/src/core/models/Offer/Offer";
import getSearchParam from "@/src/core/utility/getSearchParam";
import BookingScreen from "@/src/features/Book/screens/Booking/BookingScreen";
import { useLocalSearchParams } from "expo-router";

export default function ListOffer() {
    const { trailId: rawId } = useLocalSearchParams();
    const trailId = getSearchParam(rawId);

    const { onBackPress } = useAppNavigation();

    const {
        onTerms,
        onPrivacy
    } = useLandingNavigation();

    const {
        trailOffers,
        error: offerError,
        isLoading
    } = useOfferTrails(trailId);

    const {
        error: bookError,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
    } = CreateBookingFlow();


    if (isLoading) return <LoadingScreen />;

    return (
        <>
            <BookingScreen
                {...{
                    offers: trailOffers,
                    error: (offerError || bookError),
                    onSetOffer: onSetOffer,
                    onBookNowPress: onCompleteBook,
                    onBackPress: onBackPress,
                    onUpdatePress: onUpdatePress,
                    onCompleteOffer: onCompleteBook,
                    onTermsPress: onTerms,
                    onPrivacyPress: onPrivacy,
                } as any}
            />
        </>
    );
}