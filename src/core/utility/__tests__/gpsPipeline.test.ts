/**
 * @file gpsPipeline.test.ts
 * @description Unit tests verifying the 5-stage modular GPS pipeline:
 *   1. Adaptive 2D EKF (`GpsKalmanFilter`) & Bayesian variance preservation
 *   2. Zero-Velocity Update (`ZuptDetector`) & 2-strike stationary breakout hysteresis
 *   3. Distance & Elevation Deadband Gating (`deadbandGate`)
 *   4. Velocity Plausibility & In-Place 3-Point Spike Pruning (`speedAndSpikeFilter`)
 *   5. Two-Tier Collinear + Ramer-Douglas-Peucker (`polylineSimplifier`)
 */

import type { Location } from '@/src/core/models/Location/Location';
import {
    applyBreadcrumbPipeline,
    BreadcrumbMutableState,
    GpsKalmanFilter,
    simplifyMultiLineRouteRDP,
    simplifyPolylineRDP,
} from '../gps';

const makeTestLocation = (init: Partial<Location>): Location => ({
    latitude: init.latitude ?? 0,
    longitude: init.longitude ?? 0,
    altitude: init.altitude ?? 0,
    accuracy: init.accuracy,
    rawAccuracy: init.rawAccuracy,
    speed: init.speed,
    isStationary: init.isStationary,
    status: init.status ?? 'ACTIVE',
    timestamp: init.timestamp ?? new Date(),
});

