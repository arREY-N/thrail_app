/**
 * @file map.types.ts
 * @description Type definitions and waypoint category constants for static and interactive trail maps.
 */

import { Colors } from '@/src/constants/colors';

export const PIN_TYPES = [
    { value: 'summit', label: 'Summit', icon: 'flag', color: Colors.PIN_SUMMIT },
    { value: 'checkpoint', label: 'Checkpoint', icon: 'map-pin', color: Colors.PIN_CHECKPOINT },
    { value: 'viewpoint', label: 'Viewpoint', icon: 'eye', color: Colors.PIN_VIEWPOINT },
    { value: 'water', label: 'Water Source', icon: 'droplet', color: Colors.PIN_WATER },
    { value: 'shelter', label: 'Shelter', icon: 'home', color: Colors.PIN_SHELTER },
    { value: 'hazard', label: 'Hazard Warning', icon: 'alert-triangle', color: Colors.PIN_HAZARD },
] as const;

export type PinType = (typeof PIN_TYPES)[number]['value'];
