/**
 * @file zuptDetector.ts
 * @description Zero-Velocity Update (ZUPT) & Stationary Anchor Hysteresis Detector.
 * Uses hardware GNSS carrier-phase Doppler velocity and accuracy-scaled 2-strike
 * breakout hysteresis to prevent indoor/canopy multipath from unlocking stationary pins.
 */

import { haversineMeters } from './gpsGeometry';

export interface ZuptEvaluationInput {
    estLat: number;
    estLon: number;
    rawLat: number;
    rawLon: number;
    effectiveAccuracy: number;
    validSpeed: number | undefined;
    stationarySpeedThresholdMps: number;
    stationaryDeadbandM: number;
}

export interface ZuptEvaluationOutput {
    latitude: number;
    longitude: number;
    isStationary: boolean;
}

export class ZuptDetector {
    private anchorLat = 0;
    private anchorLon = 0;
    private isCurrentlyStationary = true;
    private stationaryCount = 0;
    private breakoutCount = 0;

    public seed(lat: number, lon: number, validSpeed: number | undefined, stationarySpeedThresholdMps: number): void {
        this.anchorLat = lat;
        this.anchorLon = lon;
        this.isCurrentlyStationary = validSpeed === undefined || validSpeed < stationarySpeedThresholdMps;
        this.stationaryCount = this.isCurrentlyStationary ? 2 : 0;
        this.breakoutCount = 0;
    }

    public reset(): void {
        this.anchorLat = 0;
        this.anchorLon = 0;
        this.isCurrentlyStationary = true;
        this.stationaryCount = 0;
        this.breakoutCount = 0;
    }

    public get isStationary(): boolean {
        return this.isCurrentlyStationary;
    }

    public evaluate(input: ZuptEvaluationInput): ZuptEvaluationOutput {
        const {
            estLat,
            estLon,
            rawLat,
            rawLon,
            effectiveAccuracy,
            validSpeed,
            stationarySpeedThresholdMps,
            stationaryDeadbandM,
        } = input;

        const isDopplerStationary =
            validSpeed !== undefined && validSpeed < stationarySpeedThresholdMps;
        const isDopplerMoving =
            validSpeed !== undefined && validSpeed >= stationarySpeedThresholdMps;

        const distFromAnchorM = haversineMeters(
            this.anchorLat,
            this.anchorLon,
            estLat,
            estLon
        );
        const rawDistFromAnchorM = haversineMeters(
            this.anchorLat,
            this.anchorLon,
            rawLat,
            rawLon
        );

        // Scale breakout deadband with true hardware accuracy so indoor multipath (20m-80m)
        // cannot break the stationary anchor lock on a single wandering fix.
        const breakoutDeadbandM = isDopplerMoving && effectiveAccuracy <= 20
            ? Math.max(3.5, Math.min(5.5, effectiveAccuracy * 0.45))
            : Math.max(stationaryDeadbandM, effectiveAccuracy * 0.65);

        if (this.isCurrentlyStationary) {
            const exceedsDeadband =
                distFromAnchorM > breakoutDeadbandM &&
                rawDistFromAnchorM > breakoutDeadbandM * 1.35;

            // Confirmed outdoor walking with strong Doppler + high accuracy unlocks immediately;
            // degraded or unknown-speed fixes require 2 consecutive breakout fixes.
            const confirmedFastWalk =
                validSpeed !== undefined &&
                validSpeed >= 0.75 &&
                effectiveAccuracy <= 20 &&
                exceedsDeadband;

            if (confirmedFastWalk) {
                this.isCurrentlyStationary = false;
                this.stationaryCount = 0;
                this.breakoutCount = 0;
                this.anchorLat = estLat;
                this.anchorLon = estLon;
            } else if (exceedsDeadband && !isDopplerStationary) {
                this.breakoutCount += 1;
                if (this.breakoutCount >= 2 && effectiveAccuracy <= 30) {
                    this.isCurrentlyStationary = false;
                    this.stationaryCount = 0;
                    this.breakoutCount = 0;
                    this.anchorLat = estLat;
                    this.anchorLon = estLon;
                }
            } else {
                this.breakoutCount = 0;
                // Only gently nudge stationary anchor when GPS accuracy is genuinely high (<= 15m)
                if (effectiveAccuracy <= 15) {
                    const anchorAlpha = 0.04;
                    this.anchorLat += anchorAlpha * (estLat - this.anchorLat);
                    this.anchorLon += anchorAlpha * (estLon - this.anchorLon);
                }
            }
        } else {
            // Currently moving: check if user stopped walking to re-lock stationary anchor
            const relockRadiusM = Math.max(2.5, effectiveAccuracy * 0.45);
            if (isDopplerStationary) {
                this.stationaryCount += 1;
                if (this.stationaryCount >= 2) {
                    this.isCurrentlyStationary = true;
                    this.breakoutCount = 0;
                    this.anchorLat = estLat;
                    this.anchorLon = estLon;
                }
            } else if (
                validSpeed === undefined &&
                (distFromAnchorM < relockRadiusM || effectiveAccuracy > 25)
            ) {
                this.stationaryCount += 1;
                if (this.stationaryCount >= 2) {
                    this.isCurrentlyStationary = true;
                    this.breakoutCount = 0;
                    this.anchorLat = estLat;
                    this.anchorLon = estLon;
                }
            } else {
                this.stationaryCount = 0;
                this.anchorLat = estLat;
                this.anchorLon = estLon;
            }
        }

        return {
            latitude: this.isCurrentlyStationary ? this.anchorLat : estLat,
            longitude: this.isCurrentlyStationary ? this.anchorLon : estLon,
            isStationary: this.isCurrentlyStationary,
        };
    }
}
