import { IBaseDomainHook } from "@/src/core/interface/domainHookInterface";
import { Recommendation } from "@/src/core/models/Recommendation/Recommendation";
import { Trail } from "@/src/core/models/Trail/Trail";
import { useRecommendationsStore } from "@/src/core/stores/recommendationsStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useEffect } from "react";

export interface IRecommendationDomain extends IBaseDomainHook {
    /** Access the monthly recommendation document containing 
     * a list of trail ID and its recommendation score */
    recommendation: Recommendation | null;

    /** Access the list of current trail recommendations */
    recommendedTrails: Trail[];
}

export type UseRecommendationParams = {
    userId?: string,
    recommendationId?: string, 
}

/**
 * @param {UseRecommendationParams} params - Recommendation defaults 
 * to current month unless provided with specific ID 
 * @returns - Access to populated recommended trails and the recommendation
 * document 
 */
export default function useRecommendation(params: UseRecommendationParams = {}): IRecommendationDomain {
    const { userId, recommendationId, } = params;
    
    const loadRecommendation = useRecommendationsStore(s => s.load);
    const loadRecommendedTrails = useTrailsStore(s => s.setRecommendedTrail);

    const recommendation = useRecommendationsStore(s => s.current);
    const isLoading = useRecommendationsStore(s => s.isLoading);
    const error = useRecommendationsStore(s => s.error);

    const recommendedTrails = useTrailsStore(s => s.recommendedTrail);

    useEffect(() => {
        if(userId) loadRecommendation(userId)
    }, [userId])

    useEffect(() => {
        if(recommendation) loadRecommendedTrails(recommendation.trails);
    }, [recommendation])

    return {
        recommendation,
        isLoading,
        error,
        recommendedTrails,
    }

}