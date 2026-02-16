import LoadingScreen from "@/src/app/loading";
import TESTUSERBOOK from "@/src/components/TESTCOMPONENTS/TestUserBook";
import { useOfferView } from '@/src/core/hook/useOfferView';
import { useLocalSearchParams } from "expo-router";

export default function listOffer(){
    const { trailId } = useLocalSearchParams();

    const {
        filteredOffers,
        onBookNowPress,
        bookingError,
        offerError,
        isLoading,
    } = useOfferView({ trailId });

    if(isLoading) return <LoadingScreen/>;

    return (
        <TESTUSERBOOK 
            offers={filteredOffers}
            onBookNowPress={onBookNowPress}
            system={bookingError || offerError}
        />
    )
}