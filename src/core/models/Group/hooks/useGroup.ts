import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";

export function useGroup() {
    const createGroup = useGroupStore(s => s.createGroup);
    const joinGroup = useGroupStore(s => s.joinGroup);
    const sendMessage = useGroupStore(s => s.sendMessage);
    const markAsRead = useGroupStore(s => s.markAsRead);
    const markGroupAsVisited = useGroupStore(s => s.markGroupAsVisited);
    const checkGroupExists = useGroupStore(s => s.checkGroupExists);
    const isLoading = useGroupStore(s => s.isLoading);
    const isFetching = useGroupStore(s => s.isFetching);
    const isWriting = useGroupStore(s => s.isWriting);
    const error = useGroupStore(s => s.error);

    return {
        createGroup,
        joinGroup,
        sendMessage,
        markAsRead,
        markGroupAsVisited,
        checkGroupExists,
        isLoading,
        isWriting,
        isFetching,
        error,
    };
}