describe('Modular Multi-Stage GPS Filtering & Breadcrumb Pipeline', () => {
    it('prevents 9th-floor indoor stationary drift from drawing lines or adding elevation', () => {
        const filter = new GpsKalmanFilter();
        const state: BreadcrumbMutableState = {
            walkedRoute: [[]],
            coordinates: [],
            isSegmentFirstPoint: true,
            elevationBaseline: null,
            totalDistance: 0,
            totalElevationGain: 0,
            totalElevationLoss: 0,
        };

        const baseTime = 1700000000000;

        // Simulate 45 seconds of indoor 9th-floor fixes:
        // Initial coarse fix on Caimito Road (accuracy 55m), followed by window-reflected multipath
        // drifting ~55m south into the building with vertical altitude bouncing by +-20m.
        for (let sec = 0; sec < 45; sec++) {
            const progress = sec / 45;
            const rawLat = 14.6580 - progress * 0.0005; // ~55m south drift
            const rawLon = 120.9850 + Math.sin(sec) * 0.00008;
            const rawAlt = 32 + Math.sin(sec * 0.4) * 18; // +-18m vertical multipath
            const rawAcc = sec < 5 ? 55 : 32; // Coarse indoor accuracy (32m - 55m)

            const filtered = filter.process({
                latitude: rawLat,
                longitude: rawLon,
                altitude: rawAlt,
                accuracy: rawAcc,
                speed: undefined, // Indoor Wi-Fi/multipath often omits Doppler speed or reports 0
                timestamp: baseTime + sec * 1000,
            });

            if (filtered) {
                // Hardware accuracy must not collapse to 3.0m
                expect(filtered.rawAccuracy).toBeGreaterThanOrEqual(32);
                expect(filtered.isStationary).toBe(true);

                const loc = makeTestLocation({
                    latitude: filtered.latitude,
                    longitude: filtered.longitude,
                    altitude: filtered.altitude ?? 0,
                    accuracy: filtered.accuracy,
                    rawAccuracy: filtered.rawAccuracy,
                    speed: filtered.speed,
                    isStationary: filtered.isStationary,
                    timestamp: new Date(filtered.timestamp),
                });

                applyBreadcrumbPipeline(state, loc);
            }
        }

        // Verify zero phantom trail line, zero distance, and zero elevation gain
        expect(state.totalDistance).toBe(0);
        expect(state.totalElevationGain).toBe(0);
        expect(state.walkedRoute[0].length).toBe(0);
    });

    it('unlocks ZUPT and records trail when walking outdoors with good accuracy', () => {
        const filter = new GpsKalmanFilter();
        const state: BreadcrumbMutableState = {
            walkedRoute: [[]],
            coordinates: [],
            isSegmentFirstPoint: true,
            elevationBaseline: null,
            totalDistance: 0,
            totalElevationGain: 0,
            totalElevationLoss: 0,
        };

        const baseTime = 1700000000000;

        // Walk ~60 meters north at ~1.4 m/s with 5m outdoor GPS accuracy and 8m climb
        for (let sec = 0; sec <= 40; sec += 4) {
            const lat = 14.6580 + sec * 0.000013; // ~1.44m per second north
            const lon = 120.9850 + (sec % 8 === 0 ? 0.00001 : -0.00001);
            const alt = 100 + sec * 0.25; // +10m steady climb

            const filtered = filter.process({
                latitude: lat,
                longitude: lon,
                altitude: alt,
                accuracy: 5.0,
                speed: 1.4,
                timestamp: baseTime + sec * 1000,
            });

            expect(filtered).not.toBeNull();
            if (filtered) {
                const loc = makeTestLocation({
                    latitude: filtered.latitude,
                    longitude: filtered.longitude,
                    altitude: filtered.altitude ?? 0,
                    accuracy: filtered.accuracy,
                    rawAccuracy: filtered.rawAccuracy,
                    speed: filtered.speed,
                    isStationary: filtered.isStationary,
                    timestamp: new Date(filtered.timestamp),
                });
                applyBreadcrumbPipeline(state, loc);
            }
        }

        expect(state.totalDistance).toBeGreaterThan(35);
        expect(state.totalElevationGain).toBeGreaterThan(3);
        expect(state.walkedRoute[0].length).toBeGreaterThanOrEqual(2);
    });

    it('prunes a 3-point hairpin multipath spike (A -> B -> C) in-place and rolls back false distance', () => {
        const state: BreadcrumbMutableState = {
            walkedRoute: [[]],
            coordinates: [],
            isSegmentFirstPoint: true,
            elevationBaseline: 100,
            totalDistance: 0,
            totalElevationGain: 0,
            totalElevationLoss: 0,
        };

        const t0 = 1700000000000;

        // Point A: true trail anchor
        applyBreadcrumbPipeline(
            state,
            makeTestLocation({
                latitude: 14.6500,
                longitude: 120.9800,
                altitude: 100,
                accuracy: 6,
                rawAccuracy: 6,
                speed: 1.2,
                isStationary: false,
                timestamp: new Date(t0),
            })
        );

        // Point B: sideways multipath spike ~18m east
        applyBreadcrumbPipeline(
            state,
            makeTestLocation({
                latitude: 14.6500,
                longitude: 120.98017,
                altitude: 100,
                accuracy: 10,
                rawAccuracy: 10,
                speed: 1.2,
                isStationary: false,
                timestamp: new Date(t0 + 4000),
            })
        );

        const distWithSpike = state.totalDistance;
        expect(distWithSpike).toBeGreaterThan(15);
        expect(state.walkedRoute[0].length).toBe(2);

        // Point C: snaps back near A (~5m from A, forming an acute hairpin A -> B -> C)
        applyBreadcrumbPipeline(
            state,
            makeTestLocation({
                latitude: 14.65001,
                longitude: 120.98005,
                altitude: 100,
                accuracy: 6,
                rawAccuracy: 6,
                speed: 1.2,
                isStationary: false,
                timestamp: new Date(t0 + 8000),
            })
        );

        // Outlier B should be replaced in-place by C and false distance rolled back!
        expect(state.walkedRoute[0].length).toBe(2);
        expect(state.totalDistance).toBeLessThan(distWithSpike);
        expect(state.walkedRoute[0][1][0]).toBeCloseTo(120.98005, 5);
    });

    it('simplifies polylines with Ramer-Douglas-Peucker (simplifyPolylineRDP) while preserving corners', () => {
        // Create a path with 10 collinear points going north, then a sharp 90-degree turn east for 10 points
        const rawSegment: [number, number][] = [];
        for (let i = 0; i <= 10; i++) {
            rawSegment.push([120.9800, 14.6500 + i * 0.0001]);
        }
        for (let j = 1; j <= 10; j++) {
            rawSegment.push([120.9800 + j * 0.0001, 14.6510]);
        }

        expect(rawSegment.length).toBe(21);

        const simplified = simplifyPolylineRDP(rawSegment, 1.8);
        // Should compress the 21 points down to the 3 key vertices: start, corner, and end
        expect(simplified.length).toBe(3);
        expect(simplified[0][0]).toBeCloseTo(120.9800, 5);
        expect(simplified[0][1]).toBeCloseTo(14.6500, 5);
        expect(simplified[1][0]).toBeCloseTo(120.9800, 5);
        expect(simplified[1][1]).toBeCloseTo(14.6510, 5);
        expect(simplified[2][0]).toBeCloseTo(120.9810, 5);
        expect(simplified[2][1]).toBeCloseTo(14.6510, 5);

        const multi = simplifyMultiLineRouteRDP([rawSegment], 1.8);
        expect(multi[0].length).toBe(3);
    });
});
