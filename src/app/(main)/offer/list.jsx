import LoadingScreen from "@/src/app/loading";
import useBookOffer from "@/src/core/hook/book/useBookOffer";
import useFileUpload from "@/src/core/hook/file/useFileUpload";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailOffer } from "@/src/core/hook/offer/useTrailOffer";
import BookingScreen from "@/src/features/Book/screens/Booking/BookingScreen";
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

    const {
        localError,
        validId,
        medicalCertificate,
        bir,
        dti,
        denr,
        onPayOffer,
    } = useFileUpload();

    console.log('trailIsLoading: ', trailIsLoading)
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