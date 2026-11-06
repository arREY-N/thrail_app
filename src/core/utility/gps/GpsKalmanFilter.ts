/**
 * @file GpsKalmanFilter.ts
 * @description Lightweight 2D Adaptive Extended Kalman Filter (EKF) for mobile GPS & Fused Location streams.
 *
 * Key properties:
 *   1. True Bayesian variance updates (`rawKalmanGain`) so internal variance never artificially collapses.
 *   2. Preserves hardware `rawAccuracy` alongside posterior `accuracy` for downstream deadband gating.
 *   3. Suppresses artificial `minGain` crawl indoors or when Doppler speed is stationary/unknown.
 *   4. Delegates stationary anchor locking & 2-strike breakout hysteresis to `ZuptDetector`.
 */

import { FilteredGpsFix, GpsKalmanConfig, RawGpsFix } from './gps.types';
import { computeBearingDeg, haversineMeters, smoothCompassHeading } from './gpsGeometry';
import { isVelocityPlausible } from './speedAndSpikeFilter';
import { ZuptDetector } from './zuptDetector';

export class GpsKalmanFilter {
    private readonly processNoiseMps: number;
    private readonly minAccuracyM: number;
    private readonly maxAcceptableAccuracyM: number;
    private readonly maxPlausibleSpeedMps: number;
    private readonly stationarySpeedThresholdMps: number;
    private readonly stationaryDeadbandM: number;
    private readonly minVarianceM2 = 9.0; // 3m minimum internal uncertainty floor

    private isSeeded = false;
    private estLat = 0;
    private estLon = 0;
    private estAlt: number | null = null;
    private estHeading: number | null = null;
    private variance = -1; // P (m^2)
    private lastTimestampMs = 0;

    private readonly zupt = new ZuptDetector();

    // Consecutive rejected spike counter (allows recovery if GPS genuinely jumped after tunnel/resume)
    private consecutiveSpikeRejections = 0;

    constructor(config: GpsKalmanConfig = {}) {
        this.processNoiseMps = config.processNoiseMps ?? 2.2;
        this.minAccuracyM = config.minAccuracyM ?? 3.0;
        this.maxAcceptableAccuracyM = config.maxAcceptableAccuracyM ?? 120.0;
        this.maxPlausibleSpeedMps = config.maxPlausibleSpeedMps ?? 8.5;
        this.stationarySpeedThresholdMps = config.stationarySpeedThresholdMps ?? 0.45;
        this.stationaryDeadbandM = config.stationaryDeadbandM ?? 4.5;
    }

    /**
     * Resets the estimator state (call when starting a new hike or discarding a session).
     */
    public reset(): void {
        this.isSeeded = false;
        this.estLat = 0;
        this.estLon = 0;
        this.estAlt = null;
        this.estHeading = null;
        this.variance = -1;
        this.lastTimestampMs = 0;
        this.consecutiveSpikeRejections = 0;
        this.zupt.reset();
    }

    /**
     * Processes a raw OS location fix and returns a smoothed, ZUPT-anchored fix,
     * or `null` if the fix is invalid or rejected as a multipath spike.
     */
    public process(fix: RawGpsFix): FilteredGpsFix | null {
        const { latitude, longitude } = fix;

        // 1. Basic coordinate sanity validation
        if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            isNaN(latitude) ||
            isNaN(longitude) ||
            !isFinite(latitude) ||
            !isFinite(longitude) ||
            (latitude === 0 && longitude === 0) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return null;
        }

        // 2. Accuracy gate: discard gross cell-tower scatter (> 120m)
        const rawAccuracy =
            typeof fix.accuracy === 'number' && !isNaN(fix.accuracy) && fix.accuracy > 0
                ? fix.accuracy
                : 12.0;

        if (rawAccuracy > this.maxAcceptableAccuracyM) {
            return null;
        }

