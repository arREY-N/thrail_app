/**
 * @file view.tsx
 * @description Expo Router entry page / controller for admin booking review.
 * Composes database states, user permissions, and passes clean props to the ReviewScreen.
 */

import React from 'react';
import { Stack, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

import useApproveBooking from "@/src/core/hook/admin/useApproveBooking";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import getSearchParam from "@/src/core/utility/getSearchParam";
import ReviewScreen from "@/src/features/Admin/screens/Booking/ReviewScreen";

/**
 * Controller page handling route resolution and rendering of ReviewScreen.
 */
export default function adminViewBooking() {
    const { bookingId: rawId, offerId: rawOfferId } = useLocalSearchParams();

    const bookingId = getSearchParam(rawId);
    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    const { 
        offer,
        offers,
        booking,
        hikerProfile,
        error,
        isLoading,
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking, 
        onRescheduleBooking,
        onRefund,
        onCancelUnpaid
    } = useApproveBooking({ bookingId, offerId });

    if (!booking) return <Text>Booking not found</Text>;
    if (!offer) return <Text>Offer not found</Text>;
    
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            
            <ReviewScreen
                booking={booking}
                offers={offers}
                onBackPress={onBackPress}
                onApprove={onApproveBooking}
                onConfirmPayment={onConfirmPayment}
                onReject={onRejectBooking}
                onReschedule={onRescheduleBooking}
                onRefund={onRefund}
                onCancelUnpaid={onCancelUnpaid}
                isLoading={isLoading}
                error={error || undefined}            
                hikerProfile={hikerProfile}
            />
        </>
    );
}