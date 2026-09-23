import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useBookingOfferAdminList } from "@/src/core/models/Booking/Booking";
import { Cancellation, useCancellationAdminList } from "@/src/core/models/Cancellation/Cancellation";
import { useOfferItem } from "@/src/core/models/Offer/Offer";
import getSearchParam from "@/src/core/utility/getSearchParam";
import OfferViewScreen from "@/src/features/Admin/screens/Offer/OfferViewScreen";

export default function ViewOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();

    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    const {
        error,
        onViewBooking,
        offerBookings,
    } = useBookingOfferAdminList(offerId);

    const {
        offer
    } = useOfferItem(offerId);

    const { businessCancellations } = useCancellationAdminList();

    const displayBookings = useMemo(() => {
        if (!offerBookings) return [];
        return offerBookings.map(b => {
            const activeCancellation = businessCancellations?.find(
                (c: Cancellation) => c.bookingId === b.id && c.status === 'pending'
            );
            if (activeCancellation) {
                return {
                    ...b,
                    status: 'for-cancellation' as const,
                    cancellationReason: activeCancellation.reason || b.cancellationReason,
                };
            }

            const rejectedCancellation = businessCancellations?.find(
                (c: Cancellation) => c.bookingId === b.id && c.status === 'rejected'
            );
            if (
                rejectedCancellation &&
                b.status !== 'cancelled' &&
                b.status !== 'refund' &&
                b.status !== 'refunded'
            ) {
                return {
                    ...b,
                    status: 'cancellation-rejected' as const,
                    cancellationReason: rejectedCancellation.reason || b.cancellationReason,
                };
            }

            return b;
        });
    }, [offerBookings, businessCancellations]);

    if (!offerBookings || (!offer)) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND} style={undefined}>
                <Stack.Screen options={{ headerShown: false }} />

                <CustomHeader
                    title="Offer Details"
                    centerTitle={true}
                    onBackPress={onBackPress} rightActions={undefined} style={undefined} />

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            {offer && (
                <OfferViewScreen
                    offerId={offerId}
                    offer={offer}
                    bookings={displayBookings}
                    onViewBooking={onViewBooking}
                    onBackPress={onBackPress}
                    error={error as string}
                />
            )}
        </>
    );
}