        const effectiveAccuracy = Math.max(this.minAccuracyM, rawAccuracy);
        const nowMs = this.resolveTimestampMs(fix.timestamp);

        const validAlt =
            typeof fix.altitude === 'number' &&
            !isNaN(fix.altitude) &&
            isFinite(fix.altitude) &&
            fix.altitude !== 0
                ? fix.altitude
                : null;

        const validSpeed =
            typeof fix.speed === 'number' && !isNaN(fix.speed) && fix.speed >= 0
                ? fix.speed
                : undefined;

        const validHeading =
            typeof fix.heading === 'number' && !isNaN(fix.heading) && fix.heading >= 0
                ? fix.heading
                : null;

        // 3. Seed filter on first valid fix
        if (!this.isSeeded) {
            this.isSeeded = true;
            this.estLat = latitude;
            this.estLon = longitude;
            this.estAlt = validAlt;
            this.estHeading = validHeading;
            this.variance = effectiveAccuracy * effectiveAccuracy;
            this.lastTimestampMs = nowMs;
            this.zupt.seed(latitude, longitude, validSpeed, this.stationarySpeedThresholdMps);

            return {
                latitude: this.estLat,
                longitude: this.estLon,
                altitude: this.estAlt,
                accuracy: effectiveAccuracy,
                rawAccuracy: effectiveAccuracy,
                speed: validSpeed ?? 0,
                heading: this.estHeading,
                timestamp: nowMs,
                isStationary: this.zupt.isStationary,
            };
        }

        // 4. Time delta calculation
        const dtSec = Math.max(0.25, Math.min(30.0, (nowMs - this.lastTimestampMs) / 1000));
        const rawDistM = haversineMeters(this.estLat, this.estLon, latitude, longitude);
        const impliedSpeedMps = rawDistM / dtSec;

        // 5. Velocity & Doppler-consistency spike gate
        if (!isVelocityPlausible(rawDistM, dtSec, this.maxPlausibleSpeedMps, validSpeed)) {
            this.consecutiveSpikeRejections += 1;
            // If 3 consecutive fixes agree on the new location, re-seed (e.g. exiting tunnel or vehicle)
            if (this.consecutiveSpikeRejections >= 3 && effectiveAccuracy <= 25) {
                this.consecutiveSpikeRejections = 0;
                this.estLat = latitude;
                this.estLon = longitude;
                this.variance = effectiveAccuracy * effectiveAccuracy;
                this.lastTimestampMs = nowMs;
                this.zupt.seed(latitude, longitude, validSpeed, this.stationarySpeedThresholdMps);
            } else {
                return null;
            }
        } else {
            this.consecutiveSpikeRejections = 0;
        }

        this.lastTimestampMs = nowMs;

        // 6. Adaptive Process Noise (Q)
        const isDopplerStationary =
            validSpeed !== undefined && validSpeed < this.stationarySpeedThresholdMps;
        const isDopplerMoving =
            validSpeed !== undefined && validSpeed >= this.stationarySpeedThresholdMps;

        // Scale down process noise when Doppler is stationary OR when indoor/degraded accuracy (> 20m) lacks Doppler confirmation
        const effectiveProcessNoise = isDopplerStationary
            ? this.processNoiseMps * 0.15
            : !isDopplerMoving && effectiveAccuracy > 20
              ? this.processNoiseMps * 0.25
              : this.processNoiseMps;

        this.variance += dtSec * effectiveProcessNoise * effectiveProcessNoise;

        // 7. Measurement Update (Kalman Gain K)
        // Inflate measurement variance when accuracy > 20m so coarse Wi-Fi/cell fixes cannot pull the state
        const accuracyPenalty = effectiveAccuracy > 20 ? 2.5 : 1.0;
        const measurementVariance = effectiveAccuracy * effectiveAccuracy * accuracyPenalty;
        const rawKalmanGain = this.variance / (this.variance + measurementVariance);

