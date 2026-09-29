/**
 * @file view.tsx
 * @description Expo Router entry page / controller for admin booking review.
 * Composes database states, user permissions, and passes clean props to the ReviewScreen.
 */

import { db } from "@/src/core/config/Firebase";
import { Stack, useLocalSearchParams } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { Text } from "react-native";

import CustomLoading from "@/src/components/CustomLoading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import {
    Booking,
    getUserBookingItem,
    updateBookingOnCancellation,
    useBookingAdmin,
    useBookingAdminItem,
    useBookingsStore,
} from "@/src/core/models/Booking/Booking";
import {
    Cancellation,
    cancellationConverter,
    flagCancellationRequest,
    useCancellationAdmin,
    useCancellationAdminList,
    useCancellationStore,
} from "@/src/core/models/Cancellation/Cancellation";
import {
    getGroup,
    updateGroupOnCancellation,
    useGroupStore,
} from "@/src/core/models/Group/Group";
import {
    getBusinessOfferItem,
    subtractReservedPaxOnOffer,
    useOfferList,
    useOfferStore,
} from "@/src/core/models/Offer/Offer";
import { usePaymentAdmin } from "@/src/core/models/Payment/Payment";
import { useAuthHook, useHikerProfile } from "@/src/core/models/User/User";
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
        revertCancellationRequest,
        isWriting: isCancellationWriting,
        writingError: cancellationWritingError,
    } = useCancellationAdmin();

    const { businessId, profile } = useAuthHook();
    const { businessCancellations } = useCancellationAdminList();

    // TODO: [Backend Handover / Issue #95]: Temporary controller-level onSnapshot listener for business cancellations because CancellationRepository lacks real-time listeners. Backend can remove or migrate to CancellationRepository/cancellationStore.
    useEffect(() => {
        if (!businessId || !profile || profile.role !== 'admin') return;

        const colRef = collection(db, 'businesses', businessId, 'cancellations').withConverter(cancellationConverter);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const list = snapshot.docs.map(d => d.data());
            useCancellationStore.setState({ businessCancellations: list });
        }, (err) => {
            console.error('Real-time admin cancellations subscription error:', err);
        });

        return () => unsubscribe();
    }, [businessId, profile]);

    const cancellationRequest = businessCancellations.find(
        (c: Cancellation) => c.bookingId === booking?.id
    ) ?? null;

    const {
        onRefund
    } = usePaymentAdmin();

    const {
        hikerProfile,
    } = useHikerProfile(booking?.user.id);

    // TODO: [Backend Handover / Catch 27 - Issue #82]: 
    // processCancellationRequest unconditionally calls onRefund, which crashes with "No payment found" on unpaid bookings (totalPaid === 0). 
    // When totalPaid === 0, the controller manually releases the offer slot, updates the group, and sets booking status = 'cancelled' without invoking PayMongo. 
    // Backend should skip onRefund when payment is 0.
    const handleApproveCancellation = async (
        request?: Cancellation | null,
        currentBooking?: Booking
    ) => {
        const activeBooking = currentBooking || booking;
        if (!activeBooking || !request) return;

        const totalPaid = activeBooking.payment?.reduce(
            (sum: number, p) => p.status === 'captured' ? sum + p.amount : sum,
            0
        ) || 0;

        if (totalPaid > 0) {
            // Paid booking: triggers refund and inventory updates via backend
            await processCancellationRequest(request, true);
        } else {
            // Catch 27: Unpaid booking (totalAmountPaid === 0).
            // Do NOT call onRefund because PayMongo will fail with "No payment found".
            // Directly release slot, update group, set booking status = 'cancelled', and flag cancellation = 'approved'.
            const offer = await getBusinessOfferItem(request.offerId);
            if (!offer) throw new Error("Offer not found for the provided offer ID.");

            const dbBooking = await getUserBookingItem(request.bookingId);
            if (!dbBooking) throw new Error("Booking not found for the provided booking ID.");

            const group = await getGroup(dbBooking.offer.id);

            const updatedOffer = subtractReservedPaxOnOffer(offer, dbBooking);
            const updatedBooking: Booking = {
                ...updateBookingOnCancellation(dbBooking, request, true),
                status: 'cancelled',
            };

            await useBookingsStore.getState().create(updatedBooking, true, true);
            await useOfferStore.getState().newOffer(updatedOffer);
            if (group) {
                const updatedGroup = updateGroupOnCancellation(group, dbBooking.user.id);
                await useGroupStore.getState().createGroup(updatedGroup);
            }

            const updatedCancellation = flagCancellationRequest(request, true);
            await useCancellationStore.getState().write({
                cancellation: updatedCancellation,
                oldCancellation: request,
                isAdmin: true,
            });
        }
    };

    const handleDeclineCancellation = async (
        declineNote: string,
        request?: Cancellation | null,
        currentBooking?: Booking
    ) => {
        const activeBooking = currentBooking || booking;
        if (!activeBooking || !request) return;

        await processCancellationRequest(request, false, declineNote);
    };

    const handleRevertCancellation = async (
        request?: Cancellation | null
    ) => {
        if (!request) return;
        await revertCancellationRequest(request);
    };

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
                onApproveCancellation={handleApproveCancellation}
                onDeclineCancellation={handleDeclineCancellation}
                onRevertCancellation={handleRevertCancellation}
                onAdminCancelBooking={cancelUserBooking}
            />
        </>
    );
}