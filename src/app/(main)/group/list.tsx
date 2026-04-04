import { useGroupList } from "@/src/core/hook/group/useGroupList";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Group } from "@/src/core/models/Group/Group";
import { Stack } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";

export default function groupList() {
    const { profile } = useAuthHook();
    const {
        groups,
        onEnterRoom
    } = useGroupList(profile?.id || '' );

    return(
        <>
            <Stack.Screen options={{ title: 'Your Groups', headerShown: true }}/>
            <TestGroupList
                groups={groups}
                onEnterRoom={onEnterRoom}
            />
        </>
    )
}

export type GroupListParams = {
    groups: Group[];
    onEnterRoom: (groupId: string) => void;
}

export const TestGroupList = (params: GroupListParams) => {
    console.log('Groups:', params.groups);  

    return (
        <ScrollView>
            <Text>Group List</Text>
            {(params.groups || []).map(group => (
                <Pressable key={group.id} onPress={() => params.onEnterRoom(group.id)}>
                     <Text>{group.GroupName}</Text>
                </Pressable>
            ))}
        </ScrollView>
    )
}