/**
 * GlobalStyles — Centralized, reusable cross-platform style utilities.
 *
 * This module provides a single source of truth for common visual patterns
 * (e.g., drop shadows) that need to work across iOS, Android, and Web.
 * Import from `@/src/constants/globalStyles` and spread into StyleSheet objects.
 */
import { Platform } from 'react-native';
import { Colors } from './colors';

export const GlobalStyles = {
    /**
     * Generates a cross-platform drop shadow based on the provided elevation value.
     * Scales iOS shadow properties and Web box-shadow proportionally to the elevation.
     *
     * @param elevation - The desired shadow depth (default: 3). Maps directly to Android elevation.
     * @returns A platform-specific style object containing the appropriate shadow properties.
     *
     * @example
     * ```ts
     * const styles = StyleSheet.create({
     *     card: {
     *         backgroundColor: Colors.WHITE,
     *         borderRadius: 16,
     *         ...GlobalStyles.dropShadow(),   // Default elevation 3
     *     },
     *     modal: {
     *         backgroundColor: Colors.WHITE,
     *         ...GlobalStyles.dropShadow(10),  // Deeper shadow for modals
     *     },
     * });
     * ```
     */
    dropShadow: (elevation: number = 3) => Platform.select({
        ios: {
            shadowColor: Colors.SHADOW,
            shadowOffset: { width: 0, height: elevation },
            shadowOpacity: 0.1,
            shadowRadius: elevation * 2
        },
        android: { elevation },
        web: { boxShadow: `0px ${elevation}px ${elevation * 2}px ${Colors.SHADOW}1A` }
    }),
};
