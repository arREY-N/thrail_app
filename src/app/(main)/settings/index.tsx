/**
 * @file index.tsx
 * @description Controller for the main settings page.
 */

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import { useAuthHook } from '@/src/core/models/User/User';
import SettingsScreen from '@/src/features/Settings/screens/SettingsScreen';

/**
 * SettingsPage coordinates navigation options, sign out triggers, and role-based actions.
 */
export default function Settings() {
    const { profile } = useAuthHook();

    const {
        // onBackPress,
        onProfilePress,
        onSecuritySettingsPress,
        onNotificationSettingsPress,
        onPrivacySettingsPress,
        onAboutSettingsPress,
        onUserViewPress
    } = useAppNavigation();

    const {
        role,
        onSignOutPress
    } = useAuthHook();

    const {
        onAdminPress,
        onSuperadminPress,
        onApplyPress,
    } = useProfileNavigation();

    return (
        <SettingsScreen
            role={role as string}
            onBackPress={onProfilePress}

            onProfileInfoPress={() => onUserViewPress(profile?.id)}
            onSecurityPress={onSecuritySettingsPress}
            onAdminPress={onAdminPress}
            onSuperadminPress={onSuperadminPress}
            onApplyPress={onApplyPress}

            onPrivacySettingsPress={onPrivacySettingsPress}
            onNotificationsPress={onNotificationSettingsPress}

            onAboutPress={onAboutSettingsPress}

            onSignOutPress={onSignOutPress}
        />
    );
}
