import useOfferBooking from "@/src/core/hook/admin/useOfferBooking";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import { formatDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import OfferViewScreen from "@/src/features/Admin/screens/Offer/OfferViewScreen";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

export default function viewOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();

    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    const { 
        offerBookings,
        offer,
        onViewBooking,
        error,
        isLoading
    } = useOfferBooking({ offerId });

    if(!offerBookings || (isLoading && !offer)) {
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

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferViewScreen
                offerId={offerId}
                offer={offer}
                bookings={offerBookings}
                onViewBooking={onViewBooking}
                onBackPress={onBackPress}
                error={error} 
            />
        </>

        // <TestOfferView
        //     offerId={offerId}
        //     offer={offer}
        //     bookings={offerBookings}
        //     onViewBooking={onViewBooking}
        //     error={error} 
        // />
    )
}

export type ViewOfferParams = {
    offerId: string;
    offer: Offer  | null;
    bookings: Booking[];
    onViewBooking: (bookingId: string, offerId: string) => void;
    error: string | null;
}

const TestOfferView = (params: ViewOfferParams) => {
    if(!params.offer) return <Text>Offer not found</Text>;
    
    const offer = params.offer;

    return(
        <ScrollView>
            { params.error && <Text>{params.error}</Text>}
            <Text>{offer.name}</Text>
            <Text>{offer.description}</Text>
            <Text>{offer.price}</Text>

            {params.bookings.length > 0 &&
                params.bookings.map(b => {
                    return (
                        <Pressable onPress={() => params.onViewBooking(b.id, offer.id)} key={b.id} style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
                            <Text>{b.user.username}</Text>
                            <Text>{formatDate(b.createdAt)}</Text>
                            <Text>{b.status}</Text>
                        </Pressable>
                    )
                })
            }
        </ScrollView>
    )
}