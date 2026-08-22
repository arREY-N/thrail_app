import { GroupRepo } from "@/src/core/init/repositories";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";
import { router } from "expo-router";
import { useEffect } from "react";

export function useGroupList(userId?: string | null) {
    const groups = useGroupStore(s => s.groups);
    const setGroups = useGroupStore(s => s.setGroups);
    const isLoading = useGroupStore(s => s.isLoading);
    const isFetching = useGroupStore(s => s.isFetching);
    const error = useGroupStore(s => s.error);

    useEffect(() => {
        if (!userId) return;
        const unsubscribe = GroupRepo.listenToUserGroups(userId, setGroups);
        return () => unsubscribe();
    }, [userId, setGroups]);

    const onEnterRoom = (groupId: string) => {
        if (groupId) {
            router.push({
                pathname: '/(main)/group/room',
                params: { roomId: groupId },
            });
        }
    };

    return {
        groups,
        isLoading,
        isFetching,
        error,
        setGroups,
        onEnterRoom,
    };
}
