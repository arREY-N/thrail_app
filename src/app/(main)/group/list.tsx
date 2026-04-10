import { Stack } from "expo-router";
import React from 'react';

import { useGroupList } from "@/src/core/hook/group/useGroupList";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import GroupListScreen from "@/src/features/Community/screens/GroupListScreen";


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

            <GroupListScreen
                groups={groups}
                currentUser={profile}
                onEnterRoom={onEnterRoom}
                onBackPress={onBackPress}
            />
        </>

        // <>
        //     <Stack.Screen options={{ title: 'Your Groups', headerShown: true }}/>
        //     <TestGroupList
        //         groups={groups}
        //         onEnterRoom={onEnterRoom}
        //     />
        // </>
    )
}

// export type GroupListParams = {
//     groups: Group[];
//     onEnterRoom: (groupId: string) => void;
// }

// export const TestGroupList = (params: GroupListParams) => {
//     console.log('Groups:', params.groups);  

//     return (
//         <ScrollView>
//             <Text>Group List</Text>
//             {(params.groups || []).map(group => (
//                 <Pressable key={group.id} onPress={() => params.onEnterRoom(group.id)}>
//                      <Text>{group.GroupName}</Text>
//                 </Pressable>
//             ))}
//         </ScrollView>
//     )
// }