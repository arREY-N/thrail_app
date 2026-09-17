/**
 * @file index.tsx
 * @description Controller for the Hiking Preferences settings page.
 */
import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useUser } from '@/src/core/models/User/User';

import HikingPreferencesScreen from '@/src/features/Settings/screens/HikingPreferencesScreen';

/**
 * PreferencesPage coordinates fetching and displaying user hiking preferences.
 */
export default function Preferences() {
    const { onBackPress } = useAppNavigation();

    const { user, isLoading } = useUser();

    if (isLoading || !user) {
        return <LoadingScreen />;
    }

    const onEditPress = () => {
        // TODO: [Backend] Implement navigation or logic for editing preferences
    };

    return (
        <HikingPreferencesScreen
            onBackPress={onBackPress}
            onEditPress={onEditPress}
            preferences={user.preferences}
        />
    );
}
