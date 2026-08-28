import { Group } from "@/src/core/models/Group/interfaces/Group.types";
import { newGroup } from "@/src/core/models/Group/utils/GroupFactory";

export const updateGroupOnCancellation = (group: Group, removeId: string): Group => {
    return newGroup({
        ...group,
        participantsIds: group.participantsIds.filter(id => id !== removeId),
        members: group.members.filter(member => member.id !== removeId),
        admins: group.admins.filter(admin => admin.id !== removeId),
        updatedAt: new Date(),
        offer: {
            ...group.offer,
            reservedPax: group.offer.reservedPax > 0 ? group.offer.reservedPax - 1 : 0,
        },
    });
};