import LoadingScreen from "@/src/app/loading";
import TESTUSERBOOK from "@/src/components/TESTCOMPONENTS/TestUserBook";
import { useOfferDomain } from "@/src/core/hook/useOfferDomain";
import { Stack, useLocalSearchParams } from "expo-router";

export default function listOffer(){
    const { trailId, mode } = useLocalSearchParams();

    const {
        list,
        onBookNowPress,
        bookingError,
        offerError,
        isLoading,
    } = useOfferDomain({ trailId, mode });

    if(isLoading) return <LoadingScreen/>;

    return (
        <>
            <Stack.Screen options={{headerShown: true}}/>
            <TESTUSERBOOK 
                offers={list}
                onBookNowPress={onBookNowPress}
                system={bookingError || offerError}
            />
        </>
    )
}