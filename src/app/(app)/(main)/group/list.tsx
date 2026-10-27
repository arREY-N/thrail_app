import { Stack } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useGroupList } from "@/src/core/models/Group/Group";
import { useAuthHook } from "@/src/core/models/User/User";
import ListScreen from "@/src/features/Community/screens/Group/ListScreen";


export default function GroupList() {
    const { profile, user } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    const userId = profile?.id || user?.uid || '';
    const {
        groups,
        onEnterRoom
    } = useGroupList(userId);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <ListScreen
                groups={groups}
                currentUser={profile}
                onEnterRoom={onEnterRoom}
                onBackPress={onBackPress}
            />
        </>
    )
}