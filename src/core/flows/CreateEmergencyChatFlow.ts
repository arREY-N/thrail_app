import { generateChatId, getGroup, newGroup, useGroup } from "@/src/core/models/Group/Group";
import { useAuthHook, User } from "@/src/core/models/User/User";
import { useState } from "react";

export function CreateEmergencyChatFlow() {
    const { profile } = useAuthHook();
    const { createGroup, isLoading, error } = useGroup()
    const [hookError, setHookError] = useState<string | null>(null);

    const createNewEmergencyChatGroup = async (contact: User) => {
        try {
            if (!profile)
                throw new Error('No profile found. Please log in.')

            if (!contact)
                throw new Error('Please provide a contact person to create new group.')

            const chatId = generateChatId(profile.id, contact.id);

            const existing = await getGroup(chatId);

            if (existing) return existing;

            const newChat = newGroup({
                id: chatId,
                type: 'chat',
                participantsIds: [profile.id, contact.id],
                members: [
                    {
                        id: profile.id,
                        username: profile.username,
                        firstname: profile.firstname,
                        lastname: profile.lastname,
                        email: profile.email
                    },
                    {
                        id: contact.id,
                        username: contact.username,
                        firstname: contact.firstname,
                        lastname: contact.lastname,
                        email: contact.email
                    }
                ]
            });

            await createGroup(newChat)

            return newChat;
        } catch (error) {
            setHookError((error as Error).message)
        }
    }

    return {
        createNewEmergencyChatGroup,
        error: hookError || error,
        isLoading
    }
}