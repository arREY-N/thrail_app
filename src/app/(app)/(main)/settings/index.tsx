/**
 * @file index.tsx
 * @description Controller for the main settings page.
 */

import { SignOutFlow } from '@/src/core/flows/SignOutFlow';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import { Role, useAuthHook } from '@/src/core/models/User/User';
import SettingsScreen from '@/src/features/Settings/screens/SettingsScreen';

/**
 * SettingsPage coordinates navigation options, sign out triggers, and role-based actions.
 */
export default function Settings() {
    const { profile, role } = useAuthHook();

    const {
        onProfilePress,
        onSecuritySettingsPress,
        onPrivacySettingsPress,
        onAboutSettingsPress,
        onTestSettingsPress,
        onUserViewPress
    } = useAppNavigation();

    const { signOut } = SignOutFlow();

    const {
        onAdminPress,
        onSuperadminPress,
        onApplyPress,
    } = useProfileNavigation();

    return (
        <SettingsScreen
            role={role as Role}
            onBackPress={onProfilePress}

            onProfileInfoPress={() => onUserViewPress(profile?.id)}
            onSecurityPress={onSecuritySettingsPress}
            onAdminPress={onAdminPress}
            onSuperadminPress={onSuperadminPress}
            onApplyPress={onApplyPress}

            onPrivacySettingsPress={onPrivacySettingsPress}

            onAboutPress={onAboutSettingsPress}
            onTestPress={onTestSettingsPress}

            onSignOutPress={signOut}
        />
    );
}
