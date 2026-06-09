import { auth, db } from "@/src/core/config/Firebase";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { router } from "expo-router";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";

export interface DeleteProfileContract {
    /**
     * Deletes the user's profile after re-authenticating with the provided password.
     * @param password The user's current password, required for re-authentication before deletion. Must not be empty. 
     * @returns  
     */
    onDeleteProfile: (password: string) => Promise<void>;
    
    /**
     * Indicates whether the delete profile operation is currently in progress. True when the operation is ongoing, false otherwise.
     */
    isLoading: boolean;

    /**
     * Local error state for the delete profile operation. This will contain any error messages resulting from a failed delete attempt, which can be used to display feedback to the user.
     */
    localError: string | null;
}

export default function useDeleteProfile(): DeleteProfileContract {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onDeleteProfile = async (password: string) => {
        try {
            setIsLoading(true);
            console.log('attempt: ', password)
            if(!profile || !auth.currentUser) throw new Error("No user profile found.");

            if(!password) throw new Error("Password is required to delete profile.");

            const targetUid = profile.id;
            const currentUser = auth.currentUser;
            const email = auth.currentUser.email;

            if(!email) throw new Error("Current user does not have an email associated.");

            const credential = EmailAuthProvider.credential(email, password);
            await reauthenticateWithCredential(currentUser, credential);
            
            
            const userDoc = doc(db, 'users', targetUid);
            await deleteDoc(userDoc);
            await deleteUser(currentUser);
            
            router.replace('/(auth)/landing');
        } catch (error) {
            console.error("Error deleting profile:", error);
            setLocalError(`Failed to delete profile. ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        onDeleteProfile,
        isLoading,
        localError,
    }
}