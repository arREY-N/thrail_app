import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useTrailOffer } from "@/src/core/hook/offer/useTrailOffer";
import { useBookingUser } from "@/src/core/models/Booking/hooks/useBookingUser";
import BookingScreen from "@/src/features/Book/screens/Booking/BookingScreen";
import { useLocalSearchParams } from "expo-router";

export default function listOffer(){
    const { trailId } = useLocalSearchParams();
    const { onBackPress } = useAppNavigation();

    const { 
        onTerms, 
        onPrivacy 
    } = useLandingNavigation();

    const {
        isLoading: trailIsLoading,
        error: offerError,
        trailOffers,
    } = useTrailOffer({ trailId: trailId as any });

    const { 
        error: bookError,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
    } = useBookingUser();

    
    if(trailIsLoading) return <LoadingScreen/>;

    return (
        <>
            <BookingScreen 
                {...{
                    offers: trailOffers,
                    error: (offerError || bookError),
                    onSetOffer: onSetOffer,
                    onBookNowPress: onCompleteBook,
                    onBackPress: onBackPress,
                    onUpdatePress: onUpdatePress,
                    onCompleteOffer: onCompleteBook,
                    onTermsPress: onTerms,
                    onPrivacyPress: onPrivacy,
                } as any}
            />  
        </>
    );
}