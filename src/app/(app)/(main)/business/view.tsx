import LoadingScreen from "@/src/app/loading";
import { useBusinessItem } from "@/src/core/models/Business/Business";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";

export default function BusinessView() {
    const { businessId: rawId } = useLocalSearchParams();
    const businessId = getSearchParam(rawId);

    return (
        <BusinessPage businessId={businessId} />
    )
}

const BusinessPage = ({
    businessId
}: { businessId: string }) => {
    const { business, isFetching } = useBusinessItem(businessId);

    if (isFetching && !business) return <LoadingScreen />

    return (
        <ScrollView>
            <Text>Name: {business?.name} </Text>
        </ScrollView>
    )
}