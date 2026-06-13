import LoadingScreen from "@/src/app/loading";
import useBookOffer from "@/src/core/hook/book/useBookOffer";
import useFileUpload from "@/src/core/hook/file/useFileUpload";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useTrailOffer } from "@/src/core/hook/offer/useTrailOffer";
import BookingScreen from "@/src/features/Book/screens/Booking/BookingScreen";
import { useLocalSearchParams } from "expo-router";

export default function listOffer(){
    const { trailId } = useLocalSearchParams();
    const { onBackPress } = useAppNavigation();

    const { 
        onTerms, 
        onPrivacy } = useLandingNavigation();

    const {
        isLoading: trailIsLoading,
        error: offerError,
        trailOffers,
    } = useTrailOffer({ trailId: trailId as any });

    const { 
        isLoading: bookIsLoading,
        error: bookError,
        booking,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
    } = useBookOffer({ trailId: trailId as any });

    const {
        localError,
        validId,
        medicalCertificate,
        bir,
        dti,
        denr,
        onPayOffer,
    } = useFileUpload() as any;

    console.log('trailIsLoading: ', trailIsLoading)
    if(trailIsLoading) return <LoadingScreen/>;

    return (
        <>
            {/* @ts-ignore */}
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