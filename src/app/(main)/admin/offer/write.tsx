import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useOfferWrite } from "@/src/core/hook/offer/useOfferWrite";
import useTrail from "@/src/core/hook/trail/useTrail";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import getSearchParam from "@/src/core/utility/getSearchParam";
import OfferWriteScreen from "@/src/features/Admin/screens/Offer/OfferWriteScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function writeOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();
    const { businessId } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const offerId = getSearchParam(rawOfferId);

    const { trails } = useTrail();

    const {
        offer,
        error,
        isLoading,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
    } = useOfferWrite({ offerId, businessId });
    
    if (isLoading || !offer) return <LoadingScreen />;
    
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferWriteScreen
                offer={offer}
                trails={trails}
                isLoading={isLoading}
                error={error}
                onSubmitOffer={onSubmitPress}
                onDeleteOffer={onRemovePress}
                onUpdateOffer={onUpdatePress}
                onBackPress={onBackPress}
            />
        </>
        
    );
}