/**
 * @file deadbandGate.ts
 * @description Horizontal Distance Deadband & Vertical Elevation Hysteresis Gate.
 * Prevents coarse indoor/multipath fixes (> 25m horizontal or > 18m vertical uncertainty)
 * and stationary drift from accumulating phantom trail lines, distance, or elevation gain.
 */

import { ElevationStepResult } from './gps.types';

/** Maximum horizontal hardware accuracy (m) allowed to commit trail breadcrumbs */
export const MAX_BREADCRUMB_ACCURACY_M = 25.0;

/** Maximum horizontal hardware accuracy (m) allowed to accumulate 3D elevation gain/loss */
export const MAX_ELEVATION_ACCURACY_M = 18.0;

/** Minimum vertical change (m) required to register elevation gain/loss */
export const ELEVATION_DEADBAND_M = 3.0;

/** Maximum single-step vertical change (m) before resetting baseline as a barometer/GPS spike */
export const MAX_ELEVATION_SPIKE_M = 35.0;

/**
 * Determines whether the first point of a route segment is accurate enough to anchor the trail line.
 * Rejects coarse indoor Wi-Fi/cell triangulation (> 25m) or stationary indoor drift.
 */
export function shouldCommitFirstPoint(
    hwAccuracy: number,
    isStationary: boolean = false
): boolean {
    if (hwAccuracy > MAX_BREADCRUMB_ACCURACY_M) {
        return false;
    }
    // Allow immediate first-point commit outdoors when GPS lock is tight (<= 15m),
    // or when the user is actively moving with acceptable accuracy (<= 25m).
    if (hwAccuracy <= 15.0) {
        return true;
    }
    return !isStationary;
}

/**
 * Computes the minimum horizontal displacement (in meters) required to commit a new breadcrumb.
 * Scales dynamically with true hardware accuracy (`rawAccuracy`).
 */
export function computeHorizontalDeadbandMeters(
    hwAccuracy: number,
    validSpeed?: number
): number {
    const isConfirmedMoving = validSpeed !== undefined && validSpeed >= 0.5;
    if (isConfirmedMoving) {
        return Math.max(4.0, Math.min(12.0, hwAccuracy * 0.75));
    }
    return Math.max(6.0, Math.min(18.0, hwAccuracy * 1.1));
}

/**
 * Evaluates a 3D altitude reading against the current elevation baseline using
 * a 3.0m hysteresis deadband, gated by horizontal accuracy and stationarity.
 */
export function evaluateElevationStep(
    currAlt: number | undefined | null,
    currentBaseline: number | null,
    hwAccuracy: number,
    isStationary: boolean = false
): ElevationStepResult {
    const hasValidAlt =
        typeof currAlt === 'number' &&
        !isNaN(currAlt) &&
        isFinite(currAlt) &&
        currAlt !== 0;

    if (!hasValidAlt || isStationary || hwAccuracy > MAX_ELEVATION_ACCURACY_M) {
        return {
            nextBaseline: currentBaseline,
            gainDelta: 0,
            lossDelta: 0,
        };
    }

    if (typeof currentBaseline !== 'number' || isNaN(currentBaseline)) {
        return {
            nextBaseline: currAlt,
            gainDelta: 0,
            lossDelta: 0,
        };
    }

    const altDiff = currAlt - currentBaseline;

    if (altDiff >= ELEVATION_DEADBAND_M && altDiff < MAX_ELEVATION_SPIKE_M) {
        return {
            nextBaseline: currAlt,
            gainDelta: altDiff,
            lossDelta: 0,
        };
    }

    if (altDiff >= MAX_ELEVATION_SPIKE_M || altDiff <= -MAX_ELEVATION_SPIKE_M) {
        // Sensor spike / 3D re-anchor (> 35m jump): reset baseline without adding phantom gain/loss
        return {
            nextBaseline: currAlt,
            gainDelta: 0,
            lossDelta: 0,
        };
    }

    if (altDiff <= -ELEVATION_DEADBAND_M) {
        return {
            nextBaseline: currAlt,
            gainDelta: 0,
            lossDelta: Math.abs(altDiff),
        };
    }

    return {
        nextBaseline: currentBaseline,
        gainDelta: 0,
        lossDelta: 0,
    };
}
