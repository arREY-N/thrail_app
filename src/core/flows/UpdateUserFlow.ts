import { CreateEmergencyChatFlow } from "@/src/core/flows/CreateEmergencyChatFlow";
import { getUser, IUser, newUser, useAuthHook, User, useUserStore } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { useState } from "react";

export function UpdateUserFlow() {
    const [flowError, setFlowError] = useState<string | null>(null);

    const { profile, isLoading: authIsLoading } = useAuthHook();
    const [isEditing, setIsEditing] = useState(false);
    const userIsLoading = useUserStore(s => s.isLoading);

    const createUser = useUserStore(s => s.create);
    const { createNewEmergencyChatGroup } = CreateEmergencyChatFlow();

    const onSaveAccount = async (updatedFields: Partial<IUser>) => {
        try {
            let group = null;

            const updatedUser: User = newUser({
                ...profile,
                ...updatedFields,
            })

            if (updatedFields.emergencyContact && updatedFields.emergencyContact.userId) {
                const user = await getUser(updatedFields.emergencyContact.userId);
                const accountName = user.firstname + " " + user.lastname;
                const accountNumber = user.phoneNumber;

                const providedName = updatedFields.emergencyContact.name;
                const providedNumber = updatedFields.emergencyContact.contactNumber;

                if (accountName !== providedName)
                    throw new Error(`Mismatched Emergency Contact Information. Provided name is ${providedName}, expected name is ${accountName}`)

                if (accountNumber !== providedNumber)
                    throw new Error(`Mismatched Emergency Contact Information. Provided number is ${providedNumber}, expected name is ${accountNumber}`)

                group = await createNewEmergencyChatGroup(user);
            }

            updatedUser.emergencyContact.chatId = group?.id ?? null;

            await createUser(updatedUser);
        } catch (error) {
            catchError(error as Error, 'UpdateUserFlow');
            setFlowError((error as Error).message);
        }

        setIsEditing(false);
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
        profile,
        error: flowError,
    }
}