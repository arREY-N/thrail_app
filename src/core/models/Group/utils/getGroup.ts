import { Group } from "@/src/core/models/Group/interfaces/Group.types";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";

export async function getGroup(groupId: string): Promise<Group> {
    const group = await useGroupStore.getState().fetchGroupById(groupId);
    if (!group) throw new Error(`No group found with ID ${groupId}`)
    return group;
}