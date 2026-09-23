
import { Stack } from "expo-router";

import CustomLoading from "@/src/components/CustomLoading";
import { UpdateUserFlow } from "@/src/core/flows/UpdateUserFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import ProfileInfoScreen from "@/src/features/Settings/screens/ProfileInfoScreen";

export default function ViewUser() {
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

    if (!profile || isLoading) return <CustomLoading message="Loading Profile" />

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
    )
}