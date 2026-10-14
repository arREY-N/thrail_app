
/**
 * @file view.tsx
 * @description Controller for the user profile view screen, managing profile loading, editing transitions, and account updates.
 */

import { Stack } from "expo-router";

import CustomLoading from "@/src/components/CustomLoading";
import { UpdateUserFlow } from "@/src/core/flows/UpdateUserFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import ProfileInfoScreen from "@/src/features/Settings/screens/ProfileInfoScreen";

/**
 * Controller component for rendering and managing the active user's profile info.
 *
 * @returns {React.JSX.Element} The rendered controller view.
 */
export default function ViewUser(): React.JSX.Element {
    const {
        onEditPress,
        onCancelPress,
        onSaveAccount,
        isEditing,
        profile,
        isLoading,
    } = UpdateUserFlow();

    const {
        onBackPress
    } = useAppNavigation();

    if (!profile || isLoading) return <CustomLoading message="Loading Profile" />;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <ProfileInfoScreen
                user={profile}
                onBackPress={onBackPress}
                onEditPress={onEditPress}
                isEditing={isEditing}
                onCancelPress={onCancelPress}
                onSavePress={onSaveAccount}
            />
        </>
    );
}
