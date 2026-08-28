import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { CreateBookingFlow } from "@/src/core/flows/CreateBookingFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { Booking, useBookingDelete, useBookingUserList } from "@/src/core/models/Booking/Booking";
import { useCancellationUser } from "@/src/core/models/Cancellation/Cancellation";
import { getOffer, newOffer } from "@/src/core/models/Offer/Offer";
import { useRescheduleUser } from "@/src/core/models/Reschedule/Reschedule";
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";
import { useLocalSearchParams } from "expo-router";

export default function ListBook() {
    const { bookingId, view } = useLocalSearchParams();

    const {
        onBackPress
    } = useAppNavigation();

    const {
        onTerms: onTermsPress,
        onPrivacy: onPrivacyPress
    } = useLandingNavigation();

    const {
        cancelBooking,
        onRefundBooking,
    } = useCancellationUser();

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
        cancelPendingBooking,
    } = useBookingDelete();

    const {
        onPayOffer,
    } = CreateBookingFlow();

    const displayBookings: Booking[] = [...(bookings || [])];

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
                <CustomLoading visible={true} message="Cancelling your booking..." />;
            </ScreenWrapper>
        );
    }

    return (
        <MyBookingsScreen
            userBookings={displayBookings as any}
            isLoading={isFetching}
            error={subscriptionError || deleteError as any}
            onBackPress={onBackPress}
            onCancelBookingPress={cancelBooking as any}
            onRefundBookingPress={onRefundBooking as any}
            onRescheduleBooking={onRescheduleBooking as any}
            onPayOffer={onPayOffer as any}
            getBookOffer={getOffer as any}
            availableFutureOffers={[newOffer(), newOffer()]}
            initialBookingId={bookingId as any}
            initialView={view as any}
            onTermsPress={onTermsPress}
            onPrivacyPress={onPrivacyPress}
        />
    );
}