/**
 * @file polylineSimplifier.ts
 * @description Two-Tier Polyline Simplification:
 *   - Tier 1 (Live 1Hz O(1)): In-place collinear vertex merging on straight segments.
 *   - Tier 2 (On Pause / Hike Completion): Iterative Ramer-Douglas-Peucker (RDP) simplification.
 */

import {
    computeTurnCosine,
    haversineMeters,
    perpendicularDistanceMeters,
} from './gpsGeometry';

/**
 * Tier 1 Live O(1) Collinear Vertex Check:
 * Returns true if A -> B -> C is nearly straight (turn angle < ~10 deg, cosTheta > 0.985)
 * across short legs (< 12m), allowing middle vertex B to be replaced in-place by C.
 */
export function shouldMergeCollinearVertex(
    latA: number,
    lonA: number,
    latB: number,
    lonB: number,
    latC: number,
    lonC: number,
    maxLegMeters: number = 12.0,
    minCosine: number = 0.985
): boolean {
    const distAB = haversineMeters(latA, lonA, latB, lonB);
    const distBC = haversineMeters(latB, lonB, latC, lonC);
    if (distAB > maxLegMeters || distBC > maxLegMeters) {
        return false;
    }

    const turnCos = computeTurnCosine(latA, lonA, latB, lonB, latC, lonC);
    return turnCos >= minCosine;
}

/**
 * Tier 2 Ramer-Douglas-Peucker (RDP) Polyline Simplification.
 * Simplifies a single segment of [longitude, latitude] pairs using an iterative stack
 * (preventing call-stack overflow on long multi-hour hikes) and perpendicular distance in meters.
 *
 * @param points Array of [longitude, latitude] coordinates
 * @param epsilonMeters Maximum cross-track tolerance in meters (default: 1.8m)
 */
export function simplifyPolylineRDP(
    points: [number, number][],
    epsilonMeters: number = 1.8
): [number, number][] {
    if (!Array.isArray(points) || points.length <= 2) {
        return points;
    }

    const n = points.length;
    const keep = new Uint8Array(n);
    keep[0] = 1;
    keep[n - 1] = 1;

    const stack: [number, number][] = [[0, n - 1]];

    while (stack.length > 0) {
        const [startIdx, endIdx] = stack.pop()!;
        if (endIdx - startIdx <= 1) continue;

        let maxDistM = 0;
        let splitIdx = -1;
        const startPt = points[startIdx];
        const endPt = points[endIdx];

        for (let i = startIdx + 1; i < endIdx; i++) {
            const distM = perpendicularDistanceMeters(points[i], startPt, endPt);
            if (distM > maxDistM) {
                maxDistM = distM;
                splitIdx = i;
            }
        }

        if (maxDistM > epsilonMeters && splitIdx !== -1) {
            keep[splitIdx] = 1;
            stack.push([startIdx, splitIdx]);
            stack.push([splitIdx, endIdx]);
        }
    }

    const simplified: [number, number][] = [];
    for (let i = 0; i < n; i++) {
        if (keep[i] === 1) {
            simplified.push(points[i]);
        }
    }

    return simplified;
}

/**
 * Applies Ramer-Douglas-Peucker (RDP) simplification across all segments of a MultiLineString route.
 */
export function simplifyMultiLineRouteRDP(
    walkedRoute: [number, number][][],
    epsilonMeters: number = 1.8
): [number, number][][] {
    if (!Array.isArray(walkedRoute) || walkedRoute.length === 0) {
        return walkedRoute;
    }
    return walkedRoute.map((segment) =>
        Array.isArray(segment) && segment.length > 2
            ? simplifyPolylineRDP(segment, epsilonMeters)
            : segment
    );
}
