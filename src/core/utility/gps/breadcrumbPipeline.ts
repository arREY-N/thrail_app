/**
 * @file breadcrumbPipeline.ts
 * @description Clean coordinator for committing filtered GPS coordinates to a hike session's
 * walkedRoute, totalDistance, and totalElevationGain/Loss.
 *
 * Orchestrates:
 *   1. ZUPT Auto-Pause & Hardware Accuracy Gate (`deadbandGate.ts`)
 *   2. Accuracy-Scaled Horizontal Deadband (`deadbandGate.ts`)
 *   3. Velocity Plausibility & In-Place 3-Point Rolling Spike Pruning (`speedAndSpikeFilter.ts`)
 *   4. Live O(1) Collinear Vertex Merging (`polylineSimplifier.ts`)
 *   5. 3.0m Hysteresis Elevation Gain/Loss Gate (`deadbandGate.ts`)
 */

import type { Location } from '@/src/core/models/Location/Location';
import {
    computeHorizontalDeadbandMeters,
    evaluateElevationStep,
    MAX_BREADCRUMB_ACCURACY_M,
    shouldCommitFirstPoint,
} from './deadbandGate';
import { haversineMeters } from './gpsGeometry';
import { shouldMergeCollinearVertex } from './polylineSimplifier';
import { evaluateThreePointSpike, isVelocityPlausible } from './speedAndSpikeFilter';

export interface BreadcrumbMutableState {
    walkedRoute: [number, number][][];
    coordinates: Location[];
    isSegmentFirstPoint?: boolean;
    elevationBaseline?: number | null;
    totalDistance: number;
    totalElevationGain: number;
    totalElevationLoss?: number;
}

const MAX_HIKE_SPEED_MPS = 7.5; // ~27 km/h maximum plausible mountain sprint

/**
 * Evaluates and commits a Location coordinate into the hike session state.
 * Returns `true` if the coordinate was committed (or merged/pruned in-place), `false` if gated out.
 */
