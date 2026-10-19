/**
 * @file Map.types.ts
 * @description Core type definitions, waypoint interfaces, coordinates, and pin contracts
 * for the Map feature domain.
 */

import { IOfflinePoint } from '@/src/core/models/Trail/Trail';

/**
 * Valid icon names from the Feather icon set used across map pins.
 */
export type PinIconName =
    | 'flag'
    | 'map-pin'
    | 'eye'
    | 'droplet'
    | 'home'
    | 'alert-triangle'
    | 'tag'
    | 'compass'
    | 'camera'
    | 'star'
    | 'coffee'
    | 'shield';

/**
 * Configuration definition for a waypoint category pin.
 */
export interface IPinConfig {
    /** Unique programmatic identifier for the point category */
    value: string;
    /** Human-readable display label */
    label: string;
    /** Feather icon glyph rendered inside the pin circle */
    icon: PinIconName;
    /** Primary semantic accent color applied to pin circle and borders */
    color: string;
    /** Brief contextual description */
    description?: string;
}

/**
 * Curated color swatch item for custom pin styling.
 */
export interface IPinColorSwatch {
    id: string;
    label: string;
    color: string;
}

/**
 * Extended offline point interface supporting optional custom category labels and color accents.
 */
export interface IWaypointPoint extends Omit<IOfflinePoint, 'type'> {
    /** Waypoint category identifier (preset PinType or 'other') */
    type: string;
    /** Optional custom hex/semantic color chosen by the administrator */
    color?: string;
    /** Optional custom category name when 'other' is chosen (e.g. 'Campsite', 'Ranger Post') */
    customCategory?: string;
    /** Optional custom Feather icon glyph chosen by the administrator */
    icon?: PinIconName;
}

/**
 * Raw coordinates on the 4:3 static map canvas.
 */
export interface ICanvasPoint {
    x: number;
    y: number;
}

/**
 * Dimensions for 4:3 fitted canvas calculations.
 */
export interface IFittedCanvasDimensions {
    width: number;
    height: number;
}
