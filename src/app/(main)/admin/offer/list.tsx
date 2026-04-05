import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

import useAdminOffer from "@/src/core/hook/admin/useAdminOffer";
import useAdminNavigation from "@/src/core/hook/navigation/useAdminNavigation";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import getSearchParam from "@/src/core/utility/getSearchParam";

import OfferListScreen from "@/src/features/Admin/screens/Offer/OfferListScreen";

export default function adminOfferList() {
    const { businessId: rawId } = useLocalSearchParams();
    const id = getSearchParam(rawId);

    const { onBackPress } = useAppNavigation();

    const {
        onWriteOffer,
    } = useAdminNavigation({ businessId: id });

    const { 
        isLoading,
        error,
        businessOffers,
    } = useAdminOffer({ businessId: id });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            
            <OfferListScreen 
                offers={businessOffers || []}
                isLoading={isLoading}
                error={error}
                onAddOffer={() => onWriteOffer(null)} 
                onEditOffer={(offerId: string) => onWriteOffer(offerId)}
                onBackPress={onBackPress}
            />
        </>
    );
}