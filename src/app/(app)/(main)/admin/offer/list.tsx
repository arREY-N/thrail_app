/**
 * @file list.tsx
 * @description Admin Offer List controller route. Connects domain hooks for business offers,
 * cancellations, and real-time bookings, and renders OfferListScreen with in-screen loading states.
 */

import { Stack } from "expo-router";
import React from "react";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAdminNavigation } from "@/src/core/models/Admin/Admin";
import { useCancellationAdminList } from "@/src/core/models/Cancellation/Cancellation";
import { useOfferAdminList } from "@/src/core/models/Offer/Offer";
import { useBookingListenerAdminList } from "@/src/core/models/Booking/Booking";
import OfferListScreen from "@/src/features/Admin/screens/Offer/OfferListScreen";

/**
 * AdminOfferList — Controller component for managing and viewing business offers.
 * Coordinates real-time hooks and passes clean props to OfferListScreen.
 *
 * @returns {React.JSX.Element} Rendered Admin Offer List page.
 */
export default function AdminOfferList(): React.JSX.Element {
    const { onBackPress } = useAppNavigation();
    const { onWriteOffer } = useAdminNavigation();

    const {
        isLoading,
        error,
        businessOffers,
        onViewOfferBookings,
    } = useOfferAdminList();

    const { businessCancellations } = useCancellationAdminList();
    const { bookingByOffer } = useBookingListenerAdminList();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferListScreen
                offers={businessOffers}
                bookingByOffer={bookingByOffer}
                cancellations={businessCancellations}
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
