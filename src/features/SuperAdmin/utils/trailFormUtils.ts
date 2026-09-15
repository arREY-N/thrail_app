/**
 * @file trailFormUtils.ts
 * @description Non-UI utility functions for trail write/edit forms in SuperAdmin.
 * Handles section validation, missing field summarization, options parsing, and numeric conversions.
 */

import { TextStyle, ViewStyle } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { Trail } from '@/src/core/models/Trail/Trail';

export interface AmenityConfig {
    id: keyof NonNullable<Trail['tourism']>;
    label: string;
}

export const FACILITY_AMENITIES: AmenityConfig[] = [
    { id: 'shelter', label: 'Shelter Available' },
    { id: 'resting', label: 'Resting Areas' },
    { id: 'information_board', label: 'Info Boards' },
    { id: 'clean_water', label: 'Drinking Water' },
];

export const NATURAL_CULTURAL_AMENITIES: AmenityConfig[] = [
    { id: 'river', label: 'Rivers' },
    { id: 'lake', label: 'Lakes' },
    { id: 'waterfall', label: 'Waterfalls' },
    { id: 'monument', label: 'Monuments' },
    { id: 'community', label: 'Local Communities' },
];

export const AMENITY_ITEMS: AmenityConfig[] = [
    ...FACILITY_AMENITIES,
    ...NATURAL_CULTURAL_AMENITIES,
];

/**
 * Checks whether the General Information section has all required fields populated.
 */
export const isGeneralComplete = (trail: Trail | null | undefined): boolean => {
    return Boolean(
        trail?.general?.name?.trim() &&
        trail?.general?.address?.trim() &&
        trail?.general?.province && trail.general.province.length > 0 &&
        trail?.general?.mountain && trail.general.mountain.length > 0
    );
};

/**
 * Checks whether the Geography & Coordinates section has all required fields populated.
 */
export const isGeographyComplete = (trail: Trail | null | undefined): boolean => {
    return Boolean(
        trail?.geography &&
        trail.geography.masl !== null && trail.geography.masl !== undefined &&
        trail.geography.startLat && trail.geography.startLat !== 0 &&
        trail.geography.startLong && trail.geography.startLong !== 0 &&
        trail.geography.endLat && trail.geography.endLat !== 0 &&
        trail.geography.endLong && trail.geography.endLong !== 0
    );
};

/**
 * Checks whether the Difficulty & Hike Specs section has all required fields populated.
 */
export const isDifficultyComplete = (trail: Trail | null | undefined): boolean => {
    return Boolean(
        trail?.difficulty &&
        trail.difficulty.classification && trail.difficulty.classification.length > 0 &&
        trail.difficulty.lascoRating && trail.difficulty.lascoRating >= 1 && trail.difficulty.lascoRating <= 9 &&
        trail.difficulty.length && trail.difficulty.length > 0 &&
        trail.difficulty.gain !== null && trail.difficulty.gain !== undefined &&
        trail.difficulty.slope !== null && trail.difficulty.slope !== undefined &&
        trail.difficulty.obstacles !== null && trail.difficulty.obstacles !== undefined &&
        trail.difficulty.circularity &&
        trail.difficulty.quality && trail.difficulty.quality.length > 0
    );
};

/**
 * Checks whether the Rules, Safety & Advisories section has all required fields populated.
 */
export const isRulesComplete = (trail: Trail | null | undefined): boolean => {
    return Boolean(
        trail?.general?.guidelines && trail.general.guidelines.length > 0
    );
};

/**
 * Checks whether the entire trail form is valid for submission.
 */
export const isFormValid = (trail: Trail | null | undefined): boolean => {
    return (
        isGeneralComplete(trail) &&
        isGeographyComplete(trail) &&
        isDifficultyComplete(trail) &&
        isRulesComplete(trail)
    );
};

/**
 * Generates user-friendly summary text listing incomplete required sections.
 */
export const getMissingFieldsSummary = (
    generalComplete: boolean,
    geographyComplete: boolean,
    difficultyComplete: boolean,
    rulesComplete?: boolean
): string => {
    const missingSections: string[] = [];
    if (!generalComplete) missingSections.push('General Information');
    if (!geographyComplete) missingSections.push('Geography & Coordinates');
    if (!difficultyComplete) missingSections.push('Difficulty & Hike Specs');
    if (rulesComplete !== undefined && !rulesComplete) missingSections.push('Rules, Safety & Advisories');

    if (missingSections.length === 1) {
        return `Please complete required fields in ${missingSections[0]}.`;
    }
    if (missingSections.length > 1) {
        return `Please fill in required fields in: ${missingSections.join(', ')}.`;
    }
    return 'Please complete all required fields before saving.';
};

