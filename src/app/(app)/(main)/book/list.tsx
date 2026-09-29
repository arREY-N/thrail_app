import { db } from "@/src/core/config/Firebase";
import { collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { useEffect } from "react";

import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { Booking, useBookingsStore, useBookingUserList } from "@/src/core/models/Booking/Booking";
import { Cancellation, cancellationConverter, useCancellationStore, useCancellationUser, useCancellationUserList } from "@/src/core/models/Cancellation/Cancellation";
import { getOffer, newOffer } from "@/src/core/models/Offer/Offer";
import { useRescheduleUser } from "@/src/core/models/Reschedule/Reschedule";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";
import { useLocalSearchParams } from "expo-router";

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
        error: cancellationsListError,
    } = useCancellationUserList();

    // TODO: [Backend Handover / Issue #95]: Temporary controller-level onSnapshot listener for user cancellations because CancellationRepository lacks real-time listeners. Backend can remove or migrate to CancellationRepository/cancellationStore.
    useEffect(() => {
        if (!profile?.id || profile.role === 'admin') return;

        const q = query(
            collectionGroup(db, 'cancellations').withConverter(cancellationConverter),
            where('userId', '==', profile.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => d.data());
            useCancellationStore.setState({ userCancellations: list });
        }, (err) => {
            console.error('Real-time user cancellations subscription error:', err);
        });

        return () => unsubscribe();
    }, [profile?.id, profile?.role]);

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

    // TODO: [Backend Handover / Issue #96]: 
    // proceedToAdminCancellation only approves the cancellation record in businesses/{id}/cancellations and omits updating the parent booking document (users/{userId}/bookings/{bookingId}) to status = 'cancelled'. 
    // The controller manually syncs useBookingsStore so the booking transitions to the history tab. Backend should update both records atomically.
    const handleAcceptAdminCancellation = async (cancellation: Cancellation) => {
        await proceedToAdminCancellation(cancellation);
        const targetBooking = bookings?.find((b) => b.id === cancellation.bookingId);
        if (targetBooking && targetBooking.status !== 'cancelled') {
            const updatedBooking: Booking = {
                ...targetBooking,
                status: 'cancelled',
                cancelledBy: 'admin',
                updatedAt: new Date(),
            };
            await useBookingsStore.getState().create(updatedBooking, false, true);
        }
    };

    if (isFetching) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomLoading visible={true} message="Fetching your bookings..." />
            </ScreenWrapper>
        );
    }

    return (
        <MyBookingsScreen
            userBookings={bookings || []}
            userCancellations={userCancellations}
            isLoading={isFetching}
            error={subscriptionError || cancellationError || cancellationsListError || undefined}
            onBackPress={onBackPress}
            onCancelBookingPress={cancelBooking}
            onWithdrawCancellation={cancelUserRequest}
            onUpdateCancellationReason={updateCancellationReason}
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