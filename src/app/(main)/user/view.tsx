import LoadingScreen from "@/src/app/loading";
import { useAuthHook } from "@/src/core/models/User/User";
import { useState } from 'react';

import { Stack } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import ProfileInfoScreen from "@/src/features/Settings/screens/ProfileInfoScreen";

export default function ViewUser() {
    const { profile: user } = useAuthHook();

    const [isEditing, setIsEditing] = useState(false);

    const {
        onBackPress
    } = useAppNavigation();

    const onEditPress = () => {
        // TODO: [Backend] Implement navigation to edit profile screen
        console.log("Edit Button clicked");
        setIsEditing(true);
    };

    const onCancelPress = () => {
        setIsEditing(false);
    };

    const onSavePress = async (updatedFields: any) => {
        console.log("Saving fields in placeholder:", updatedFields);
        // TODO: [Backend] Connect this to useEditProfile hook
        setIsEditing(false);
    };

    if (!user) return <LoadingScreen />

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <ProfileInfoScreen
                user={user}
                onBackPress={onBackPress}
                onEditPress={onEditPress}
                isEditing={isEditing}
                onCancelPress={onCancelPress}
                onSavePress={onSavePress}
            />
        </>
    )
}