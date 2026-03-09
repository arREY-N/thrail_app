import { Trail } from "@/src/core/models/Trail/Trail";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";

export const TrailLogic = {
    toSummary(trail: Trail): ITrailSummary {
        return{
            id: trail.id,
            name: trail.general.name
        }
    }
}