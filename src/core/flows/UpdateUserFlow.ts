import { IUser, newUser, useAuthHook, User, useUserStore } from "@/src/core/models/User/User";
import { useState } from "react";

export function UpdateUserFlow() {
    const { profile, isLoading: authIsLoading } = useAuthHook();
    const [isEditing, setIsEditing] = useState(false);
    const userIsLoading = useUserStore(s => s.isLoading);

    const createUser = useUserStore(s => s.create);

    const onSaveAccount = async (updatedFields: Partial<IUser>) => {
        const updatedUser: User = newUser({
            ...profile,
            ...updatedFields,
        })

        setIsEditing(false);
        console.log('updated user: ', updatedUser);
        await createUser(updatedUser);
    }

    const onEditPress = () => {
        // TODO: [Backend] Implement navigation to edit profile screen
        console.log("Edit Button clicked");
        setIsEditing(true);
    };

    const onCancelPress = () => {
        setIsEditing(false);
    };

    return {
        onEditPress,
        onCancelPress,
        onSaveAccount,
        isLoading: authIsLoading || userIsLoading,
        isEditing,
        profile
    }
}