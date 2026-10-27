import { ICoordinate, ITrailStats, Trail } from "@/src/core/models/Trail/interfaces/Trail.types";

const toRad = (deg: number) => deg * (Math.PI / 180);

const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) => {
    const R = 6371000;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));

    return R * c;
};

export default function computeTotalLength(trailCoordinates: ICoordinate[]): ITrailStats {
    if (!trailCoordinates || trailCoordinates.length < 2) return {
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0
    };

    let distance = 0;
    let totalElevationGain = 0;
    let totalElevationLoss = 0;

    // Noise filter: ignore tiny fluctuations from GPS/DEM inaccuracy
    const MIN_ELEVATION_CHANGE = 2;
    // Safety cap: ignore extreme jumps that indicate data errors (not real terrain)
    // 500m is generous — even the steepest trail segments rarely jump >300m between points
    const MAX_REASONABLE_GAIN = 300;

    for (let i = 1; i < trailCoordinates.length; i++) {
        const start = trailCoordinates[i - 1];
        const end = trailCoordinates[i];

        const alt1 = start.altitude ?? 0;
        const alt2 = end.altitude ?? 0;

        let dAltitude = alt2 - alt1;

        if (Math.abs(dAltitude) > MAX_REASONABLE_GAIN) {
            dAltitude = 0;
        }

        const vertical = Math.abs(dAltitude) < MIN_ELEVATION_CHANGE ? 0 : dAltitude;

        const horizontal = haversineDistance(
            start.latitude,
            start.longitude,
            end.latitude,
            end.longitude
        );

        distance += Math.sqrt(horizontal ** 2 + vertical ** 2);

        if (vertical > 0) {
            totalElevationGain += vertical;
        } else {
            totalElevationLoss += Math.abs(vertical);
        }
    }

    return {
        distance,
        elevationGain: totalElevationGain,
        elevationLoss: totalElevationLoss
    };
}

/**
 * Converts a raw GeoJSON coordinate array [lon, lat, alt?] to ICoordinate.
 */
export function geoJSONToCoordinate(coord: number[]): ICoordinate {
    return {
        longitude: coord[0],
        latitude: coord[1],
        altitude: coord[2] ?? 0,
    };
}

/**
 * Computes the midpoint coordinate between the start and end point of a trail.
 * Falls back to start coordinate if end point is missing or invalid.
 */
export function computeTrailMidpoint(trail?: Trail | null): { latitude: number; longitude: number } | null {
    if (!trail?.geography) return null;
    const { startLat, startLong, endLat, endLong } = trail.geography;
    const hasValidStart = typeof startLat === 'number' && typeof startLong === 'number' && !isNaN(startLat) && !isNaN(startLong) && (startLat !== 0 || startLong !== 0);
    const hasValidEnd = typeof endLat === 'number' && typeof endLong === 'number' && !isNaN(endLat) && !isNaN(endLong) && (endLat !== 0 || endLong !== 0);

    if (hasValidStart && hasValidEnd) {
        return {
            latitude: (startLat + endLat) / 2,
            longitude: (startLong + endLong) / 2,
        };
    }
    if (hasValidStart) {
        return { latitude: startLat, longitude: startLong };
    }
    return null;
}
