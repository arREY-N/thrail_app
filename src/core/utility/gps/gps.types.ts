/**
 * @file gps.types.ts
 * @description Shared TypeScript interfaces for the multi-stage GPS filtering and breadcrumb pipeline.
 */

export interface RawGpsFix {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    timestamp?: number | Date | string;
}

export interface FilteredGpsFix {
    latitude: number;
    longitude: number;
    altitude: number | null;
    /** Posterior / effective horizontal uncertainty in meters */
    accuracy: number;
    /** True hardware-reported GPS horizontal accuracy in meters (never collapsed by EKF smoothing) */
    rawAccuracy: number;
    speed: number;
    heading: number | null;
    timestamp: number;
    /** True when the ZUPT detector has locked onto a stationary anchor */
    isStationary: boolean;
}

export interface GpsKalmanConfig {
    /** Process noise in meters per second of movement (default: 2.2) */
    processNoiseMps?: number;
    /** Minimum trusted hardware accuracy in meters (default: 3.0) */
    minAccuracyM?: number;
    /** Maximum acceptable raw accuracy before rejecting fix completely (default: 120.0) */
    maxAcceptableAccuracyM?: number;
    /** Maximum plausible hiking speed in m/s before spike rejection (default: 8.5) */
    maxPlausibleSpeedMps?: number;
    /** Doppler speed threshold below which hiker is considered stationary (default: 0.45 m/s) */
    stationarySpeedThresholdMps?: number;
    /** Displacement deadband in meters required to break stationary anchor lock (default: 4.5 m) */
    stationaryDeadbandM?: number;
}

export type SpikeAction = 'KEEP_ALL' | 'PRUNE_VERTEX_B' | 'DROP_VERTEX_C';

export interface SpikeEvaluationResult {
    action: SpikeAction;
    /** Distance from A to B in meters */
    distAB: number;
    /** Distance from A to C in meters */
    distAC: number;
    /** Distance adjustment to apply when pruning vertex B (distAC - distAB) */
    distanceDelta: number;
}

export interface ElevationStepResult {
    nextBaseline: number | null;
    gainDelta: number;
    lossDelta: number;
}
