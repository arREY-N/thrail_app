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

  // Stationary anchor lock state (Zero-Velocity Update / ZUPT with hysteresis)
  private anchorLat: number | null = null;
  private anchorLon: number | null = null;
  private anchorAlt: number | undefined = undefined;
  private isCurrentlyStationary = true;
  private stationaryFixCount = 0;
  private consecutiveRejectedJumps = 0;

  /**
   * Maximum acceptable horizontal accuracy radius (meters).
   * Allows shaded canopy fixes up to 65m into the Kalman estimator (damped)
   * while rejecting gross cell-tower / Wi-Fi scatter > 65m.
   */
  private readonly maxAcceptableAccuracyM = 120;

  /**
   * Maximum physically plausible hiking/trail-running speed (m/s) (~27 km/h).
   */
  private readonly maxPlausibleSpeedMps = 7.5;

  /**
   * Minimum position variance floor (m^2) (~3m std dev).
   * Prevents the filter from becoming over-confident after prolonged stationary periods,
   * ensuring immediate responsiveness as soon as the hiker starts walking.
   */
  private readonly minVarianceM2 = 9.0;

  public reset(): void {
    this.estLat = null;
    this.estLon = null;
    this.estAlt = undefined;
    this.variance = -1;
    this.lastTimestampMs = 0;
    this.anchorLat = null;
    this.anchorLon = null;
    this.anchorAlt = undefined;
    this.isCurrentlyStationary = true;
    this.stationaryFixCount = 0;
    this.consecutiveRejectedJumps = 0;
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

    const hasValidAccuracy =
      typeof rawAccuracy === "number" && !isNaN(rawAccuracy) && rawAccuracy > 0;

    // Allow initial cold-start lock up to 100m accuracy; enforce 120m gate once initialized
    const maxAllowedAccuracy =
      this.estLat === null ? 100 : this.maxAcceptableAccuracyM;
    if (hasValidAccuracy && rawAccuracy > maxAllowedAccuracy) {
      return null;
    }

    const effectiveAccuracy = hasValidAccuracy ? Math.max(3.0, rawAccuracy) : 12.0;
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
      this.variance = Math.max(this.minVarianceM2, effectiveAccuracy * effectiveAccuracy);
      this.lastTimestampMs = timestamp;
      this.anchorLat = rawLat;
      this.anchorLon = rawLon;
      this.anchorAlt = cleanAlt;
      this.isCurrentlyStationary = true;
      this.stationaryFixCount = 0;
      this.consecutiveRejectedJumps = 0;

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

    // Ignore stale out-of-order background batch fixes that predate our latest state
    if (timestamp < this.lastTimestampMs - 500) {
      return null;
    }

    // 3. Time Delta & Multipath Teleportation Gate
    const dtSec = Math.max(0.5, (timestamp - this.lastTimestampMs) / 1000);
    const rawDistFromAnchor = haversineDistanceMeters(
      this.anchorLat,
      this.anchorLon,
      rawLat,
      rawLon
    );
    const rawDistFromEst = haversineDistanceMeters(
      this.estLat,
      this.estLon,
      rawLat,
      rawLon
    );
    const apparentSpeedMps = rawDistFromEst / dtSec;

    // Hardware Doppler speed confirms high-speed vehicle transit (> 6.0 m/s)
    const isConfirmedHighSpeed = validSpeed !== undefined && validSpeed > 6.0;

    // Single-point canopy multipath reflections bounce sideways at impossible speeds (> 7.5 m/s)
    // and snap back on the next fix. However, if 2+ consecutive fixes confirm the new location
    // (e.g., coarse-to-fine GPS lock, vehicle transit, or emulator coordinate injection),
    // re-anchor immediately instead of freezing the indicator.
    if (
      !isConfirmedHighSpeed &&
      dtSec < 60 &&
      apparentSpeedMps > this.maxPlausibleSpeedMps &&
      rawDistFromEst > Math.max(20, effectiveAccuracy * 1.8)
    ) {
      this.consecutiveRejectedJumps += 1;
      if (this.consecutiveRejectedJumps < 2) {
        this.lastTimestampMs = timestamp;
        return null;
      }

      // Confirmed relocation across consecutive fixes: snap estimator to new location
      this.estLat = rawLat;
      this.estLon = rawLon;
      this.estAlt = cleanAlt ?? this.estAlt;
      this.variance = Math.max(this.minVarianceM2, effectiveAccuracy * effectiveAccuracy);
      this.lastTimestampMs = timestamp;
      this.anchorLat = rawLat;
      this.anchorLon = rawLon;
      this.anchorAlt = this.estAlt;
      this.isCurrentlyStationary = false;
      this.stationaryFixCount = 0;
      this.consecutiveRejectedJumps = 0;

      return {
        latitude: rawLat,
        longitude: rawLon,
        altitude: this.estAlt,
        accuracy: effectiveAccuracy,
        speed: validSpeed,
        isStationary: false,
        timestamp,
      };
    }

    this.consecutiveRejectedJumps = 0;

    // 4. Kalman Prediction Step (Process Noise Q adapts to Doppler Speed & displacement)
    const isDopplerStationary = validSpeed !== undefined && validSpeed < 0.35;
    const isDopplerMoving = validSpeed !== undefined && validSpeed >= 0.55;
    const processNoiseMps = isDopplerStationary
      ? 0.25
      : isDopplerMoving
        ? Math.max(2.2, Math.min(6.0, validSpeed))
        : 2.0;

    // Cap dtSec at 30s for variance growth to avoid numerical blowup after long pauses
    const cappedDt = Math.min(30, dtSec);
    this.variance = Math.max(
      this.minVarianceM2,
      this.variance + cappedDt * processNoiseMps * processNoiseMps
    );
    this.lastTimestampMs = Math.max(this.lastTimestampMs, timestamp);

    // 5. Kalman Update Step (Measurement Noise R scaled under degraded canopy accuracy)
    const canopyPenalty =
      effectiveAccuracy > 12 ? 1 + (effectiveAccuracy - 12) * 0.04 : 1.0;
    const measurementNoiseR =
      effectiveAccuracy * effectiveAccuracy * canopyPenalty;

    const rawKalmanGain = this.variance / (this.variance + measurementNoiseR);
    // Ensure a minimum responsiveness floor so the blue dot never lags behind real walking
    const minGain = isDopplerStationary ? 0.08 : 0.38;
    const kalmanGain = Math.max(minGain, rawKalmanGain);

    const prevEstLat = this.estLat;
    const prevEstLon = this.estLon;

    this.estLat = this.estLat + kalmanGain * (rawLat - this.estLat);
    this.estLon = this.estLon + kalmanGain * (rawLon - this.estLon);
    this.variance = Math.max(this.minVarianceM2, (1 - kalmanGain) * this.variance);

    if (cleanAlt !== undefined) {
      this.estAlt =
        this.estAlt !== undefined
          ? this.estAlt + 0.25 * (cleanAlt - this.estAlt)
          : cleanAlt;
    }

    // 6. Stationary Anchor Lock with Hysteresis (ZUPT)
    // Prevents the "staircase freeze" bug by staying unlocked once the hiker begins walking,
    // and only re-engaging the anchor after consecutive stationary fixes.
    const distFromAnchor = haversineDistanceMeters(
      this.anchorLat,
      this.anchorLon,
      this.estLat,
      this.estLon
    );
    const stepDistM = haversineDistanceMeters(
      prevEstLat,
      prevEstLon,
      this.estLat,
      this.estLon
    );

    if (this.isCurrentlyStationary) {
      const breakoutDeadbandM = isDopplerMoving
        ? 1.5
        : isDopplerStationary
          ? Math.max(3.0, Math.min(6.5, effectiveAccuracy * 0.35))
          : Math.max(2.0, Math.min(4.0, 2.0 + Math.max(0, effectiveAccuracy - 5) * 0.15));

      const isImmediateBreakout =
        (isDopplerMoving && rawDistFromAnchor >= 1.5) ||
        rawDistFromAnchor >= breakoutDeadbandM * 1.35;

      if (!isImmediateBreakout && distFromAnchor < breakoutDeadbandM) {
        // Hiker is still within the stationary uncertainty envelope: keep anchor locked
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

      // Hiker has broken out of the stationary envelope: transition to moving state
      this.isCurrentlyStationary = false;
      this.stationaryFixCount = 0;
    } else {
      // Currently moving: check if the hiker has come to a stop across consecutive fixes
      const isStepTiny = isDopplerStationary
        ? stepDistM < 1.0 && rawDistFromEst < Math.max(3.0, effectiveAccuracy * 0.4)
        : validSpeed === undefined && stepDistM < 0.45 && rawDistFromEst < 2.2;

      if (isStepTiny) {
        this.stationaryFixCount += 1;
      } else {
        this.stationaryFixCount = 0;
      }

      if (this.stationaryFixCount >= 3) {
        this.isCurrentlyStationary = true;
        this.anchorLat = this.estLat;
        this.anchorLon = this.estLon;
        this.anchorAlt = this.estAlt;

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
    }

    // Hiker is actively moving: advance trailing anchor and stream live Kalman position
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
