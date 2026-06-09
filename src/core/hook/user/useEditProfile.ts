import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { editUser, User } from "@/src/core/models/User/User";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { useState } from "react";

export interface EditProfileContract {
    /**
     * Function to edit the user's profile. Accepts an object containing the fields to be updated and their new values. The function will handle the update process, including error handling and loading state management.
     * 
     * @example
     * await editProfile({ 
     *  username: 'newUsername' 
     * });
     * 
     * @example
     * await editProfile({
     *  phoneNumber: '1234567890'
     *  username: 'newUsername'
     * })
     * 
     * @param updates An object containing the fields to update and their new values. This can include any subset of the User model fields, such as username, phoneNumber, address, etc.
     * 
     * @returns void
     */
    editProfile: (updates: Partial<Pick<User, 'username' | 'address' | 'birthday' | 'phoneNumber' | 'preferences' | 'medicalProfile' | 'emergencyContact'>>) => Promise<void>;
    
    /**
     * Local error state for the edit profile operation. This will contain any error messages resulting from a failed profile update attempt, which can be used to display feedback to the user.
     */
    localError: string | null;

    profile: ReturnType<typeof useAuthHook>['profile'];

    isLoading: boolean;
}

/**
 * Hook for editing user profile information. Provides a function to update the user's profile and manages local loading and error states.
 * @returns An object containing the editProfile function, localError state, isLoading state, and the current user profile.
 */
export default function useEditProfile(): EditProfileContract {
    const { profile, isLoading } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);
    const updateUser = useUsersStore(s => s.create);

    const editProfile = async (updates: Partial<Pick<User, 'username' | 'address' | 'birthday' | 'phoneNumber' | 'preferences' | 'medicalProfile' | 'emergencyContact'>>) => {
        try {
            setLocalError(null);

            console.log("Current profile:", profile);
            console.log("Requested updates:", updates);

            if(!profile) throw new Error("No user profile found.");

            const updatedProfile = editUser({ user: profile, updates });

            const response = await updateUser(updatedProfile);

            if (!response) {
                throw new Error("Failed to update user profile.");
            }
        } catch (error) {
            console.log("Error editing profile:", error);
            setLocalError(`Failed to edit profile. ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    return {
        editProfile,
        localError,
        isLoading,
        profile,
    }
}