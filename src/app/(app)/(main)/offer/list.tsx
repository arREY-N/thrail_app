/**
 * @file (main)/offer/list.tsx
 * @description Controller route for displaying available offers for a specific trail and orchestrating the booking wizard.
 */

import LoadingScreen from "@/src/app/loading";
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useOfferTrails } from "@/src/core/models/Offer/Offer";
import getSearchParam from "@/src/core/utility/getSearchParam";
import BookingScreen from "@/src/features/Book/screens/Booking/BookingScreen";
import { router, useLocalSearchParams } from "expo-router";

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
        isLoading,
        error: offerError,
    } = useOfferTrails(trailId);

    const {
        userBookings,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
        findUser,
        error: bookingFlowError,
    } = CreateBookingFlow();

    const displayError = offerError || bookingFlowError || null;

    const handleViewBookingDetails = (bookingId?: string) => {
        if (bookingId) {
            router.replace({
                pathname: '/(main)/book/list',
                params: { bookingId, view: 'overview' },
            });
        } else {
            router.replace('/(main)/book/list');
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <BookingScreen 
            offers={trailOffers}
            userBookings={userBookings}
            error={displayError}
            onSetOffer={onSetOffer}
            onBackPress={onBackPress}
            onUpdatePress={onUpdatePress}
            onCompleteOffer={onCompleteBook}
            onTermsPress={onTerms}
            onPrivacyPress={onPrivacy}
            onViewBookingDetails={handleViewBookingDetails}
            onSearchUser={findUser}
        />  
    );
}