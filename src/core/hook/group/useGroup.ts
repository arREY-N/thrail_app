import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import useBookingsStore from "@/src/core/stores/bookingsStore";
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
    const [booking, setBooking] = useState<Booking | null>(null);
    const bookings = useBookingsStore(s => s.userBookings);
    const [localError, setLocalError] = useState<string | null>(null);
    const load = useBookingsStore(s => s.load);
    useEffect(() => {
        if (!groupId) return;

        subscribe(groupId);
        setCurrentGroup(groups.find(g => g.id === groupId) ?? null);    
        
        return () => unsubscribe(groupId);
        
    }, [groupId]);
    
    useEffect(() => {
        const fetch = async () => {

            if (currentGroup && profile) {
                console.log('current group: ', currentGroup);
                console.log('profile: ', profile);
                const bookingId = currentGroup.members.find(m => m.id === profile?.id)?.bookingId;
                console.log('found bookingId: ', bookingId);
                if(profile.role === 'admin' && !bookingId) {    
                    console.log('is admin');
                    setBooking(new Booking({
                        id: 'admin-booking',
                        status: 'paid',
                        trail: currentGroup.trail,
                        business: currentGroup.business,
                        user: UserLogic.toSummary(profile),
    
                    }));
                    return;
                }
    
                if(!bookingId) {
                    console.warn(`No bookingId found for user ${profile.id} in group ${groupId}`);
                    setLocalError('No booking found for this user in the selected group');
                    return;
                }
                
                await load(profile.id);
                const found = bookings.find(booking => booking.id === bookingId);   
                if(!found) {
                    console.log('failed to fetch booking by ID');
                    setLocalError('Failed to fetch booking by ID');
                    return;
                }
    
                console.log(found)
                setBooking(found);
            }
        }

        fetch();
        
    }, [currentGroup, profile?.id]);

    const onViewGroupLocation = (groupId: string) => {
        router.push({
            pathname: '/(main)/group/location',
            params: { groupId, bookingId }
        })
    }
    
    return {  
        currentGroup,
        booking,
        onViewGroupLocation
    };
};