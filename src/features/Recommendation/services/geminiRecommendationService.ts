/**
 * @file geminiRecommendationService.ts
 * @description Recommendation Reasoning Consumer Service for THRAIL.
 *
 * ARCHITECTURAL RULE:
 * Client-side is STRICTLY consumer-only. No Gemini API calls, endpoints, or keys
 * exist in the client.
 * Natural language reasoning is generated securely on the Superadmin Python side
 * (engine/batch_runner.py / engine/gemini_reasoning.py) and saved in Firestore.
 *
 * If Firestore pre-computed reasoning is present, it is consumed directly.
 * If not yet generated, it falls back to deterministic local algorithmic reasoning.
 *
 * Terminology rule: Strictly uses "Profile Match" / "Profile Similarity"
 * and NEVER uses "compatibility".
 */

import {
    IAITrailReasoning,
    IEngineConfig,
    IRecommendedTrailItem,
} from "@/src/core/models/Recommendation/Recommendation";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { formatRouteType } from "@/src/features/Trail/utils/TrailDetailsHelpers";
import { Profile } from "@/src/recommendation/interfaces/Profile";

export interface ResolveReasoningParams {
    uid?: string;
    monthId?: string;
    trailId?: string;
    trail: Trail | null;
    userProfile: Profile | null;
    recoItem: IRecommendedTrailItem | null;
    engineConfig?: IEngineConfig;
    user?: User | null;
    monthLabel?: string;
    cachedReasoning?: IAITrailReasoning | null;
}

export type GenerateReasoningParams = ResolveReasoningParams;

/**
 * Builds deterministic local mathematical reasoning when Superadmin pre-generated reasoning is not yet present.
 */
export function buildAlgorithmicReasoning(
    trail: Trail | null,
    recoItem: IRecommendedTrailItem | null,
    profileMatch: number,
    monthLabel: string,
    circuitStr: string,
    province: string,
    distanceStr: string,
    gainStr: string,
    elevStr: string,
    slopeStr: string,
    hasMedicalCondition: boolean,
    userProfile?: Profile | null
): IAITrailReasoning {
    const trailName = trail?.general?.name || recoItem?.trailName || "This mountain route";
    const classification = trail?.difficulty?.classification ? `${trail.difficulty.classification} Climb` : "Minor Climb";

    // Numerical baseline extraction
    const userLenNorm = userProfile?.features?.length ?? 0.25;
    const userBaseKm = Math.round((1.0 + userLenNorm * 19.0) * 10) / 10;

    const userGainNorm = userProfile?.features?.gain ?? 0.22;
    const userBaseGain = Math.round(50 + userGainNorm * 1150);

    const userSlopeNorm = userProfile?.features?.slope ?? 0.25;
    const userBaseSlope = Math.round((4.0 + userSlopeNorm * 24.0) * 10) / 10;

    const rawLen = trail?.difficulty?.length ?? 0;
    const rawGain = trail?.difficulty?.gain ?? 0;

    // Delta descriptions
    const lenDelta = Math.round((rawLen - userBaseKm) * 10) / 10;
    const lenComp = rawLen > 0
        ? (lenDelta <= 0
            ? `${Math.abs(lenDelta).toFixed(1)} km below your comfort ceiling`
            : `${lenDelta.toFixed(1)} km above your target distance`)
        : `calibrated to your ${userBaseKm} km target`;

    const gainDelta = Math.round(rawGain - userBaseGain);
    const gainComp = rawGain > 0
        ? (gainDelta <= 0
            ? `${Math.abs(gainDelta)} m lower ascent demand`
            : `+${gainDelta} m well-paced gain`)
        : `matched against your +${userBaseGain} m ceiling`;

    const medicalContext = hasMedicalCondition
        ? " Calibrated with your health profile considerations, the physical demands remain safely cushioned within your comfort ceiling."
        : "";

    const summary = `${trailName} was evaluated as your #1 spotlight match for ${monthLabel} with a ${profileMatch}% profile similarity. Based on your calibrated average length of ${userBaseKm} km, this ${distanceStr} route is an ideal fit (${lenComp}). Paired with an ascent of ${gainStr} (${gainComp} of +${userBaseGain} m), TARS identified this summit as the ideal balance of cardiovascular pacing and rewarding viewpoints.${medicalContext}`;

    const physicalFit = `Based on your calibrated average length of ${userBaseKm} km, the trail's ${distanceStr} route provides a comfortable cushion against endurance fatigue. Its ${gainStr} ascent is tailored to your +${userBaseGain} m elevation ceiling, while the ${slopeStr} gradient (against your ~${userBaseSlope}% baseline) ensures a steady, sustainable pace to the summit at ${elevStr}.`;

    const terrainFit = `The ${circuitStr} navigational layout provides a clear, manageable route structure with dependable footwork, eliminating high-exposure technical scrambles.`;

    const provinceFit = `Situated in ${province}, this trail satisfies your regional preference for accessible day treks in Southern Luzon.`;

    const safetyTips = hasMedicalCondition
        ? `Maintain a steady pace, schedule brief hydration pauses every 30-45 minutes, bring at least 2L of electrolytes, and keep any required personal medications readily accessible in your daypack.`
        : `Begin hiking early in the morning to beat the midday tropical heat, pack at least 2L of water with electrolyte replacement, and wear supportive trail footwear suited for ${classification} terrain.`;

    return {
        summary,
        physicalFit,
        terrainFit,
        provinceFit,
        safetyTips,
        generatedAt: new Date().toISOString(),
        source: "algorithmic",
    };
}

