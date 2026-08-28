import { newGroup, useGroupStore } from "@/src/core/models/Group/Group";
import { IEmergencyContact, User, newUser, useAuthStore, useUserStore } from "@/src/core/models/User/User";



import { useState } from "react";


export function EmergencyContactFlow() {
    const [localError, setLocalError] = useState<string | null>(null);

    const profile = useAuthStore(s => s.profile);

    const loadUserByEmail = useUserStore(s => s.loadUserByEmail);
    const setContact = useUserStore(s => s.setEmergencyContact);
    const checkGroupExists = useGroupStore(s => s.checkGroupExists);
    const createGroup = useGroupStore(s => s.createGroup);

    const findUser = async (email: string) => {
        try {
            console.log("Finding user with email:", email);
            const users = await loadUserByEmail(email);

            if (users.length === 0) {
                return []
            }

            return users;
        } catch (error) {
            console.error("Error finding user:", error);
            setLocalError((error as Error).message || "Error finding user");
            return [];
        }
    }

    const setEmergencyContact = async (emergencyContact: IEmergencyContact, user?: User) => {
        try {
            console.log("Setting emergency contact:", emergencyContact);

            if (!profile) throw new Error("No user profile found");

            if (!emergencyContact) throw new Error("No emergency contact provided");

            if (profile.id === emergencyContact.userId) throw new Error("Cannot set yourself as an emergency contact");

            await setContact(profile, emergencyContact);

            useAuthStore.setState({
                profile: newUser({
                    ...profile,
                    emergencyContact: emergencyContact
                })
            });

            if (user) {
                const groupId = [`${profile.id}_${emergencyContact.userId}`, `${emergencyContact.userId}_${profile.id}`];

                try {
                    for (const id of groupId) {
                        await checkGroupExists(id);
                        console.log("Existing group found for emergency contact:");
                    }
                } catch (error) {
                    const safeProfile = {
                        id: profile.id || '',
                        username: profile.username || '',
                        firstname: profile.firstname || '',
                        lastname: profile.lastname || '',
                        email: profile.email || ''
                    };
                    const safeUser = {
                        id: user.id || '',
                        username: user.username || '',
                        firstname: user.firstname || '',
                        lastname: user.lastname || '',
                        email: user.email || ''
                    };

                    const contactChat = newGroup({
                        type: 'chat',
                        id: groupId[0],
                        members: [safeProfile, safeUser],
                        participantsIds: [profile.id, user.id],
                    });

                    createGroup(contactChat);
                    console.log('created group: ', contactChat);
                }
            }
            return true;
        } catch (error) {
            console.log("Error setting emergency contact:", error);
            setLocalError((error as Error).message || "Error setting emergency contact");
            return false;
        }
    }

    return {
        findUser,
        setEmergencyContact,
        localError
    }
}