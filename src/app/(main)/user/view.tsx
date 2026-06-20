import LoadingScreen from "@/src/app/loading";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import useUser from "@/src/core/hook/user/useUser";
import React, { useState } from 'react';
// import useUserWrite from "@/src/core/hook/user/useUserWrite";

import { Stack, useLocalSearchParams } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import ProfileInfoScreen from "@/src/features/Settings/screens/ProfileInfoScreen";

export default function viewUser(){
    const { userId: rawUserId } = useLocalSearchParams();
    
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    
    const { role } = useAuthHook();

    const { 
        user, 
        isLoading 
    } = useUser({ role, id: userId });
    
    // const {
    //     onDeleteAccountPress
    // } = useUserWrite();
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

    if(!user || isLoading) return <LoadingScreen/>

    console.log(user);

    return(
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