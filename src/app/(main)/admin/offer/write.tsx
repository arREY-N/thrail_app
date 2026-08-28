
import LoadingScreen from "@/src/app/loading";
import { CreateOfferFlow } from "@/src/core/flows/CreateOfferFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailList } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import OfferWriteScreen from "@/src/features/Admin/screens/Offer/OfferWriteScreen";
import { Stack, useLocalSearchParams } from "expo-router";

export default function WriteOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();
    const { businessId } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const offerId = getSearchParam(rawOfferId);

    const {
        trails
    } = useTrailList();

    const {
        offer,
        error,
        isLoading,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
    } = CreateOfferFlow({ offerId, businessId });

    if (isLoading || !offer) return <LoadingScreen />;

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