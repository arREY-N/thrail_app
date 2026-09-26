import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useBookingUserList } from "@/src/core/models/Booking/Booking";
import { useCancellationUser, useCancellationUserList } from "@/src/core/models/Cancellation/Cancellation";
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
        />
    );
}