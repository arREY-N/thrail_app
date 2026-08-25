// TYPES
export * from "@/src/core/models/Recommendation/interfaces/Recommendation.types";

// FACTORY & CONVERTER
export { 
    newRecommendation, 
    recommendationConverter 
} from "@/src/core/models/Recommendation/utils/RecommendationFactory";

// STORES
export { 
    useRecommendationsStore, 
    useRecommendationStore 
} from "@/src/core/models/Recommendation/stores/recommendationStore";

// HOOKS
export { useRecommendationItem } from "@/src/core/models/Recommendation/hooks/useRecommendationItem";

// REPOSITORIES
export { RecommendationRepo } from "@/src/core/models/Recommendation/repositories/recommendationRepository";

