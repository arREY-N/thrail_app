
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useBookingUserList, useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useCancellationUser, useCancellationUserList } from "@/src/core/models/Cancellation/Cancellation";
import { getOffer, newOffer } from "@/src/core/models/Offer/Offer";
import { useRescheduleUser } from "@/src/core/models/Reschedule/Reschedule";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";

export default function ListBook() {
    const { bookingId: rawBookingId, view: rawView } = useLocalSearchParams();
    const bookingId = getSearchParam(rawBookingId);
    const rawViewStr = getSearchParam(rawView);
    const view = (rawViewStr === 'overview' || rawViewStr === 'payment' || rawViewStr === 'receipt' || rawViewStr === 'list')
        ? rawViewStr
        : undefined;

    const { profile } = useAuthHook();

    const {
        onBackPress,
        onSeeMoreOffersPress
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
        onPayOffer,
        onResubmitDocuments,
        onUpdateBookingContacts,
        onSyncBookingVerification,
        findUser,
    } = CreateBookingFlow();

    const [isRetrying, setIsRetrying] = useState(false);
    const isStoreLoading = useBookingsStore(s => s.isLoading);
    const profileId = profile?.id;

    const onRetry = useCallback(async () => {
        if (!profileId) return;
        setIsRetrying(true);
        try {
            await useBookingsStore.getState().refresh(profileId, 'user');
            useBookingsStore.getState().subscribeToUserBookings(profileId);
        } catch (error) {
            console.error('Failed to retry loading bookings:', error);
        } finally {
            setIsRetrying(false);
        }
    }, [profileId]);

    return (
        <MyBookingsScreen
            userBookings={bookings || []}
            userCancellations={userCancellations || []}
            isLoading={isFetching || isStoreLoading || isRetrying}
            isRetrying={isRetrying}
            error={subscriptionError || cancellationError || cancellationsListError || undefined}
            onBackPress={onBackPress}
            onCancelBookingPress={cancelBooking}
            onWithdrawCancellation={cancelUserRequest}
            onUpdateCancellationReason={updateCancellationReason}
            onAcceptAdminCancellation={proceedToAdminCancellation}
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
            onExplorePress={onSeeMoreOffersPress}
            onRetry={onRetry}
        />
    );
}