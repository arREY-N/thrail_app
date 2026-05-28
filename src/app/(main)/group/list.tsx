import { Stack } from "expo-router";
import React from 'react';

import { useGroupList } from "@/src/core/hook/group/useGroupList";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import ListScreen from "@/src/features/Community/screens/Group/ListScreen";


export default function groupList() {
    const { profile } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    const {
        groups,
        onEnterRoom
    } = useGroupList(profile?.id || '' );

    return(
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