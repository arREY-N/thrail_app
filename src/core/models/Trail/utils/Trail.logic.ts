import { ITrailSummary, Trail } from "@/src/core/models/Trail/interfaces/Trail.types";

export const TrailLogic = {
    toSummary(trail: Trail): ITrailSummary {
        return {
            id: trail.id,
            name: trail.general.name,
            location: trail.general.province?.join(', ') || trail.general.address || ''
        };
    }
};
