import { Group } from "@/src/core/models/Group/interfaces/IGroup";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";

// TYPES
export * from "@/src/core/models/Group/interfaces/IGroup";

// FACTORY
export { GroupConverter, newGroup } from "@/src/core/models/Group/GroupFactory";

// REPOSITORY
export { GroupRepo } from "@/src/core/init/repositories";

// STORE ACCESS
export { useGroupStore } from "@/src/core/models/Group/stores/groupStore";

export const getGroupItem = async (groupId: string): Promise<Group | null> => {
    await useGroupStore.getState().fetchGroupById(groupId);
    return useGroupStore.getState().groups.find(group => group.id === groupId) || null;
}

// HOOKS


// UTILITIES
export { updateGroupOnCancellation } from "@/src/core/models/Group/utils/updateGroupOnCancellation";
