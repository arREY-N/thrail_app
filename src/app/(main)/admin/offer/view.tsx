import useOfferBooking from "@/src/core/hook/admin/useOfferBooking";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import { formatDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import OfferViewScreen from "@/src/features/Admin/screens/Offer/OfferViewScreen";

export default function viewOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();

    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    const { 
        offerBookings,
        offer,
        onViewBooking,
        error,
    } = useOfferBooking({ offerId });

    if(!offerBookings) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <Text>Loading...</Text>
            </>
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