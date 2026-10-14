import { CreateEmergencyChatFlow } from "@/src/core/flows/CreateEmergencyChatFlow";
import { User, newEmergencyContact, newUser, useAuthStore, useUserStore } from "@/src/core/models/User/User";

import { useState } from "react";


export function EmergencyContactFlow() {
    const [localError, setLocalError] = useState<string | null>(null);
    const { createNewEmergencyChatGroup } = CreateEmergencyChatFlow();

    const profile = useAuthStore(s => s.profile);

    const loadUserByEmail = useUserStore(s => s.loadUserByEmail);
    const setContact = useUserStore(s => s.setEmergencyContact);

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

    const setEmergencyContact = async (emergencyContact: User) => {
        try {
            if (!profile) throw new Error("No user profile found");

            if (!emergencyContact) throw new Error("No emergency contact provided");

            if (profile.id === emergencyContact.id) throw new Error("Cannot set yourself as an emergency contact");

            let chatId: string | null = null;
            if (emergencyContact.id) {
                const group = await createNewEmergencyChatGroup(emergencyContact);

                if (!group) return;

                chatId = group.id
            }

            const newContact = newEmergencyContact({
                userId: emergencyContact.id,
                contactNumber: emergencyContact.phoneNumber,
                email: emergencyContact.email,
                name: emergencyContact.firstname + ' ' + emergencyContact.lastname,
                chatId,
            })

            await setContact(profile, newContact);

            useAuthStore.setState({
                profile: newUser({
                    ...profile,
                    emergencyContact: newContact
                })
            });

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