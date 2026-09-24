import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { Booking, useBookingDelete, useBookingUserList } from "@/src/core/models/Booking/Booking";
import { Cancellation, useCancellationUser, useCancellationUserList } from "@/src/core/models/Cancellation/Cancellation";
import { getOffer, newOffer } from "@/src/core/models/Offer/Offer";
import { useRescheduleUser } from "@/src/core/models/Reschedule/Reschedule";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function ListBook() {
    const { bookingId: rawBookingId, view: rawView } = useLocalSearchParams();
    const bookingId = getSearchParam(rawBookingId);
    const rawViewStr = getSearchParam(rawView);
    const view = (rawViewStr === 'overview' || rawViewStr === 'payment' || rawViewStr === 'receipt' || rawViewStr === 'list') 
        ? rawViewStr 
        : undefined;

    const { profile } = useAuthHook();

    const {
        onBackPress
    } = useAppNavigation();

    const {
        onTerms: onTermsPress,
        onPrivacy: onPrivacyPress
    } = useLandingNavigation();

    const {
        cancelBooking,
        cancelUserRequest,
        updateCancellationReason,
        proceedToAdminCancellation,
        onRefundBooking,
        writingError: cancellationError,
    } = useCancellationUser();

    const {
        userCancellations,
        refreshUserCancellations,
        error: cancellationsListError,
    } = useCancellationUserList();

    const {
        onRescheduleBooking
    } = useRescheduleUser();

    const {
        bookings,
        subscriptionError,
        isFetching
    } = useBookingUserList();

    const {
        isDeleting,
        error: deleteError,
    } = useBookingDelete();

    const {
        onPayOffer,
        onResubmitDocuments,
        onUpdateBookingContacts,
        onSyncBookingVerification,
        findUser,
    } = CreateBookingFlow();

    const [localBookingOverrides, setLocalBookingOverrides] = useState<Record<string, Booking>>({});

    const handleCancelBooking = async (booking: Booking, reason: string) => {
        await cancelBooking(booking, reason);
        if (booking.status !== 'for-reservation') {
            setLocalBookingOverrides(prev => ({
                ...prev,
                [booking.id]: {
                    ...booking,
                    status: 'for-cancellation',
                    cancellationReason: reason,
                }
            }));
        }
        await refreshUserCancellations();
    };

    const handleWithdrawCancellation = async (cancellation: Cancellation) => {
        await cancelUserRequest(cancellation);
        setLocalBookingOverrides(prev => {
            const next = { ...prev };
            delete next[cancellation.bookingId];
            return next;
        });
        await refreshUserCancellations();
    };

    const handleUpdateCancellationReason = async (cancellation: Cancellation, newReason: string) => {
        await updateCancellationReason({
            reason: newReason,
            oldRequest: cancellation,
        });
        await refreshUserCancellations();
    };

    const handleAcceptAdminCancellation = async (cancellation: Cancellation) => {
        await proceedToAdminCancellation(cancellation);
        await refreshUserCancellations();
    };

    const displayBookings: Booking[] = (bookings || []).map(b => {
        if (localBookingOverrides[b.id]) return localBookingOverrides[b.id];

        const activeCancellation = userCancellations?.find(
            c => c.bookingId === b.id && c.status === 'pending'
        );
        if (activeCancellation) {
            return {
                ...b,
                status: 'for-cancellation',
                cancellationReason: activeCancellation.reason,
            };
        }

        const rejectedCancellation = userCancellations?.find(
            c => c.bookingId === b.id && c.status === 'rejected'
        );
        if (
            rejectedCancellation &&
            b.status !== 'cancelled' &&
            b.status !== 'refund' &&
            b.status !== 'refunded'
        ) {
            return {
                ...b,
                status: 'cancellation-rejected',
                cancellationReason: rejectedCancellation.reason,
            };
        }

        return b;
    });

    if (isFetching) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomLoading visible={true} message="Fetching your bookings..." />
            </ScreenWrapper>
        );
    }

    if (isDeleting) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomLoading visible={true} message="Cancelling your booking..." />
            </ScreenWrapper>
        );
    }

    return (
        <MyBookingsScreen
            userBookings={displayBookings}
            userCancellations={userCancellations}
            isLoading={isFetching}
            error={subscriptionError || deleteError || cancellationError || cancellationsListError || undefined}
            onBackPress={onBackPress}
            onCancelBookingPress={handleCancelBooking}
            onWithdrawCancellation={handleWithdrawCancellation}
            onUpdateCancellationReason={handleUpdateCancellationReason}
            onAcceptAdminCancellation={handleAcceptAdminCancellation}
            onRefundBookingPress={onRefundBooking}
            onResubmitDocuments={onResubmitDocuments}
            onUpdateBookingContacts={onUpdateBookingContacts}
            onRescheduleBooking={onRescheduleBooking}
            onPayOffer={onPayOffer}
            getBookOffer={getOffer}
            availableFutureOffers={[newOffer(), newOffer()]}
            initialBookingId={bookingId}
            initialView={view}
            onTermsPress={onTermsPress}
            onPrivacyPress={onPrivacyPress}
            currentUserProfile={profile}
            onSyncBookingVerification={onSyncBookingVerification}
            onSearchUser={findUser}
        />
    );
}