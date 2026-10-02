import { Group, IGroupMember, newGroup, useGroup, useGroupItem } from "@/src/core/models/Group/Group";
import { logger } from "@/src/core/utility/errorFormatter";

export function HandleGroupMemberFlow() {
    const { createGroup, isWriting } = useGroup();
    const { getGroupById } = useGroupItem();

    const onAddMemberToGroup = async (user: IGroupMember, groupId: string) => {
        logger('HandleGroupMemberFlow', 'Adding new member: ', user);

        const group = await getGroupById(groupId);

        if (!group) throw new Error(`Group with ID ${groupId} not found.`);

        const updatedGroup: Group = newGroup({
            ...group,
            participantsIds: [...group.participantsIds, user.id],
            members: [...group.members, user],
        });

        logger('HandleGroupMemberFlow', 'Updated Group Chat: ', updatedGroup);
        await createGroup(updatedGroup);
    }

    const onRemoveMemberToGroup = async ({ userId, groupId }: { userId: string, groupId: string }) => {
        logger('HandleGroupMemberFlow', 'Removing user from group: ', userId);

        const group = await getGroupById(groupId);

        if (!group) throw new Error(`Group with ID ${groupId} not found.`);

        if (!group.participantsIds.find(u => u === userId))
            throw new Error(`User ${userId} not found in group ${groupId}`);

        const updatedGroup: Group = newGroup({
            ...group,
            participantsIds: group.participantsIds.filter(u => u !== userId),
            members: group.members.filter(m => m.id !== userId),
        })

        logger('HandleGroupMemberFlow', 'Updated Group Chat: ', updatedGroup);
        await createGroup(updatedGroup);
    }

    return {
        onAddMemberToGroup,
        onRemoveMemberToGroup,
        isWriting
    }
}