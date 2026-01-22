import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function book(){
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const bookingError = useBookingsStore(s => s.error);
    const offerError = useOffersStore(s => s.error);
    const loadTrailOffers = useOffersStore(s => s.loadTrailOffers);
    const trailOffers = useOffersStore(s => s.trailOffers);
    const offerIsLoading = useOffersStore(s => s.isLoading)
    const checkBookings = useBookingsStore(s => s.checkBookings);

    useEffect(() => {        
        loadTrailOffers(id);
    }, [id]);

    const onBookNowPress = (id) => {
        if(!checkBookings(id)) return;
        router.push(`/(book)/${id}`);
    }
    
    return(
        <TESTBOOK 
            offers={trailOffers}
            isLoading={offerIsLoading}
            onBookNowPress={onBookNowPress}
            system={bookingError || offerError}
        />
    )
}

const TESTBOOK = ({
    offers,
    isLoading,
    onBookNowPress,
    system
}) => {
    return (
        <View>
            { system && <Text>{system}</Text>}
            { !isLoading ?  
                offers?.length > 0 &&
                    offers.map((o) => {
                        return (
                            <View style={styles.offers} key={o.id}>
                                <Text>OfferID: {o.id}</Text>
                                <Text>Trail ID: {o.trailId}</Text>
                                <Text>Provider: {o.businessName}</Text>
                                <Text>Price: {o.price}</Text>
                                <Text>Date: {o.date}</Text>
                                <Pressable onPress={() => onBookNowPress(o.id)}>
                                    <Text>BOOK NOW</Text>
                                </Pressable>
                            </View>
                        )
                    })
                : <Text style={styles.loading}>New Offers loading</Text>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    offers: {
        borderWidth: 1,
        margin: 10,
        padding: 5
    },
    loading: {
        textAlign: 'center',
        margin: 10,
        padding: 10,
    }
})