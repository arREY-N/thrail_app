import CustomTextInput from "@/src/components/CustomTextInput";
import { validatePayment } from '@/src/core/domain/paymentDomain';
import { useAuthStore } from "@/src/core/stores/authStore";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function book(){
    const { id } = useLocalSearchParams();
    const [system, setSystem] = useState('');
    const router = useRouter();

    const trailOffers = useOffersStore((state) => state.trailOffers);
    const offer = trailOffers.find(o => o.id === id);
    const profile = useAuthStore((state) => state.profile);

    const createPayment = usePaymentsStore((state) => state.createPayment);
    const paymentIsLoading = usePaymentsStore((state) => state.isLoading);

    const createBooking = useBookingsStore((state) => state.createBooking);
    const bookingIsLoading = useBookingsStore((state) => state.isLoading);

    const onPayPress = async (paymentData) => {
        try {
            if(!paymentData.mode) throw new Error('Select payment method');
            
            const receipt = validatePayment();
            
            if(!receipt) {
                console.log('Invalid payment');
            }
            
            const payment = {
                businessId: offer.businessId,
                userId: profile.id,
                offerId: offer.id,
                amount: offer.price,
                mode: paymentData.mode,
                ...receipt
            }
    
            const paymentRef = await createPayment(payment);

            const bookingRec = {
                receiptId: receipt.receiptId,
                paymentId: paymentRef,
                mode: paymentData.mode,
                businessName: offer.businessName,
                trailName: offer.trailName,
                businessId: offer.businessId,
                trailId: offer.trailId,
                date: offer.date,
                price: offer.price,
                userId: profile.id,
                offerId: offer.id,
            }

            await createBooking(bookingRec);
            router.replace('/(tabs)/home');
        } catch (err) {
            console.log(err.message);
            setSystem(err.message)        
        }
    }

    return (
        !(paymentIsLoading || bookingIsLoading) ? 
            <TESTBOOK 
                offer={offer}
                profile={profile}
                onPayPress={onPayPress}
                system={system}
            /> : 
            
            <Text style={styles.loading}>LOADING...</Text>
    )
}

const TESTBOOK = ({
    offer,
    profile,
    onPayPress,
    system
}) => {
    const [mode, setMode] = useState('');

    return (
        <View>    
            <Text>Book</Text>
            { system && <Text> {system}</Text> }
            <View style={styles.card}>
                <Text>Offer Information</Text>
                <Text>OfferID: {offer.id}</Text>
                <Text>Trail ID: {offer.trailId}</Text>
                <Text>Price: {offer.price}</Text>
                <Text>Provider: {offer.businessName}</Text>
                <Text>Date: {offer.date}</Text>
            </View>
            <View style={styles.card}>
                <Text>User Information</Text>
                <Text>User ID: {profile.id} </Text>
                <Text>User: {profile.firname} {profile.lastname}</Text>
                <Text>Username: {profile.username}</Text>
            </View>
            
            <CustomTextInput
                placeholder="Mode of Payment"
                value={mode}
                onChangeText={null}
            />
            
            <Pressable onPress={() => setMode('Maya')}>
                <Text>Maya</Text>
            </Pressable>

            <Pressable onPress={() => setMode('GCash')}>
                <Text>GCash</Text>
            </Pressable>

            <Pressable onPress={() => onPayPress({
                offerId: offer.id,
                userId: profile.id,
                mode,
            })}>
                <Text>Pay</Text>
            </Pressable>
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