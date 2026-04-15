import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Group } from "@/src/core/models/Group/Group";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export const useGroup = (groupId: string) => {
    const subscribe = useGroupStore(s => s.subscribeToGroup);
    const unsubscribe = useGroupStore(s => s.unsubscribeFromGroup);
    const { profile }= useAuthHook();
    
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const groups = useGroupStore(s => s.groups);
    const [bookingId, setBookingId] = useState<string>();

    useEffect(() => {
        if (!groupId) return;

        subscribe(groupId);
        setCurrentGroup(groups.find(g => g.id === groupId) ?? null);    
        
        return () => unsubscribe(groupId);
        
    }, [groupId, subscribe, unsubscribe, currentGroup]);
    
    useEffect(() => {
        if (currentGroup && profile) {
            const bookingId = currentGroup?.members.find(m => m.id === profile?.id)?.bookingId;
            
            if(!bookingId) {
                console.warn(`No bookingId found for user ${profile.id} in group ${groupId}`);
                return;
            }
            
            setBookingId(bookingId ?? null);
        }
    }, [currentGroup, profile?.id]);

    const onViewGroupLocation = (groupId: string) => {
        router.push({
            pathname: '/(main)/group/location',
            params: { groupId, bookingId }
        })
    }
    
    return {  
        currentGroup,
        bookingId,
        onViewGroupLocation
    };
};