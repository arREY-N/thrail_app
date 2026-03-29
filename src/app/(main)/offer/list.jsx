import LoadingScreen from "@/src/app/loading";
import useBookOffer from "@/src/core/hook/book/useBookOffer";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailOffer } from "@/src/core/hook/offer/useTrailOffer";
import BookingScreen from "@/src/features/Book/screens/ReservationFlow/BookingScreen";
import { useLocalSearchParams } from "expo-router";

export default function listOffer(){
    const { trailId } = useLocalSearchParams();
    const { onBackPress } = useAppNavigation();

    const {
        isLoading: trailIsLoading,
        error: offerError,
        trailOffers,
    } = useTrailOffer({ trailId });

    const { 
        isLoading: bookIsLoading,
        error: bookError,
        booking,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
    } = useBookOffer({ trailId });

    if(trailIsLoading) return <LoadingScreen/>;

    return (        
        <BookingScreen 
            offers={trailOffers}
            booking={booking}
            error={offerError || bookError}
            onSetOffer={onSetOffer}
            onBookNowPress={onCompleteBook}
            onBackPress={onBackPress}
            onUpdatePress={onUpdatePress}
            onCompleteOffer={onCompleteBook}
        />
    )
}