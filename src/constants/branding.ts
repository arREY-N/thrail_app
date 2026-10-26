/**
 * @file branding.ts
 * @description Centralized branding constants for the Thrail application.
 * Defines canonical application identity, slogan, brand colors, splash configuration,
 * and references to official logo artwork.
 */

import { Colors, Palette } from '@/src/constants/colors';

export const BRAND = {
    /** Application official display name */
    NAME: 'THRAIL',

    /** Application official brand tagline */
    SLOGAN: 'Find thrill in your trail',

    /** Two-line brand tagline for mobile headers */
    SLOGAN_LINE_1: 'Find Thrill',
    SLOGAN_LINE_2: 'In Your Trail',
    SLOGAN_STACKED: 'Find Thrill\nIn Your Trail',

    /** Application short mission subtitle */
    SUBTITLE: 'Discover breathtaking mountains, book local guides, and start your adventure today.',

    /** Two-line centered subtitle for mobile onboarding cards */
    SUBTITLE_2LINE: 'Discover breathtaking mountains, book local guides,\nand start your adventure today.',

    /** Primary splash & brand background color (Forest Green) */
    SPLASH_BG: Colors.PRIMARY,

    /** High-contrast text color on dark green backgrounds */
    TEXT_INVERSE: Colors.TEXT_INVERSE,

    /** Subtle secondary text color on green backgrounds */
    TEXT_INVERSE_SUBTLE: Palette.WhiteAlpha80,

    /** Ideal splash screen glyph scale (balanced with THRAIL wordmark) */
    SPLASH_GLYPH_SIZE: 140,

    /** Official artwork assets for Logo Concept 2 */
    ASSETS: {
        /** Primary solid white mountain glyph — used on Forest Green splash canvas & dark headers */
        GLYPH_WHITE: require('@/src/assets/logos/Logo Idea 2/Primary Glyph White.png'),

        /** Transparent green outline glyph — used on light/white cards & documents */
        GLYPH_GREEN: require('@/src/assets/logos/Logo Idea 2/Icon.png'),

        /** Full-bleed square logo with Forest Green background — used for app launcher & favicon */
        SQUARE_LOGO: require('@/src/assets/logos/Logo Idea 2/Squere Logo.png'),

        /** Square logo with white background */
        SQUARE_LOGO_INVERTED: require('@/src/assets/logos/Logo Idea 2/Inverted Squere Logo.png'),

        /** Circular badge logo with Forest Green background */
        CIRCLE_LOGO: require('@/src/assets/logos/Logo Idea 2/Circle Logo.png'),

        /** Circular badge logo with white background */
        CIRCLE_LOGO_INVERTED: require('@/src/assets/logos/Logo Idea 2/Inverted Circle Logo.png'),
    },
} as const;

export type BrandConfig = typeof BRAND;
