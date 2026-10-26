/**
 * @file branding-preview.tsx
 * @description Expo Router controller for the development Branding & Splash Sandbox.
 * Composes navigation back-press handling and renders BrandingPreviewScreen.
 */

import React from 'react';
import { router } from 'expo-router';

import BrandingPreviewScreen from '@/src/features/Branding/screens/BrandingPreviewScreen';

/**
 * Controller component for /branding-preview route.
 */
export default function brandingPreview(): React.JSX.Element {
    const handleBackPress = (): void => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    return <BrandingPreviewScreen onBackPress={handleBackPress} />;
}
