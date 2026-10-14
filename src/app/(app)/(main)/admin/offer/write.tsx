
import CustomLoading from "@/src/components/CustomLoading";
import { CreateOfferFlow } from "@/src/core/flows/CreateOfferFlow";
import getSearchParam from "@/src/core/utility/getSearchParam";
import OfferWriteScreen from "@/src/features/Admin/screens/Offer/OfferWriteScreen";
import { Stack, useLocalSearchParams } from "expo-router";

export default function WriteOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();

    const offerId = getSearchParam(rawOfferId);

    const {
        offer,
        error,
        isLoading,
        trails,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
        onBackPress,
    } = CreateOfferFlow({ offerId });

    if (isLoading || !offer) return <CustomLoading message="Saving offer" />;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferWriteScreen
                offer={offer}
                trails={trails}
                isLoading={isLoading}
                error={error as string || null}
                onSubmitOffer={onSubmitPress}
                onDeleteOffer={onRemovePress}
                onUpdateOffer={onUpdatePress}
                onBackPress={onBackPress}
            />
        </>

    );
}