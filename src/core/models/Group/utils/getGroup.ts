import { Group } from "@/src/core/models/Group/interfaces/Group.types";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";

export async function getGroup(groupId: string): Promise<Group | void> {
    const group = await useGroupStore.getState().fetchGroupById(groupId);
    return group;
}