        // Only apply a high responsiveness floor (0.35) when hardware Doppler confirms active movement AND accuracy is good (<= 20m).
        // Under indoor/multipath conditions or unknown speed, let natural Bayesian rawKalmanGain govern the update!
        const minGain =
            isDopplerMoving && effectiveAccuracy <= 20
                ? 0.35
                : isDopplerStationary
                  ? 0.02
                  : 0.04;

        const kalmanGain = Math.max(minGain, Math.min(0.95, rawKalmanGain));

        const prevEstLat = this.estLat;
        const prevEstLon = this.estLon;

        this.estLat += kalmanGain * (latitude - this.estLat);
        this.estLon += kalmanGain * (longitude - this.estLon);

        // True Bayesian variance update using rawKalmanGain so variance never artificially collapses
        this.variance = Math.max(
            this.minVarianceM2,
            (1 - rawKalmanGain) * this.variance
        );

        // 8. Smooth 3D Altitude (only update when horizontal accuracy is reasonable <= 25m)
        if (validAlt !== null && effectiveAccuracy <= 25) {
            if (this.estAlt === null) {
                this.estAlt = validAlt;
            } else {
                const altJump = Math.abs(validAlt - this.estAlt);
                if (altJump < 40) {
                    const altAlpha = isDopplerStationary ? 0.05 : 0.22;
                    this.estAlt += altAlpha * (validAlt - this.estAlt);
                }
            }
        }

        // 9. Zero-Velocity Update (ZUPT) & 2-Strike Stationary Anchor Hysteresis
        const zuptResult = this.zupt.evaluate({
            estLat: this.estLat,
            estLon: this.estLon,
            rawLat: latitude,
            rawLon: longitude,
            effectiveAccuracy,
            validSpeed,
            stationarySpeedThresholdMps: this.stationarySpeedThresholdMps,
            stationaryDeadbandM: this.stationaryDeadbandM,
        });

        const outputLat = zuptResult.latitude;
        const outputLon = zuptResult.longitude;

        // 10. Course-Over-Ground / Compass Heading Fusion
        const stepDistM = haversineMeters(prevEstLat, prevEstLon, outputLat, outputLon);
        if (!zuptResult.isStationary && stepDistM >= 1.8) {
            const cogHeading = computeBearingDeg(prevEstLat, prevEstLon, outputLat, outputLon);
            this.estHeading = smoothCompassHeading(this.estHeading, cogHeading, 0.35, 1.5);
        } else if (validHeading !== null) {
            this.estHeading = smoothCompassHeading(this.estHeading, validHeading, 0.25, 2.0);
        }

        const outputSpeed = zuptResult.isStationary
            ? 0
            : validSpeed !== undefined
              ? validSpeed
              : Math.min(impliedSpeedMps, this.maxPlausibleSpeedMps);

        return {
            latitude: outputLat,
            longitude: outputLon,
            altitude: this.estAlt !== null ? Math.round(this.estAlt * 10) / 10 : null,
            accuracy: Math.round(Math.max(effectiveAccuracy, Math.sqrt(this.variance)) * 10) / 10,
            rawAccuracy: Math.round(effectiveAccuracy * 10) / 10,
            speed: Math.round(outputSpeed * 100) / 100,
            heading: this.estHeading !== null ? Math.round(this.estHeading * 10) / 10 : null,
            timestamp: nowMs,
            isStationary: zuptResult.isStationary,
        };
    }

    private resolveTimestampMs(ts?: number | Date | string): number {
        if (typeof ts === 'number' && !isNaN(ts) && ts > 0) return ts;
        if (ts instanceof Date && !isNaN(ts.getTime())) return ts.getTime();
        if (typeof ts === 'string') {
            const parsed = Date.parse(ts);
            if (!isNaN(parsed)) return parsed;
        }
        return Date.now();
    }
}

/**
 * Shared singleton instance for the active tracking pipeline.
 */
export const sharedGpsKalmanFilter = new GpsKalmanFilter();
