import { Stack } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

import { useAdminNavigation } from "@/src/core/models/Admin/Admin";
import { useBookingListenerAdminList, useBookingsStore } from "@/src/core/models/Booking/Booking";

import { useOfferAdminList } from "@/src/core/models/Offer/Offer";
import OfferListScreen from "@/src/features/Admin/screens/Offer/OfferListScreen";

export default function AdminOfferList() {
    const { onBackPress } = useAppNavigation();

    const { onWriteOffer } = useAdminNavigation();

    useBookingListenerAdminList();

    const {
        isLoading,
        error,
        businessOffers,
        onViewOfferBookings
    } = useOfferAdminList();

    const bookingByOffer = useBookingsStore(s => s.bookingByOffer);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferListScreen
                offers={businessOffers}
                bookingByOffer={bookingByOffer}
                isLoading={isLoading}
                onAddOffer={onWriteOffer}
                onEditOffer={onWriteOffer}
                onViewOfferBookings={onViewOfferBookings}
                onBackPress={onBackPress}
                error={error}
            />
        </>
    );
}