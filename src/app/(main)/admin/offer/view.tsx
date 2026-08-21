import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import OfferViewScreen from "@/src/features/Admin/screens/Offer/OfferViewScreen";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useBookingOfferAdminList, useOfferItem } from "@/src/core/models/Offer/Offer";


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
        )
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            {offer && (
                <OfferViewScreen
                    offerId={offerId}
                    offer={offer}
                    bookings={offerBookings}
                    onViewBooking={onViewBooking}
                    onBackPress={onBackPress}
                    error={error as string}
                />
            )}
        </>
    )
}