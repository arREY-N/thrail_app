/**
 * @file gpsKalmanFilter.ts
 * @description Google Maps-inspired 2D Accuracy-Weighted Kalman Filter,
 * GNSS Doppler Zero-Velocity Update (ZUPT) Stationary Anchor Lock, and
 * Shortest-Arc Circular Compass Heading Filter for hiking navigation.
 */

export interface RawGpsFix {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export interface FilteredGpsFix {
  latitude: number;
  longitude: number;
  altitude: number | undefined;
  accuracy: number;
  speed: number | undefined;
  isStationary: boolean;
  timestamp: number;
}

const EARTH_RADIUS_M = 6371000;

/**
 * Great-circle Haversine distance in meters between two WGS84 coordinates.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(Math.min(1, a)));
  return EARTH_RADIUS_M * c;
}

/**
 * Computes the cosine of the turn angle at vertex B between segment AB and segment BC.
 * - `cosTheta ~ +1.0`: straight line forward
 * - `cosTheta ~  0.0`: 90-degree turn
 * - `cosTheta < -0.82`: sharp hairpin reversal (< 35 degrees), typical of canopy multipath bounce
 */
export function computeTurnCosine(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
  latC: number,
  lonC: number
): number {
  const cosLat = Math.cos((latB * Math.PI) / 180);
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
 * Circular shortest-arc low-pass filter for compass/magnetometer headings (0-360 deg).
 * Prevents 359° -> 1° wrap-around spin and suppresses indoor/canopy magnetic jitter.
 */
export function smoothCompassHeading(
  previousHeading: number | null,
  rawHeading: number,
  alpha = 0.25,
  deadbandDeg = 1.5
): number {
  const normalizedRaw = ((rawHeading % 360) + 360) % 360;
  if (previousHeading === null || isNaN(previousHeading)) {
    return normalizedRaw;
  }

  // Shortest signed angular difference in [-180, +180]
  const delta = ((normalizedRaw - previousHeading + 540) % 360) - 180;
  if (Math.abs(delta) < deadbandDeg) {
    return previousHeading;
  }

  return ((previousHeading + alpha * delta) % 360 + 360) % 360;
}

/**
 * 2D Accuracy-Weighted Kalman Filter + Doppler Stationary Anchor Lock.
 *
 * Specifically engineered to suppress GNSS multipath reflections under dense
 * forest canopy (shade), steep ravines, and indoor environments while staying
 * crisp and responsive in open sky.
 */
export class GpsKalmanFilter {
  private estLat: number | null = null;
  private estLon: number | null = null;
  private estAlt: number | undefined = undefined;
  private variance = -1; // Position uncertainty variance (m^2)
  private lastTimestampMs = 0;

  // Stationary anchor lock state (Zero-Velocity Update / ZUPT)
  private anchorLat: number | null = null;
  private anchorLon: number | null = null;
  private anchorAlt: number | undefined = undefined;

  /**
   * Maximum acceptable horizontal accuracy radius (meters).
   * Allows shaded canopy fixes up to 35m into the Kalman estimator (heavily damped)
   * while rejecting gross cell-tower / Wi-Fi scatter > 35m.
   */
  private readonly maxAcceptableAccuracyM = 35;

  /**
   * Maximum physically plausible hiking/trail-running speed (m/s) (~27 km/h).
   */
  private readonly maxPlausibleSpeedMps = 7.5;

  public reset(): void {
    this.estLat = null;
    this.estLon = null;
    this.estAlt = undefined;
    this.variance = -1;
    this.lastTimestampMs = 0;
    this.anchorLat = null;
    this.anchorLon = null;
    this.anchorAlt = undefined;
  }

  /**
   * Processes a raw GNSS fix and returns either a filtered fix or `null` if rejected.
   */
  public process(fix: RawGpsFix): FilteredGpsFix | null {
    const { latitude: rawLat, longitude: rawLon, altitude: rawAlt, timestamp } = fix;
    const rawAccuracy = fix.accuracy;
    const rawSpeed = fix.speed;

    // 1. Coordinate & Accuracy Quality Gate
    if (
      typeof rawLat !== "number" ||
      typeof rawLon !== "number" ||
      isNaN(rawLat) ||
      isNaN(rawLon) ||
      !isFinite(rawLat) ||
      !isFinite(rawLon) ||
      (rawLat === 0 && rawLon === 0) ||
      rawLat < -90 ||
      rawLat > 90 ||
      rawLon < -180 ||
      rawLon > 180
    ) {
      return null;
    }

    if (
      rawAccuracy == null ||
      isNaN(rawAccuracy) ||
      rawAccuracy <= 0 ||
      rawAccuracy > this.maxAcceptableAccuracyM
    ) {
      return null;
    }

    const effectiveAccuracy = Math.max(3.0, rawAccuracy);
    const validSpeed =
      typeof rawSpeed === "number" && !isNaN(rawSpeed) && rawSpeed >= 0
        ? rawSpeed
        : undefined;

    const cleanAlt =
      typeof rawAlt === "number" && !isNaN(rawAlt) && isFinite(rawAlt)
        ? rawAlt
        : undefined;

    // 2. First Fix Initialization
    if (
      this.estLat === null ||
      this.estLon === null ||
      this.variance < 0 ||
      this.anchorLat === null ||
      this.anchorLon === null
    ) {
      this.estLat = rawLat;
      this.estLon = rawLon;
      this.estAlt = cleanAlt;
      this.variance = effectiveAccuracy * effectiveAccuracy;
      this.lastTimestampMs = timestamp;
      this.anchorLat = rawLat;
      this.anchorLon = rawLon;
      this.anchorAlt = cleanAlt;

      return {
        latitude: rawLat,
        longitude: rawLon,
        altitude: cleanAlt,
        accuracy: effectiveAccuracy,
        speed: validSpeed,
        isStationary: true,
        timestamp,
      };
    }

    // 3. Time Delta & Multipath Teleportation Gate
    const dtSec = Math.max(0.5, (timestamp - this.lastTimestampMs) / 1000);
    const rawDistFromEst = haversineDistanceMeters(
      this.estLat,
      this.estLon,
      rawLat,
      rawLon
    );
    const apparentSpeedMps = rawDistFromEst / dtSec;

    // If the raw fix jumped at an impossible speed (> 7.5 m/s) and exceeds 1.5x the accuracy radius
    // (unless GPS was offline for > 60s), discard it as a canopy/building multipath reflection.
    if (
      dtSec < 60 &&
      apparentSpeedMps > this.maxPlausibleSpeedMps &&
      rawDistFromEst > effectiveAccuracy * 1.5
    ) {
      return null;
    }

    // 4. Kalman Prediction Step (Process Noise Q adapts to Doppler Speed)
    // Carrier-phase Doppler speed (< 0.45 m/s) reliably indicates the hiker is standing still.
    const isDopplerStationary = validSpeed !== undefined && validSpeed < 0.45;
    const processNoiseMps = isDopplerStationary
      ? 0.22 // Tightly constrain state prediction when stationary
      : validSpeed !== undefined
        ? Math.max(1.0, Math.min(3.5, validSpeed))
        : 1.5;

    // Cap dtSec at 30s for variance growth to avoid numerical blowup after long pauses
    const cappedDt = Math.min(30, dtSec);
    this.variance += cappedDt * processNoiseMps * processNoiseMps;
    this.lastTimestampMs = timestamp;

    // 5. Kalman Update Step (Measurement Noise R inflated under degraded canopy accuracy)
    // When accuracy > 10m (shade/indoors), multipath bias is non-Gaussian; inflating R lowers
    // Kalman gain K so shaded reflections cannot pull the estimate sideways.
    const canopyPenalty =
      effectiveAccuracy > 10 ? 1 + (effectiveAccuracy - 10) * 0.22 : 1.0;
    const measurementNoiseR =
      effectiveAccuracy * effectiveAccuracy * canopyPenalty * canopyPenalty;

    const kalmanGain = this.variance / (this.variance + measurementNoiseR);

    this.estLat = this.estLat + kalmanGain * (rawLat - this.estLat);
    this.estLon = this.estLon + kalmanGain * (rawLon - this.estLon);
    this.variance = (1 - kalmanGain) * this.variance;

    if (cleanAlt !== undefined) {
      this.estAlt =
        this.estAlt !== undefined
          ? this.estAlt + 0.25 * (cleanAlt - this.estAlt)
          : cleanAlt;
    }

    // 6. Stationary Anchor Lock (Dynamic Accuracy Deadband + Doppler ZUPT)
    const distFromAnchor = haversineDistanceMeters(
      this.anchorLat,
      this.anchorLon,
      this.estLat,
      this.estLon
    );

    // Dynamic deadband scales with GPS uncertainty & Doppler speed:
    // - Open sky walking (accuracy ~4m, speed ~1.2m/s): deadband is ~2.5m (responsive)
    // - Shade/indoors stationary (accuracy ~15m, speed <0.45m/s): deadband is ~12.75m (rock-solid lock)
    // - Shade walking (accuracy ~15m, speed unavailable): deadband is ~7.3m (suppresses starburst jitter)
    const dynamicDeadbandM = isDopplerStationary
      ? Math.max(4.5, effectiveAccuracy * 0.85)
      : Math.max(2.5, 2.5 + Math.max(0, effectiveAccuracy - 5) * 0.48);

    if (distFromAnchor < dynamicDeadbandM) {
      // Hiker is within the stationary uncertainty envelope: keep anchor locked!
      return {
        latitude: this.anchorLat,
        longitude: this.anchorLon,
        altitude: this.anchorAlt,
        accuracy: Math.sqrt(this.variance),
        speed: validSpeed,
        isStationary: true,
        timestamp,
      };
    }

    // Hiker has genuinely moved outside the deadband: advance anchor to Kalman estimate
    this.anchorLat = this.estLat;
    this.anchorLon = this.estLon;
    this.anchorAlt = this.estAlt;

    return {
      latitude: this.estLat,
      longitude: this.estLon,
      altitude: this.estAlt,
      accuracy: Math.sqrt(this.variance),
      speed: validSpeed,
      isStationary: false,
      timestamp,
    };
  }
}

export const sharedGpsKalmanFilter = new GpsKalmanFilter();
