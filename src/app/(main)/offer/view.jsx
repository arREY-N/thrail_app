import TESTBOOK from '@/src/components/TESTCOMPONENTS/TestBook';
import { useBookView } from '@/src/core/hook/useBookView';
import { Stack, useLocalSearchParams } from "expo-router";

export default function viewOffer(){
    const { offerId } = useLocalSearchParams();

    const {
        offer,
        mode,
        setMode,
        modes,
        onPayPress,
        paymentIsLoading,
        bookingIsLoading,
        systemBookings,
        systemOffers,
        systemPayments,
        profile,
    } = useBookView({ offerId });
    
    console.log(offer);
    
    return(
        <>
            <Stack.Screen options={{headerShown: true}}/>
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
        </>
    )
}