/**
 * @file policies.tsx
 * @description Authenticated route controller for Booking & Organizer Policies.
 */
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import BusinessPoliciesScreen from "@/src/features/Legal/screens/BusinessPoliciesScreen";
import React from 'react';

export default function SettingsPolicies() {
    const { onBackPress } = useAppNavigation();

    return (
        <BusinessPoliciesScreen 
            onBackPress={onBackPress}
        />
    );
}

