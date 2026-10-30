/**
 * @file privacy.tsx
 * @description Authenticated route controller for Privacy Policy.
 */
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import PrivacyScreen from "@/src/features/Legal/screens/PrivacyScreen";
import React from 'react';

export default function SettingsPrivacy() {
    const { onBackPress } = useAppNavigation();

    return (
        <PrivacyScreen 
            onBackPress={onBackPress}
        />
    );
}

