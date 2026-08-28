import { Stack, useLocalSearchParams } from "expo-router";

import useAdminOffer from "@/src/core/hook/admin/useAdminOffer";
import useAdminNavigation from "@/src/core/hook/navigation/useAdminNavigation";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import getSearchParam from "@/src/core/utility/getSearchParam";

import { useBookingsStore } from "@/src/core/models/Booking/Booking";
import OfferListScreen from "@/src/features/Admin/screens/Offer/OfferListScreen";

export default function AdminOfferList() {
    const { businessId: rawId } = useLocalSearchParams();
    const id = getSearchParam(rawId);

    const { onBackPress } = useAppNavigation();

    const {
        onWriteOffer,
    } = useAdminNavigation({ businessId: id });

    const {
        isLoading,
        error,
        businessOffers,
        onViewOfferBookings,
    } = useAdminOffer();

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