import { Group, GroupRepo, IGroupMember, newGroup, useGroup, useGroupItem } from "@/src/core/models/Group/Group";
import { OfferRepo } from "@/src/core/models/Offer/Offer";
import { logger } from "@/src/core/utility/errorFormatter";

export function HandleGroupMemberFlow() {
    const { createGroup, isWriting } = useGroup();
    const { getGroupById } = useGroupItem();

    const onAddMemberToGroup = async (user: IGroupMember, groupId: string) => {
        logger('HandleGroupMemberFlow', 'Adding new member: ', user);

        let group: Group | null = null;
        try {
            group = await getGroupById(groupId);
        } catch {
            // Ignore cache error, fallback to direct fetch
        }

        if (!group) {
            try {
                group = await GroupRepo.fetchGroup(groupId);
            } catch {
                logger('HandleGroupMemberFlow', `Group ${groupId} not found directly in Firestore. Attempting healing...`);
            }
        }

        if (!group) {
            // Self-healing: if group doesn't exist for this offer, heal it from offer
            const offer = await OfferRepo.fetch(groupId);
            if (offer) {
                const groupBlueprint = newGroup({
                    id: offer.id,
                    admins: offer.business ? [{
                        id: offer.business.id,
                        username: offer.business.name,
                        firstname: offer.business.name,
                        lastname: '',
                        email: '',
                    }] : [],
                    participantsIds: [user.id],
                    members: [user],
                    business: offer.business,
                    trail: offer.trail,
                    offer: {
                        id: offer.id,
                        date: offer.date,
                        documents: offer.documents,
                        schedule: offer.schedule,
                        endDate: offer.endDate,
                        duration: offer.duration,
                        price: offer.price,
                        maxPax: offer.maxPax,
                        minPax: offer.minPax,
                        reservedPax: offer.reservedPax,
                        inclusions: offer.inclusions,
                        thingsToBring: offer.thingsToBring,
                        reminders: offer.reminders,
                        description: offer.description,
                    },
                    status: 'active',
                });
                await createGroup(groupBlueprint);
                logger('HandleGroupMemberFlow', 'Healed and created missing group for offer: ', groupId);
                return;
            } else {
                throw new Error(`Group with ID ${groupId} not found.`);
            }
        }

        if (group.participantsIds?.includes(user.id)) {
            logger('HandleGroupMemberFlow', `User ${user.id} is already in group ${groupId}`);
            return;
        }

        const updatedGroup: Group = newGroup({
            ...group,
            participantsIds: [...(group.participantsIds || []), user.id],
            members: [...(group.members || []), user],
        });

        logger('HandleGroupMemberFlow', 'Updated Group Chat: ', updatedGroup);
        await createGroup(updatedGroup);
    }

    const onRemoveMemberToGroup = async ({ userId, groupId }: { userId: string, groupId: string }) => {
        logger('HandleGroupMemberFlow', 'Removing user from group: ', userId);

        let group = await getGroupById(groupId);
        if (!group) {
            try {
                group = await GroupRepo.fetchGroup(groupId);
            } catch {
                // Ignore
            }
        }

        if (!group) {
            logger('HandleGroupMemberFlow', `Group with ID ${groupId} not found. Skipping member removal.`);
            return;
        }

        if (!group.participantsIds || !group.participantsIds.find(u => u === userId)) {
            logger('HandleGroupMemberFlow', `User ${userId} not found in group ${groupId}. Skipping member removal.`);
            return;
        }

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