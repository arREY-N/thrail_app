/**
 * @file view.tsx
 * @description Expo Router entry page / controller for admin booking review.
 * Composes database states, user permissions, and passes clean props to the ReviewScreen.
 */

import { Stack, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

import CustomLoading from "@/src/components/CustomLoading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Booking, useBookingAdmin, useBookingAdminItem, } from "@/src/core/models/Booking/Booking";
import { Cancellation, useCancellationAdmin, useCancellationAdminList } from "@/src/core/models/Cancellation/Cancellation";
import { useOfferList } from "@/src/core/models/Offer/Offer";
import { usePaymentAdmin } from "@/src/core/models/Payment/Payment";
import { useHikerProfile } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import ReviewScreen from "@/src/features/Admin/screens/Booking/ReviewScreen";

/**
 * Controller page handling route resolution and rendering of ReviewScreen.
 */
export default function AdminViewBooking() {
    const { bookingId: rawId, offerId: rawOfferId } = useLocalSearchParams();

    const bookingId = getSearchParam(rawId);
    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    const { offers } = useOfferList();

    const {
        booking,
        isFetching
    } = useBookingAdminItem(bookingId, offerId);

    const {
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onCancelUnpaid,
        error: bookingError,
        isLoading: isBookingLoading,
    } = useBookingAdmin();

    const {
        processCancellationRequest,
        cancelUserBooking,
        isWriting: isCancellationWriting,
        writingError: cancellationWritingError,
    } = useCancellationAdmin();

    const { businessCancellations } = useCancellationAdminList();

    const cancellationRequest = businessCancellations.find(
        (c: Cancellation) => c.bookingId === booking?.id
    ) ?? null;

    const {
        onRefund
    } = usePaymentAdmin();

    const {
        hikerProfile,
    } = useHikerProfile(booking?.user.id);

    const handleApproveCancellation = async (
        request?: Cancellation | null,
        currentBooking?: Booking
    ) => {
        const activeBooking = currentBooking || booking;
        if (!activeBooking) return;

        if (request) {
            await processCancellationRequest(request, true);
        } else {
            const simulatedRequest: Cancellation = {
                id: activeBooking.id,
                userId: activeBooking.user.id,
                cancelledBy: 'user',
                bookingId: activeBooking.id,
                offerId: activeBooking.offer.id,
                businessId: activeBooking.business.id,
                reason: activeBooking.cancellationReason || "Cancellation requested by hiker",
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await processCancellationRequest(simulatedRequest, true);
        }
        onBackPress();
    };

    const handleDeclineCancellation = async (
        declineNote: string,
        request?: Cancellation | null,
        currentBooking?: Booking
    ) => {
        const activeBooking = currentBooking || booking;
        if (!activeBooking) return;

        if (request) {
            await processCancellationRequest(request, false, declineNote);
        } else {
            const simulatedRequest: Cancellation = {
                id: activeBooking.id,
                userId: activeBooking.user.id,
                cancelledBy: 'user',
                bookingId: activeBooking.id,
                offerId: activeBooking.offer.id,
                businessId: activeBooking.business.id,
                reason: activeBooking.cancellationReason || "Cancellation requested by hiker",
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await processCancellationRequest(simulatedRequest, false, declineNote);
        }
        onBackPress();
    };

    const handleAdminCancelBooking = async (
        targetBooking: Booking,
        reason: string
    ) => {
        await cancelUserBooking(targetBooking, reason);
        onBackPress();
    };

    if (!booking || isFetching) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <CustomLoading message="Fetching booking details" />
            </>
        )
    }

    if (!booking) return <Text>Booking not found</Text>;

    const combinedError = cancellationWritingError || bookingError || undefined;
    const combinedLoading = isBookingLoading || isCancellationWriting;

    const displayBooking: Booking = (cancellationRequest && cancellationRequest.status === 'pending')
        ? {
            ...booking,
            status: 'for-cancellation' as const,
            cancellationReason: cancellationRequest.reason || booking.cancellationReason,
        }
        : (cancellationRequest && cancellationRequest.status === 'rejected' && booking.status !== 'cancelled' && booking.status !== 'refund' && booking.status !== 'refunded')
            ? {
                ...booking,
                status: 'cancellation-rejected' as const,
                cancellationReason: cancellationRequest.reason || booking.cancellationReason,
            }
            : booking;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <ReviewScreen
                booking={displayBooking}
                offers={offers}
                onBackPress={onBackPress}
                onApprove={onApproveBooking}
                onConfirmPayment={onConfirmPayment}
                onReject={onRejectBooking}
                onReschedule={onRescheduleBooking}
                onRefund={onRefund}
                onCancelUnpaid={onCancelUnpaid}
                isLoading={combinedLoading}
                error={combinedError}
                hikerProfile={hikerProfile}
                cancellationRequest={cancellationRequest}
                onApproveCancellation={handleApproveCancellation}
                onDeclineCancellation={handleDeclineCancellation}
                onAdminCancelBooking={handleAdminCancelBooking}
            />
        </>
    );
}