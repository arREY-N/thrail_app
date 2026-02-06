import TESTBOOK from '@/src/components/TESTCOMPONENTS/TestBook';
import { useBookView } from '@/src/core/hook/useBookView';
import { useLocalSearchParams } from "expo-router";

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
    
    return(
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