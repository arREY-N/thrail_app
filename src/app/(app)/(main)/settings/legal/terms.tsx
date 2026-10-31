/**
 * @file terms.tsx
 * @description Authenticated route controller for Terms of Service.
 */
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import TermsScreen from "@/src/features/Legal/screens/TermsScreen";
import React from 'react';

export default function SettingsTerms() {
    const { onBackPress } = useAppNavigation();

    return (
        <TermsScreen 
            onBackPress={onBackPress}
        />
    );
}

