import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useGroupItem } from "@/src/core/models/Group/Group";

import { Offer, useOfferItem } from "@/src/core/models/Offer/Offer";
import { IUserSummary, useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { formatGroupName } from "@/src/features/Community/screens/Group/ListScreen";

export default function Members() {
    const { roomId: rawId } = useLocalSearchParams();
    const roomId = getSearchParam(rawId);
    const { onBackPress } = useAppNavigation();

    const { profile } = useAuthHook();

    const {
        group: currentGroup,
    } = useGroupItem(roomId);

    const {
        offer
    } = useOfferItem(roomId);

    if (!currentGroup) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No group found</Text>
            </View>
        )
    }

    const headerTitle = formatGroupName(currentGroup, profile);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <GroupDetails
                headerTitle={headerTitle}
                members={[...currentGroup.admins, ...currentGroup.members]}
                offer={offer}
            />
        </>
    );
}

const GroupDetails = ({
    headerTitle,
    members,
    offer,
}: {
    headerTitle: string,
    members: IUserSummary[],
    offer?: Offer | null
}) => {
    console.log(offer);
    return (
        <View>
            <Text>{headerTitle} </Text>
            {offer && (
                <View>
                    <Text>Date: {offer.date.toLocaleDateString()} </Text>
                    <Text>Trail: {offer.trail.name} </Text>
                </View>
            )}
            {members.length > 0 && members.map(m => {
                return (
                    <View key={m.id}>
                        <Text>{m.username}</Text>
                    </View>
                )
            })}

        </View>
    )
}