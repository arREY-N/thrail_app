import { Group } from "@/src/core/models/Group/Group";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { User } from "@/src/core/models/User/User";
import { IEmergencyContact } from "@/src/core/models/User/User.types";
import { useAuthStore } from "@/src/core/stores/authStores/authStore.native";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { useState } from "react";

export function useEmergencyContact(){
    const [localError, setLocalError] = useState<string | null>(null);
    
    const profile = useAuthStore(s => s.profile);

    const loadUserByEmail = useUsersStore(s => s.loadUserByEmail);
    const setContact = useUsersStore(s => s.setEmergencyContact);
    const checkGroupExists = useGroupStore(s => s.checkGroupExists);
    const createGroup = useGroupStore(s => s.createGroup);

    const findUser = async (email: string) => {
        try {
            console.log("Finding user with email:", email);
            const users = await loadUserByEmail(email);

            if(users.length === 0) {
                return []
            }

            return users;
        } catch (error) {
            console.error("Error finding user:", error);
            setLocalError((error as Error).message || "Error finding user");
        }
    }

    const setEmergencyContact = async (emergencyContact: IEmergencyContact, user?: User) => {
        try {
            console.log("Setting emergency contact:", emergencyContact);

            if (!profile) throw new Error("No user profile found");
            
            if(!emergencyContact) throw new Error("No emergency contact provided");

            if(profile.id === emergencyContact.userId) throw new Error("Cannot set yourself as an emergency contact");

            await setContact(profile, emergencyContact);

            if(user){
                const groupId = [`${profile.id}_${emergencyContact.userId}`, `${emergencyContact.userId}_${profile.id}`];
    
                try {
                    for(const id of groupId) {
                        await checkGroupExists(id);
                        console.log("Existing group found for emergency contact:");
                    }
                } catch (error) {
                    const contactChat = new Group({
                        type: 'chat',
                        id: groupId[0],
                        members: [
                            UserLogic.toSummary(profile), 
                            UserLogic.toSummary(user),
                        ],
                        participantsIds: [profile.id, user.id],
                    });
    
                    createGroup(contactChat);
                    console.log('created group: ', contactChat);
                }
            }
        } catch (error) {
            console.log("Error setting emergency contact:", error);
            setLocalError((error as Error).message || "Error setting emergency contact");
        }
    }
   
    return {
        findUser,
        setEmergencyContact,
        localError
    }
}