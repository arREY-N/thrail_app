/**
 * @file index.tsx
 * @description Controller for the Security settings page, handling password update and account deletion routing.
 */
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import SecurityScreen from '@/src/features/Settings/screens/SecurityScreen';
import React from 'react';

/**
 * SecurityPage component coordinates callbacks for password updates and account deletion.
 */
export default function security() {
    const { onBackPress } = useAppNavigation();

    // The backend team will wire these functions to the real auth operations
    const handleChangePassword = async (oldPass: string, newPass: string) => {
        // TODO: [Backend] Re-authenticate with oldPass and update to newPass
    };

    const handleVerifyPassword = async (password: string): Promise<boolean> => {
        // TODO: [Backend] Re-authenticate user. Return true if correct, throw Error if invalid.
        return true;
    };

    const handleDeleteAccount = async (password: string) => {
        // TODO: [Backend] Final delete account action
    };
    
    return (
        <SecurityScreen 
            onChangePasswordPress={handleChangePassword}
            onVerifyPassword={handleVerifyPassword}
            onDeleteAccount={handleDeleteAccount}
            onBackPress={onBackPress}
        />
    );
}
