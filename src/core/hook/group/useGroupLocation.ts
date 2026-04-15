import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { useEffect, useState } from "react";

export default function useGroupLocation(groupId: string) {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);  

    const isLive = useHikesStore(s => s.live);

    const rawLocation = useHikesStore(s => s.locationByGroup[groupId])

    const location = rawLocation ?? [];
    
    const currentHike = useHikesStore(s => s.currentHike)
    const isActive = useHikesStore(s => s.active);

    const shareLocation = useHikesStore(s => s.startShareLocation);
    const stopSharingLocation = useHikesStore(s => s.stopShareLocation);    
    const coordinates = useHikesStore(s => s.coordinates);  
    
    const updateHikeStore = useHikesStore(s => s.updateHikeStore);
    const updateCurrentHike = useHikesStore(s => s.updateCurrentHike);
    const startHike = useHikesStore(s => s.startHike);

    const timerStartTime = useHikesStore(s => s.timerStartTime);
    let intervals: ReturnType<typeof setInterval>[] | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;

    useEffect(() => {
        if(currentHike?.status === 'started' && !interval) {
            interval = setInterval(() => {
                if(!currentHike || currentHike.status !== 'started' || !timerStartTime) {
                    return;
                } 
                useHikesStore.getState().addCoordinate(new Location({
                    latitude: Math.random() * 180 - 90,
                    longitude: Math.random() * 360 - 180,
                    altitude: Math.random() * 2000,
                    timestamp: new Date(),
                }));
                
                const now = Date.now();
        
                updateHikeStore({ elapsedTime: now - timerStartTime });
            }, 1000);

            (intervals ?? []).push(interval);
        }

        return () => {
            if(interval) clearInterval(interval);
        }
    },[currentHike])

    console.log('active hike: ', currentHike);
    const onStartSharingLocation = async (group: Group, booking: Booking) => {
        try {
            if(!profile)
                throw new Error("User not authenticated. Please log in to share location");

            if(currentHike && currentHike.trail.id !== group.trail.id)
                throw new Error(`You already have an active hike in ${currentHike?.trail.name} for a different trail. Please end that hike before starting a new one.`);

            const hike = new Hike({
                status: 'started',
                mode: 'booked',
                bookingId: booking.id,
                startTime: new Date(),
                hikeDate: booking.offer.date,
                trail: group.trail,
            });
            
            updateHikeStore({ currentHike: hike });
            await startHike(profile.id);
            await shareLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }    
    }

    const onStopSharingLocation = () => {
        try {            
            updateCurrentHike({ status: 'paused'});
            stopSharingLocation(groupId);    
            if(intervals){
                intervals.forEach(i => clearInterval(i));
            }    
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while stopping location sharing.");
        }
    }

    return {
        onStartSharingLocation,
        onStopSharingLocation,
        location,
        error: localError,
        isLive,
        currentHike
    }
}