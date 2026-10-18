/**
 * @file pinConfig.ts
 * @description Curated pin presets, Feather icon options, color swatches,
 * and pin visual configuration resolvers.
 */

import { Colors } from '@/src/constants/colors';
import {
    IPinColorSwatch,
    IPinConfig,
    PinIconName,
} from '@/src/features/Map/interfaces/Map.types';

/**
 * Curated list of selectable Feather icons for custom waypoints.
 */
export const PIN_ICON_OPTIONS: readonly PinIconName[] = [
    'tag',
    'compass',
    'camera',
    'flag',
    'map-pin',
    'star',
    'home',
    'droplet',
    'coffee',
    'shield',
    'alert-triangle',
    'eye',
] as const;

/**
 * Standard preset waypoint categories available in map editors and viewers.
 */
export const PIN_TYPES: readonly IPinConfig[] = [
    {
        value: 'summit',
        label: 'Summit',
        icon: 'flag',
        color: Colors.PIN_SUMMIT,
        description: 'Highest peak, mountain top, or ultimate elevation objective.',
    },
    {
        value: 'checkpoint',
        label: 'Checkpoint',
        icon: 'map-pin',
        color: Colors.PIN_CHECKPOINT,
        description: 'Designated trail milestone, junction, or registration station.',
    },
    {
        value: 'viewpoint',
        label: 'Viewpoint',
        icon: 'eye',
        color: Colors.PIN_VIEWPOINT,
        description: 'Scenic vista, photography overlook, or landmark viewing deck.',
    },
    {
        value: 'water',
        label: 'Water Source',
        icon: 'droplet',
        color: Colors.PIN_WATER,
        description: 'Potable spring, river crossing, or water refill station.',
    },
    {
        value: 'shelter',
        label: 'Shelter',
        icon: 'home',
        color: Colors.PIN_SHELTER,
        description: 'Hut, emergency bivouac, rest gazebo, or designated campsite.',
    },
    {
        value: 'hazard',
        label: 'Hazard Warning',
        icon: 'alert-triangle',
        color: Colors.PIN_HAZARD,
        description: 'Steep drop, loose scree, wildlife risk, or high-caution section.',
    },
    {
        value: 'other',
        label: 'Other / Custom',
        icon: 'tag',
        color: Colors.PIN_TEAL,
        description: 'Custom administrator-defined point of interest with custom color.',
    },
] as const;

/**
 * Union type of all standard preset pin category values.
 */
export type PinType = (typeof PIN_TYPES)[number]['value'];

/**
 * Curated brand-harmonious color swatches available when custom point types are selected.
 */
export const PIN_COLOR_SWATCHES: readonly IPinColorSwatch[] = [
    { id: 'teal', label: 'Teal', color: Colors.PIN_TEAL },
    { id: 'purple', label: 'Purple', color: Colors.PIN_PURPLE },
    { id: 'pink', label: 'Pink', color: Colors.PIN_PINK },
    { id: 'cyan', label: 'Cyan', color: Colors.PIN_CYAN },
    { id: 'lime', label: 'Olive', color: Colors.PIN_LIME },
    { id: 'amber', label: 'Amber', color: Colors.PIN_AMBER },
    { id: 'slate', label: 'Slate', color: Colors.PIN_SLATE },
] as const;

/**
 * Resolves the visual configuration for any waypoint point.
 * Gracefully handles standard presets, custom labels, custom colors, and custom icons.
 *
 * @param type - The point type identifier (preset or custom).
 * @param customColor - Optional custom color override.
 * @param customCategory - Optional custom category label override.
 * @param customIcon - Optional custom Feather icon override.
 * @returns {IPinConfig} Resolved pin visual configuration.
 */
export const getPinConfig = (
    type?: string,
    customColor?: string,
    customCategory?: string,
    customIcon?: PinIconName
): IPinConfig => {
    const matched = PIN_TYPES.find((t) => t.value === type);
    if (matched) {
        return {
            ...matched,
            label: (type === 'other' && customCategory?.trim()) ? customCategory.trim() : matched.label,
            color: customColor || matched.color,
            icon: (type === 'other' && customIcon) ? customIcon : matched.icon,
        };
    }

    // Dynamic fallback for custom or unlisted categories
    return {
        value: type || 'checkpoint',
        label: customCategory?.trim() || type || 'Checkpoint',
        icon: customIcon || 'map-pin',
        color: customColor || Colors.PIN_CHECKPOINT,
    };
};
