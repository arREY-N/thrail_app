import { Group } from "@/src/core/models/Group/interfaces/IGroup";

export const getGroupName = (group: Group): string => {
    return `${group.trail.name}_${group.business.name}_${group.offer.date.toISOString().split('T')[0]}`;
} 