/**
 * @file view.tsx
 * @description Expo Router entry page / controller for admin booking review.
 * Composes database states, user permissions, and passes clean props to the ReviewScreen.
 */

import { Stack, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

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
    useOfferList
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
        cancellationRequest,
        processCancellationRequest,
        cancelUserBooking,
        revertCancellationRequest,
        isWriting: isCancellationWriting,
        writingError: cancellationWritingError,
    } = useCancellationAdmin(bookingId);

    const {
        onRefund
    } = usePaymentAdmin();

    const {
        hikerProfile,
    } = useHikerProfile(booking?.user.id);


    if (!booking || isFetching) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <CustomLoading message="Fetching booking details" />
            </>
        );
    }

    if (!booking) return <Text>Booking not found</Text>;

    const combinedError = cancellationWritingError || bookingError || undefined;
    const combinedLoading = isBookingLoading || isCancellationWriting;

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
                isLoading={combinedLoading}
                error={combinedError}
                hikerProfile={hikerProfile}
                cancellationRequest={cancellationRequest}
                onApproveCancellation={(request, booking) => processCancellationRequest({
                    request,
                    approved: true,
                })}
                onDeclineCancellation={(declineNote, request, currentBooking) => processCancellationRequest({
                    adminNote: declineNote,
                    request,
                    approved: false,
                })}
                onRevertCancellation={revertCancellationRequest}
                onAdminCancelBooking={cancelUserBooking}
            />
        </>
    );
}