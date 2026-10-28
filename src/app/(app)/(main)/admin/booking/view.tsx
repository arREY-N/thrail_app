/**
 * @file view.tsx
 * @description Expo Router entry page / controller for admin booking review.
 * Composes database states, user permissions, and passes clean props to the ReviewScreen.
 */

import { useEffect } from "react";
import { Stack, useLocalSearchParams } from "expo-router";

import CustomLoading from "@/src/components/CustomLoading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import {
    useBookingAdmin,
    useBookingAdminItem
} from "@/src/core/models/Booking/Booking";
import {
    useCancellationAdmin
} from "@/src/core/models/Cancellation/Cancellation";
import {
    useOfferStore
} from "@/src/core/models/Offer/Offer";
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

    const businessOffers = useOfferStore(s => s.businessOffers);

    const {
        booking,
        isFetching
    } = useBookingAdminItem(bookingId, offerId);

    const businessId = booking?.business?.id;
    useEffect(() => {
        if (businessId && (!businessOffers || businessOffers.length === 0)) {
            useOfferStore.getState().fetchOfferByBusiness(businessId);
        }
    }, [businessId, businessOffers]);

    const {
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onVerifyManualPayment,
        onRejectManualPayment,
        onSettleRemainingBalance,
        onUploadOverpaymentProof,
        error: bookingError,
        isLoading: isBookingLoading,
    } = useBookingAdmin();

    const {
        onCancelUnpaid,
        cancellationRequest,
        processCancellationRequest,
        cancelUserBooking,
        revertCancellationRequest,
        approveWithManualRefund,
        uploadRefundProof,
        isWriting: isCancellationWriting,
        writingError: cancellationWritingError,
    } = useCancellationAdmin(bookingId);

    const {
        onRefund
    } = usePaymentAdmin();

    const {
        hikerProfile,
    } = useHikerProfile(booking?.user.id);

    if (isFetching && !booking) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <CustomLoading message="Fetching booking details" />
            </>
        );
    }

    const combinedError = cancellationWritingError || bookingError || undefined;
    const combinedLoading = isBookingLoading || isCancellationWriting;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <ReviewScreen
                booking={booking}
                offers={businessOffers}
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
                onApproveCancellation={async (request, booking, refundType, customAmount, adminNote) => {
                    await processCancellationRequest({
                        request,
                        booking,
                        approved: true,
                        refundType,
                        customAmount,
                        adminNote,
                    });
                }}
                onDeclineCancellation={async (declineNote, request, currentBooking) => {
                    await processCancellationRequest({
                        adminNote: declineNote,
                        request,
                        booking: currentBooking,
                        approved: false,
                    });
                }}
                onRevertCancellation={revertCancellationRequest}
                onAdminCancelBooking={cancelUserBooking}
                onVerifyManualPayment={async (classification, note, b, verifiedAmount) => {
                    const targetBooking = b || booking;
                    if (targetBooking) {
                        await onVerifyManualPayment(targetBooking, classification, note, verifiedAmount);
                    }
                }}
                onRejectManualPayment={async (reason, b) => {
                    const targetBooking = b || booking;
                    if (targetBooking) {
                        await onRejectManualPayment(targetBooking, reason);
                    }
                }}
                onSettleRemainingBalance={async (b, options) => {
                    const targetBooking = b || booking;
                    if (targetBooking) {
                        await onSettleRemainingBalance(targetBooking, options);
                    }
                }}
                onUploadRefundProof={async (file, req, b) => {
                    await uploadRefundProof(file, req || cancellationRequest, b || booking);
                }}
                onUploadOverpaymentProof={async (file, b) => {
                    const targetBooking = b || booking;
                    if (targetBooking) {
                        await onUploadOverpaymentProof(targetBooking, file);
                    }
                }}
                onApproveWithManualRefund={async (amount, req, b) => {
                    await approveWithManualRefund(amount, req || cancellationRequest, b || booking);
                }}
            />
        </>
    );
}