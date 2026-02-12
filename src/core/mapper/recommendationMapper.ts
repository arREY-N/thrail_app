import { RecommendationDB, RecommendationUI, RecommendedTrailDB, RecommendedTrailUI } from "@/src/types/entities/Recommendation";

export const RecommendationMapper = {
    toUI(data: RecommendationDB): RecommendationUI {
        return {
            id: data.id,
            trails: data.trails.map(t => RecommendedTrailMapper.toUI(t))
        }
    },
    toDB(data: RecommendationUI): RecommendationDB {
        return {
            id: data.id,
            trails: data.trails.map(t => RecommendedTrailMapper.toDB(t))
        }
    }
}

export const RecommendedTrailMapper = {
    toUI(data: RecommendedTrailDB): RecommendedTrailUI {
        return {
            id: data.id,
            trailId: data.trail.id,
            trailName: data.trail.name,
            score: data.score,
            status: data.status,
        }
    },
    toDB(data: RecommendedTrailUI): RecommendedTrailDB {
        return {
            id: data.id,
            trail: {
                id: data.trailId,
                name: data.trailName,
            },
            score: data.score,
            status: data.status,
        }
    }
}