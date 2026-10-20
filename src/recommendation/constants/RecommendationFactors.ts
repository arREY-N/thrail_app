/**
 * Centralized Recommendation Hyperparameters & Tuning Factors
 * 
 * Modify the constants in this file to adjust the sensitivity, difficulty spread,
 * and preference behaviors of the recommendation engine without touching core formulas.
 */

export const RecommendationFactors = {
    /**
     * Medical Condition Downshift Factor
     * Applied as a multiplier to physical exertion and terrain difficulty metrics
     * for users reporting any medical concerns (asthma, heart, joint conditions, etc.).
     * E.g. 0.80 means a 20% reduction in physical difficulty targets.
     */
    MEDICAL_CONDITION_FACTOR: 0.80,

    /**
     * Beginner Profile Baselines
     * Used when a hiker has no historical hike selections to establish an anchor baseline.
     */
    BEGINNER: {
        EASY_BASE: 0.25,        // Target low physical effort (~2/9 Lasco)
        DIFFICULT_BASE: 0.75,   // Target high physical effort (~7/9 Lasco)
    },

    /**
     * Experienced Profile Scaling Multipliers
     * Applied to the centroid (mean) vector of the user's matched historical trails.
     */
    EXPERIENCED: {
        EASY_FACTOR: 0.50,       // Cuts average exertion in half for recovery/leisure hikes
        DIFFICULT_FACTOR: 1.35,  // 35% increase above average exertion for stretch challenges
    },

    /**
     * Province & Geographic Allocation Weights
     * Controls the Comfort vs. Exploration trade-off across regions.
     */
    PROVINCE: {
        PREFERRED_WEIGHT: 0.85,   // Comfort affinity score for user-selected provinces
        UNSELECTED_WEIGHT: 0.15,  // Baseline score for unselected provinces
    },

    /**
     * Tourism Amenities Baselines
     * Provides a non-zero baseline prior for vector completeness across 11 amenity features.
     */
    TOURISM: {
        EASY_BASE: 0.20,
        DIFFICULT_BASE: 0.40,
    },

    /**
     * Lasco Scale Normalization Divisor
     * Standard upper bound for the PinoyMountaineer / Lasco difficulty scale.
     */
    LASCO_MAX_RATING: 9.0,
} as const;

// Direct named exports for convenient individual imports
export const MEDICAL_CONDITION_FACTOR = RecommendationFactors.MEDICAL_CONDITION_FACTOR;
export const BEGINNER_EASY_BASE = RecommendationFactors.BEGINNER.EASY_BASE;
export const BEGINNER_DIFFICULT_BASE = RecommendationFactors.BEGINNER.DIFFICULT_BASE;
export const EXPERIENCED_EASY_FACTOR = RecommendationFactors.EXPERIENCED.EASY_FACTOR;
export const EXPERIENCED_DIFFICULT_FACTOR = RecommendationFactors.EXPERIENCED.DIFFICULT_FACTOR;
export const PROVINCE_PREFERRED_WEIGHT = RecommendationFactors.PROVINCE.PREFERRED_WEIGHT;
export const PROVINCE_UNSELECTED_WEIGHT = RecommendationFactors.PROVINCE.UNSELECTED_WEIGHT;
export const TOURISM_EASY_BASE = RecommendationFactors.TOURISM.EASY_BASE;
export const TOURISM_DIFFICULT_BASE = RecommendationFactors.TOURISM.DIFFICULT_BASE;
export const LASCO_MAX_RATING = RecommendationFactors.LASCO_MAX_RATING;
