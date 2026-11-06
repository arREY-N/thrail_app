/**
 * @file gpsGeometry.ts
 * @description Pure spherical & planar geometry helpers for GPS distance, bearing,
 * turn angle cosine, cross-track perpendicular distance (for RDP), and compass smoothing.
 */

const EARTH_RADIUS_M = 6371000;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Fast Haversine distance in meters between two WGS84 coordinates.
 */
export function haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const dLat = (lat2 - lat1) * DEG_TO_RAD;
    const dLon = (lon2 - lon1) * DEG_TO_RAD;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * DEG_TO_RAD) *
            Math.cos(lat2 * DEG_TO_RAD) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    return EARTH_RADIUS_M * c;
}

/**
 * Computes true forward bearing (0-360 degrees) from point 1 to point 2.
 */
export function computeBearingDeg(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const phi1 = lat1 * DEG_TO_RAD;
    const phi2 = lat2 * DEG_TO_RAD;
    const dLambda = (lon2 - lon1) * DEG_TO_RAD;

    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x =
        Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    const theta = Math.atan2(y, x);
    return (theta * RAD_TO_DEG + 360) % 360;
}

/**
 * Computes the cosine of the turn angle between segment A->B and segment B->C.
 * Returns a value in [-1, 1]:
 *   1.0 = straight ahead (0 deg deflection)
 *   0.0 = 90 deg turn
 *  -1.0 = 180 deg hairpin reversal (multipath spike)
 */
export function computeTurnCosine(
    latA: number,
    lonA: number,
    latB: number,
    lonB: number,
    latC: number,
    lonC: number
): number {
    const cosLat = Math.cos(latB * DEG_TO_RAD);
    const v1x = (lonB - lonA) * cosLat;
    const v1y = latB - latA;
    const v2x = (lonC - lonB) * cosLat;
    const v2y = latC - latB;

    const mag1 = Math.hypot(v1x, v1y);
    const mag2 = Math.hypot(v2x, v2y);
    if (mag1 < 1e-9 || mag2 < 1e-9) return 1;

    return (v1x * v2x + v1y * v2y) / (mag1 * mag2);
}

/**
 * Computes the perpendicular distance in meters from a point P ([lon, lat])
 * to a line segment S -> E ([lon, lat]) using a local tangent plane projection.
 * Used by Ramer-Douglas-Peucker (RDP) polyline simplification.
 */
export function perpendicularDistanceMeters(
    point: number[],
    lineStart: number[],
    lineEnd: number[]
): number {
    const [pLon, pLat] = point;
    const [sLon, sLat] = lineStart;
    const [eLon, eLat] = lineEnd;

    const cosLat = Math.cos(((sLat + eLat) * 0.5) * DEG_TO_RAD);
    const metersPerDegLat = 111132.92;
    const metersPerDegLon = 111412.84 * cosLat;

    const px = (pLon - sLon) * metersPerDegLon;
    const py = (pLat - sLat) * metersPerDegLat;
    const ex = (eLon - sLon) * metersPerDegLon;
    const ey = (eLat - sLat) * metersPerDegLat;

    const segLenSq = ex * ex + ey * ey;
    if (segLenSq < 1e-6) {
        return Math.hypot(px, py);
    }

    // Projection parameter t clamped to [0, 1] for segment distance
    const t = Math.max(0, Math.min(1, (px * ex + py * ey) / segLenSq));
    const projX = t * ex;
    const projY = t * ey;

    return Math.hypot(px - projX, py - projY);
}

/**
 * Circular exponential moving average (EMA) for compass headings (0-360 deg).
 * Safely handles wrap-around across 359 deg <-> 0 deg without spinning the indicator.
 */
export function smoothCompassHeading(
    prevHeading: number | null,
    newHeading: number,
    alpha: number = 0.25,
    deadbandDeg: number = 1.5
): number {
    if (prevHeading === null || isNaN(prevHeading)) {
        return (newHeading + 360) % 360;
    }

    // Shortest signed angular difference in [-180, 180]
    const diff = ((newHeading - prevHeading + 540) % 360) - 180;
    if (Math.abs(diff) < deadbandDeg) {
        return prevHeading;
    }

    return (prevHeading + alpha * diff + 360) % 360;
}
