/**
 * @file index.tsx
 * @description Controller for the privacy & permissions settings page.
 */

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useDevicePermissions } from '@/src/core/models/User/User';
import PermissionsScreen from '@/src/features/Settings/screens/PermissionsScreen';

/**
 * PrivacyPage coordinates user profile privacy and hardware permissions settings.
 */
export default function Privacy() {
    const { onBackPress } = useAppNavigation();
    const { 
        statuses, 
        requestPermission 
    } = useDevicePermissions();

    return (
        <PermissionsScreen
            onBackPress={onBackPress}
            permissionStatuses={statuses}
            onRequestPermission={requestPermission}
        />
    );
}
