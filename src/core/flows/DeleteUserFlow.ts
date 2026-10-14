import { auth, db } from "@/src/core/config/Firebase";
import { useAuthHook } from "@/src/core/models/User/User";
import { router } from "expo-router";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";

export function DeleteUserFlow() {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onDeleteProfile = async (password: string) => {
        try {
            setIsLoading(true);

            if (!profile) throw new Error("No user profile found.");

            if (!password) throw new Error("Password is required to delete profile.");

            const targetUid = profile.id;
            const currentUser = auth.currentUser;
            const email = currentUser?.email;

            if (!email) throw new Error("Current user does not have an email associated.");

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