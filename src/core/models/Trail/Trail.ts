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
export { TrailLogic } from "@/src/core/models/Trail/utils/Trail.logic";
export {
    default as computeTotalLength,
    geoJSONToCoordinate
} from "@/src/core/models/Trail/utils/TrailComputation";

// STORES
export {
    useTrailStore,
    useTrailsStore
} from "@/src/core/models/Trail/stores/trailStore";

// HOOKS
export { useTrail } from "@/src/core/models/Trail/hooks/useTrail";
export { useTrailItem } from "@/src/core/models/Trail/hooks/useTrailItem";
export { useTrailList } from "@/src/core/models/Trail/hooks/useTrailList";

// REPOSITORIES
export { TrailRepo } from "@/src/core/init/repositories";
export { TrailRepository } from "@/src/core/models/Trail/repositories/TrailRepository";