/**
 * Safely extracts string array options from a generic options dictionary.
 */
export const getOptionStrings = (
    options: Record<string, unknown> | undefined,
    key: string
): string[] => {
    if (!options) return [];
    const raw = options[key];
    if (!Array.isArray(raw)) return [];
    return raw.map((opt: unknown) => {
        if (typeof opt === 'string') return opt;
        if (typeof opt === 'object' && opt !== null) {
            const named = opt as { name?: string; id?: string };
            return named.name || named.id || '';
        }
        return '';
    });
};

/**
 * Converts a numeric value into a display string for input fields,
 * suppressing synthetic zeroes during creation.
 */
export const getNumericDisplayValue = (
    val: number | null | undefined,
    isEditMode: boolean
): string => {
    if (val === null || val === undefined) return '';
    if (val === 0 && !isEditMode) return '';
    return String(val);
};

/**
 * Returns dynamic title for the primary save button.
 */
export const getSaveButtonTitle = (
    isLoading: boolean,
    isEditMode: boolean
): string => {
    if (isLoading) {
        return isEditMode ? 'Saving Changes...' : 'Saving Trail...';
    }
    return isEditMode ? 'Save Changes' : 'Save Trail';
};

/**
 * Returns dynamic container styling for the primary save button.
 */
export const getSaveButtonStyle = (
    isLoading: boolean,
    formValid: boolean,
    isButtonError: boolean
): ViewStyle => {
    if (isLoading || formValid) {
        return {
            backgroundColor: Colors.PRIMARY,
            borderColor: Colors.PRIMARY,
            borderWidth: 1.5,
        };
    }
    if (isButtonError) {
        return {
            backgroundColor: Colors.STATUS_CANCELLED_BG,
            borderColor: Colors.STATUS_CANCELLED_TEXT,
            borderWidth: 1.5,
        };
    }
    return {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
        borderWidth: 1.5,
    };
};

/**
 * Returns dynamic typography styling for the primary save button.
 */
export const getSaveButtonTextStyle = (
    formValid: boolean,
    isLoading: boolean,
    isButtonError: boolean
): TextStyle => {
    if (formValid || isLoading) {
        return {
            color: Colors.WHITE,
            fontWeight: 'bold',
        };
    }
    if (isButtonError) {
        return {
            color: Colors.STATUS_CANCELLED_TEXT,
            fontWeight: 'bold',
        };
    }
    return {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    };
};

export interface ModalConfirmConfig {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
}

/**
 * Generates modal confirmation configuration for discarding unsaved changes.
 */
export const getDiscardConfirmConfig = (): ModalConfirmConfig => ({
    title: 'Discard Unsaved Changes?',
    message: 'You have unsaved changes in this form. Are you sure you want to leave without saving?',
    confirmText: 'Discard & Leave',
    cancelText: 'Keep Editing',
});

/**
 * Generates dynamic modal configuration for saving or creating a trail.
 */
export const getSaveConfirmConfig = (
    isEditMode: boolean,
    isLoading: boolean,
    trailName?: string
): ModalConfirmConfig => {
    const displayName = trailName || (isEditMode ? 'this trail' : 'this new trail');
    return {
        title: isEditMode ? 'Save Changes?' : 'Create Trail?',
        message: isEditMode
            ? `Are you sure you want to save changes to "${displayName}"?`
            : `Are you sure you want to create "${displayName}"? Please verify that all details are accurate before proceeding.`,
        confirmText: isLoading
            ? (isEditMode ? 'Saving...' : 'Creating...')
            : (isEditMode ? 'Save Changes' : 'Create Trail'),
        cancelText: 'Keep Editing',
    };
};

/**
 * Generates modal confirmation message for deleting a trail.
 */
export const getDeleteConfirmConfig = (
    isLoading: boolean,
    trailName?: string
): ModalConfirmConfig => {
    const displayName = trailName || 'this trail';
    return {
        title: 'Delete Trail',
        message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
        confirmText: isLoading ? 'Deleting...' : 'Delete Trail',
        cancelText: 'Cancel',
    };
};