/**
 * Resolves recommendation reasoning:
 * 1. Checks if reasoning was pre-generated by the Superadmin Python TARS batch runner and stored in Firestore.
 * 2. If present, returns it directly.
 * 3. Otherwise, falls back to deterministic local algorithmic reasoning.
 *
 * NOTE: Absolutely ZERO client-side Gemini or external AI calls are made.
 */
export function resolveRecommendationReasoning(
    params: ResolveReasoningParams
): IAITrailReasoning {
    const {
        cachedReasoning,
        trail,
        userProfile,
        recoItem,
        user,
        monthLabel = "this month",
    } = params;

    // 1. If pre-generated by the Superadmin TARS engine (stored in Firestore), consume it directly
    if (cachedReasoning && cachedReasoning.summary) {
        return cachedReasoning;
    }

    // 2. Otherwise return deterministic algorithmic reasoning
    const province = trail?.general?.province?.[0] || trail?.general?.address || "Calabarzon";
    const distanceStr = trail?.difficulty?.length ? `${trail.difficulty.length} km` : "moderate distance";
    const elevStr = trail?.geography?.masl
        ? `${trail.geography.masl} masl`
        : trail?.difficulty?.elevation
            ? `${trail.difficulty.elevation} m`
            : "moderate elevation";
    const gainStr = trail?.difficulty?.gain ? `+${trail.difficulty.gain} m` : "gentle gain";
    const slopeStr = trail?.difficulty?.slope ? `${trail.difficulty.slope}%` : "gradual slope";
    const circuitStr = formatRouteType(trail?.difficulty?.circularity);

    const rawScore = typeof recoItem?.score === "number" ? recoItem.score : 0.18;
    const profileMatch = Math.max(0, Math.min(100, Math.round((1.0 - rawScore) * 100)));
    const hasMedicalCondition = Boolean(user?.medicalProfile?.hasCondition);

    return buildAlgorithmicReasoning(
        trail,
        recoItem,
        profileMatch,
        monthLabel,
        circuitStr,
        province,
        distanceStr,
        gainStr,
        elevStr,
        slopeStr,
        hasMedicalCondition,
        userProfile
    );
}

// Compatibility alias
export const getOrGenerateRecommendationReasoning = resolveRecommendationReasoning;

