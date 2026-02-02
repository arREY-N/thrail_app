import CustomTextInput from "@/src/components/CustomTextInput";
import { useAuthStore } from "@/src/core/stores/authStore";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function book(){
    const { offerId } = useLocalSearchParams();
    const systemOffers = useOffersStore(s => s.error);
    const systemPayments = usePaymentsStore(s => s.error);
    const systemBookings = useBookingsStore(s => s.error);

    const router = useRouter();    
    const profile = useAuthStore(s => s.profile);

    const loadOffer = useOffersStore(s => s.loadOffer);
    const offer = useOffersStore(s => s.offer);

    const createPayment = usePaymentsStore(s => s.createPayment);
    const paymentIsLoading = usePaymentsStore(s => s.isLoading);
    
    const createBooking = useBookingsStore(s => s.createBooking);
    const bookingIsLoading = useBookingsStore(s => s.isLoading);

    const [mode, setMode] = useState('');
    const modes = ['GCash', 'Maya'];
    
    useEffect(() => {
        console.log('Booking: ', offerId);
        if(offerId) loadOffer(offerId)
    }, [offerId]);

    const onPayPress = async (mode) => {
        const payment = await createPayment({
            profile,
            offer,
            mode
        })

        if(!payment) return;

        await createBooking({
            bookingData: {
                payment: 
                offer
            },
        });

        router.replace(`/(receipt)/${payment.id}`);
    }

    if(!offer) return;

    return (
        <TESTBOOK 
            offer={offer}
            profile={profile}
            mode={mode}
            setMode={setMode}
            modes={modes}
            onPayPress={onPayPress}
            isLoading={paymentIsLoading || bookingIsLoading}
            system={systemBookings || systemOffers || systemPayments}
        /> 
    )
}

const TESTBOOK = ({
    offer,
    profile,
    mode,
    setMode,
    modes,
    onPayPress,
    isLoading,
    system
}) => {
    console.log(offer);
    return (
        <View>    
            <Text>Book</Text>
            { system && <Text>{system}</Text> }
            { !isLoading 
                ? offer && 
                    <View>    
                        <View style={styles.card}>
                            <Text>Offer Information</Text>
                            <Text>Trail: {offer.trail.name ?? ''}</Text>
                            <Text>Price: {offer.price ?? ''}</Text>
                            <Text>Provider: {offer?.business.name ?? ''}</Text>
                            <Text>Date: {offer.date ?? ''}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text>User Information</Text>
                            <Text>User: {profile.firstname} {profile?.lastname}</Text>
                            <Text>Email: {profile.email}</Text>
                        </View>
                        
                        <CustomTextInput
                            placeholder="Mode of Payment"
                            value={mode}
                            onChangeText={null}
                        />
                        {
                            modes.map(m => {
                                return (
                                    <Pressable onPress={() => setMode(m)}>
                                        <Text>{m}</Text>
                                    </Pressable>
                                )
                            })
                        }     

                        <Pressable onPress={() => onPayPress(mode)}>
                            <Text>Pay</Text>
                        </Pressable>
                    </View> 
                : <Text>Offer loading</Text>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        margin: 10,
        padding: 5
    },
    loading: {
        margin: 10,
        padding: 5,
        textAlign: 'center'
    }
})