// TYPES
export * from "@/src/core/models/Trail/interfaces/Trail.types";

// FACTORY & CONVERTER
export {
    newTrail,
    trailConverter
} from "@/src/core/models/Trail/utils/TrailFactory";

// UTILITIES
export {
    clearStatsCache,
    getIndexedMountains,
    getStatsForMountain
} from "@/src/core/models/Trail/utils/GeoJSONProcessor";
export {
    getTrailImage
} from "@/src/core/models/Trail/utils/GetTrailImage";
export { TrailLogic } from "@/src/core/models/Trail/utils/Trail.logic";
export {
    default as computeTotalLength,
    geoJSONToCoordinate
} from "@/src/core/models/Trail/utils/TrailComputation";

// STORES
export {
    useTrailsStore, useTrailStore
} from "@/src/core/models/Trail/stores/trailStore";

// HOOKS
export { useTrailItem } from "@/src/core/models/Trail/hooks/useTrailItem";
export { useTrailList } from "@/src/core/models/Trail/hooks/useTrailList";
export { useTrailNavigation } from "@/src/core/models/Trail/hooks/useTrailNavigation";
export { useTrailStats } from "@/src/core/models/Trail/hooks/useTrailStats";
export { useTrailWrite } from "@/src/core/models/Trail/hooks/useTrailWrite";
// REPOSITORIES
export { TrailRepo } from "@/src/core/models/Trail/repositories/TrailRepository";

