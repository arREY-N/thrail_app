import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";

import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { Booking, useBookingDelete } from "@/src/core/models/Booking/Booking";
import { useBookingUser } from "@/src/core/models/Booking/hooks/useBookingUser";
import { useBookingUserList } from "@/src/core/models/Booking/hooks/useBookingUserList";
import { useCancellationUser } from "@/src/core/models/Cancellation/hooks/useCancellationUser";
import { getOffer, newOffer } from "@/src/core/models/Offer/Offer";
import { useRescheduleUser } from "@/src/core/models/Reschedule/hooks/useRescheduleUser";
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";

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
        proceedToAdminReschedule,
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
    } = useBookingUser();

    const displayBookings: Booking[] = [...(bookings || [])];

    if (isFetching) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomLoading visible={true} message="Fetching your bookings..." />
            </ScreenWrapper>
        );
    }

    if (isDeleting) {
        return <CustomLoading visible={true} message="Cancelling your booking..." />;
    }

    return (
        <ScrollView>
            {deleteError && (
                <View style={{ padding: 10, margin: 10, backgroundColor: Colors.ERROR, borderRadius: 5 }}>
                    <Text style={{ color: Colors.WHITE }}>{deleteError}</Text>
                </View>
            )}
            {displayBookings.length > 0 && displayBookings.map(b => (
                <View key={b.id} style={{ padding: 10, margin: 10, borderWidth: 1, borderColor: Colors.GRAY, borderRadius: 5 }}>
                    <Text>ID: {b.id}</Text>
                    <Text>Trail: {b.trail.name}</Text>
                    <Text>Date: {b.offer.date.toDateString()}</Text>
                    <Text>Status: {b.status}</Text>
                    <Pressable onPress={() => cancelPendingBooking(b)}>
                        <Text style={{ color: 'red' }}>Cancel Booking</Text>
                    </Pressable>
                </View>
            ))}
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
        </ScrollView>
    );
}