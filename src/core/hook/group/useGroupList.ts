import { GroupRepo, useGroupStore } from "@/src/core/models/Group/Group";
import { router } from "expo-router";
import { useEffect } from "react";

export const useGroupList = (userId: string) => {
    const { groups, setGroups } = useGroupStore();
    
    useEffect(() => {
        if (!userId) return;
        const unsubscribe = GroupRepo.listenToUserGroups(userId, setGroups);
        return () => unsubscribe();
    }, [userId]);

    const onEnterRoom = (groupId: string) => {
        if(groupId){
            router.push({
                pathname: '/(main)/group/room',
                params: { roomId: groupId }
            })
        }
    }
    return { groups, onEnterRoom };
};