export function applyBreadcrumbPipeline(
    state: BreadcrumbMutableState,
    coordinate: Location
): boolean {
    if (!Array.isArray(state.walkedRoute)) {
        state.walkedRoute = [];
    }

    let currentSegment = state.walkedRoute[state.walkedRoute.length - 1];
    if (!currentSegment) {
        currentSegment = [];
        state.walkedRoute.push(currentSegment);
    }

    const hwAccuracy =
        typeof coordinate.rawAccuracy === 'number' && coordinate.rawAccuracy > 0
            ? coordinate.rawAccuracy
            : typeof coordinate.accuracy === 'number' && coordinate.accuracy > 0
              ? coordinate.accuracy
              : 8.0;

    const reportedSpeed =
        typeof coordinate.speed === 'number' && coordinate.speed >= 0
            ? coordinate.speed
            : undefined;

    const isStationary = coordinate.isStationary === true;

    const currAlt = coordinate.altitude;
    const hasValidAlt =
        typeof currAlt === 'number' &&
        !isNaN(currAlt) &&
        isFinite(currAlt) &&
        currAlt !== 0;

    // 1. First-Point Segment Anchor Gate
    // Do not anchor the start of the trail line on a coarse (> 25m) indoor cell/Wi-Fi fix
    if (state.isSegmentFirstPoint || state.coordinates.length === 0 || currentSegment.length === 0) {
        if (!shouldCommitFirstPoint(hwAccuracy, isStationary)) {
            return false;
        }
        state.isSegmentFirstPoint = false;
        state.elevationBaseline = hasValidAlt && hwAccuracy <= 18 ? currAlt : null;
        state.coordinates.push(coordinate);
        currentSegment.push([coordinate.longitude, coordinate.latitude]);
        return true;
    }

    // Seed elevationBaseline as soon as a high-confidence 3D fix arrives
    if (
        hasValidAlt &&
        hwAccuracy <= 18 &&
        (typeof state.elevationBaseline !== 'number' || isNaN(state.elevationBaseline))
    ) {
        state.elevationBaseline = currAlt;
    }

    // 2. ZUPT Auto-Pause & Hardware Accuracy Gate
    // Never draw breadcrumbs or accumulate distance while ZUPT-stationary or when GPS accuracy > 25m
    if (isStationary || hwAccuracy > MAX_BREADCRUMB_ACCURACY_M) {
        return false;
    }

    const lastCoord = state.coordinates[state.coordinates.length - 1];
    if (
        !lastCoord ||
        typeof lastCoord.latitude !== 'number' ||
        typeof lastCoord.longitude !== 'number'
    ) {
        return false;
    }

    // 3. Accuracy-Scaled Horizontal Distance Deadband Gate
    const distMeters = haversineMeters(
        lastCoord.latitude,
        lastCoord.longitude,
        coordinate.latitude,
        coordinate.longitude
    );

    const minCommitDist = computeHorizontalDeadbandMeters(hwAccuracy, reportedSpeed);
    if (distMeters < minCommitDist) {
        return false;
    }

    // 4. Speed Plausibility & Doppler Consistency Gate
    const lastTime = lastCoord.timestamp ? new Date(lastCoord.timestamp).getTime() : 0;
    const currTime = coordinate.timestamp ? new Date(coordinate.timestamp).getTime() : Date.now();
    const timeDeltaSec =
        lastTime > 0 && currTime > lastTime
            ? Math.max(1, (currTime - lastTime) / 1000)
            : 2;
    const speedMps = distMeters / timeDeltaSec;

    if (!isVelocityPlausible(distMeters, timeDeltaSec, MAX_HIKE_SPEED_MPS, reportedSpeed)) {
        console.warn(
            `[breadcrumbPipeline] Discarded implausible GPS jump: ${distMeters.toFixed(1)}m in ${timeDeltaSec.toFixed(1)}s (${(speedMps * 3.6).toFixed(1)} km/h)`
        );
        return false;
    }

    // 5. In-Place 3-Point Rolling Spike Pruning & Live O(1) Collinear Vertex Merge
    if (state.coordinates.length >= 2 && currentSegment.length >= 2) {
        const prevCoord = state.coordinates[state.coordinates.length - 2];
        if (
            prevCoord &&
            typeof prevCoord.latitude === 'number' &&
            typeof prevCoord.longitude === 'number'
        ) {
            const spikeEval = evaluateThreePointSpike(
                prevCoord.latitude,
                prevCoord.longitude,
                lastCoord.latitude,
                lastCoord.longitude,
                coordinate.latitude,
                coordinate.longitude,
                timeDeltaSec,
                hwAccuracy,
                speedMps
            );

            if (spikeEval.action === 'DROP_VERTEX_C') {
                return false;
            }

            if (spikeEval.action === 'PRUNE_VERTEX_B') {
                // Replace multipath outlier B in-place with C and roll back false distance leg AB
                state.totalDistance = Math.max(0, state.totalDistance + spikeEval.distanceDelta);
                state.coordinates[state.coordinates.length - 1] = coordinate;
                currentSegment[currentSegment.length - 1] = [
                    coordinate.longitude,
                    coordinate.latitude,
                ];
                return true;
            }

            // Tier 1 Live O(1) Collinear Merge: compress redundant straight-line vertices
            if (
                shouldMergeCollinearVertex(
                    prevCoord.latitude,
                    prevCoord.longitude,
                    lastCoord.latitude,
                    lastCoord.longitude,
                    coordinate.latitude,
                    coordinate.longitude
                )
            ) {
                state.totalDistance += distMeters;
                const elevStep = evaluateElevationStep(
                    currAlt,
                    state.elevationBaseline ?? null,
                    hwAccuracy,
                    isStationary
                );
                state.elevationBaseline = elevStep.nextBaseline;
                state.totalElevationGain += elevStep.gainDelta;
                state.totalElevationLoss = (state.totalElevationLoss ?? 0) + elevStep.lossDelta;

                state.coordinates[state.coordinates.length - 1] = coordinate;
                currentSegment[currentSegment.length - 1] = [
                    coordinate.longitude,
                    coordinate.latitude,
                ];
                return true;
            }
        }
    }

    // 6. Standard Commit: Update Distance, Elevation Gain/Loss, and Route Segment
    state.totalDistance += distMeters;

    const elevStep = evaluateElevationStep(
        currAlt,
        state.elevationBaseline ?? null,
        hwAccuracy,
        isStationary
    );
    state.elevationBaseline = elevStep.nextBaseline;
    state.totalElevationGain += elevStep.gainDelta;
    state.totalElevationLoss = (state.totalElevationLoss ?? 0) + elevStep.lossDelta;

    state.coordinates.push(coordinate);
    currentSegment.push([coordinate.longitude, coordinate.latitude]);
    return true;
}
