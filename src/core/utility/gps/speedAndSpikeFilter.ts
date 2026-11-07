/**
 * @file speedAndSpikeFilter.ts
 * @description Speed Plausibility Gating & In-Place 3-Point Rolling Spike Pruning.
 * Detects impossible velocity jumps and removes acute hairpin multipath excursions (A -> B -> C).
 */

import { SpikeEvaluationResult } from './gps.types';
import { computeTurnCosine, haversineMeters } from './gpsGeometry';

/**
 * Checks whether a displacement step is physically plausible for a hiker.
 * Rejects single-step teleports (> maxSpeedMps) as well as moderate jumps
 * that directly contradict a stationary GNSS Doppler speed reading.
 */
export function isVelocityPlausible(
    distMeters: number,
    timeDeltaSec: number,
    maxSpeedMps: number = 7.5,
    validSpeed?: number
): boolean {
    const safeDt = Math.max(0.5, timeDeltaSec);
    const impliedSpeedMps = distMeters / safeDt;

    if (impliedSpeedMps > maxSpeedMps && distMeters > 10) {
        return false;
    }

    // Doppler-vs-displacement consistency gate:
    // If hardware Doppler explicitly reports near-zero velocity (< 0.35 m/s),
    // a sudden > 8m jump at > 2.2 m/s is a cell-tower / multipath reflection shift.
    if (
        validSpeed !== undefined &&
        validSpeed < 0.35 &&
        distMeters > 8.0 &&
        impliedSpeedMps > 2.2
    ) {
        return false;
    }

    return true;
}

/**
 * Evaluates the last 3 vertices (A -> B -> C) in O(1) time for hairpin multipath spikes.
 * - If B was a sideways multipath spike and C returned closer to A (distAC < distAB),
 *   returns PRUNE_VERTEX_B so vertex B is replaced in-place by C and false distance is rolled back.
 * - If C itself is a sudden bounce away, returns DROP_VERTEX_C.
 */
export function evaluateThreePointSpike(
    latA: number,
    lonA: number,
    latB: number,
    lonB: number,
    latC: number,
    lonC: number,
    timeDeltaSec: number,
    hwAccuracy: number,
    speedMps: number
): SpikeEvaluationResult {
    const distAB = haversineMeters(latA, lonA, latB, lonB);
    const distAC = haversineMeters(latA, lonA, latC, lonC);

    if (timeDeltaSec < 15) {
        const turnCos = computeTurnCosine(latA, lonA, latB, lonB, latC, lonC);

        // Acute hairpin reversal (< ~36 degrees interior angle, cosTheta < -0.80)
        if (turnCos < -0.80) {
            // Case 1: Vertex B was the outlier excursion and C snapped back toward the true path near A
            if (distAC < distAB) {
                return {
                    action: 'PRUNE_VERTEX_B',
                    distAB,
                    distAC,
                    distanceDelta: distAC - distAB,
                };
            }

            // Case 2: Vertex C is an instantaneous multipath bounce under degraded accuracy or high speed
            if (hwAccuracy > 8 || speedMps > 2.0) {
                return {
                    action: 'DROP_VERTEX_C',
                    distAB,
                    distAC,
                    distanceDelta: 0,
                };
            }
        }
    }

    return {
        action: 'KEEP_ALL',
        distAB,
        distAC,
        distanceDelta: 0,
    };
}
