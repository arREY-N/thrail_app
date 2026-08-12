import { Booking } from "@/src/core/models/Booking/Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import OfferViewScreen from "@/src/features/Admin/screens/Offer/OfferViewScreen";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useBookingAdminList } from "@/src/core/models/Offer/hooks/useBookingAdminList";
import { useOfferItem } from "@/src/core/models/Offer/hooks/useOfferItem";

export default function viewOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();

    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    
    const {
        error,
        onViewBooking,
        offerBookings,
    } = useBookingAdminList(offerId);
    
    const {
        offer 
    } = useOfferItem(offerId);

    if(!offerBookings || (!offer)) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND} style={undefined}>
                <Stack.Screen options={{ headerShown: false }} />
                
                <CustomHeader 
                    title="Offer Details"
                    centerTitle={true}
                    onBackPress={onBackPress} rightActions={undefined} style={undefined} children={undefined}                />

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            </ScreenWrapper>
        )
    }
    console.log('reached admin/offer/view');

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferViewScreen
                offerId={offerId}
                offer={offer as Offer}
                bookings={offerBookings}
                onViewBooking={onViewBooking}
                onBackPress={onBackPress}
                error={error as string} 
            />
        </>
    )
}

export type ViewOfferParams = {
    offerId: string;
    offer: Offer  | null;
    bookings: Booking[];
    onViewBooking: (bookingId: string, offerId: string) => void;
    error: string | null;
}
