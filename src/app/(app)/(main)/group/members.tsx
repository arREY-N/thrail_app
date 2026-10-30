/**
 * @file members.tsx
 * @description Route container for the group members and offer details screen.
 */

import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useGroupItem } from "@/src/core/models/Group/Group";
import { useOfferItem } from "@/src/core/models/Offer/Offer";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { formatGroupName } from "@/src/features/Community/screens/Group/ListScreen";
import { MembersScreen } from "@/src/features/Community/screens/Group/MembersScreen";

export default function Members() {
    const { roomId: rawId } = useLocalSearchParams();
    const roomId = getSearchParam(rawId);
    const { onBackPress } = useAppNavigation();

    const { profile } = useAuthHook();

    const {
        group: currentGroup,
        isLoading: groupLoading,
    } = useGroupItem(roomId);

    const offerId = (currentGroup?.offer as any)?.id || roomId;
    const {
        offer
    } = useOfferItem(offerId);

    if (groupLoading && !currentGroup) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.BACKGROUND }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            </View>
        );
    }

    if (!currentGroup) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.BACKGROUND }}>
                <CustomText variant="body" style={{ color: Colors.TEXT_SECONDARY }}>
                    No group found
                </CustomText>
            </View>
        );
    }

    const headerTitle = formatGroupName(currentGroup, profile);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <MembersScreen
                group={currentGroup}
                offer={offer}
                currentUser={profile}
                headerTitle={headerTitle}
                onBackPress={onBackPress}
            />
        </>
    );
}