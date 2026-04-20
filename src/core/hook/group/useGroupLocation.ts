import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import { Message } from "@/src/core/models/Message/Message";
import { MessageRepository } from "@/src/core/repositories/messageRepository";
import { useFilesStore } from "@/src/core/stores/fileStore";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function useGroupLocation(groupId: string) {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);  

    const isLive = useHikesStore(s => s.live);

    const rawLocation = useHikesStore(s => s.locationByGroup[groupId])

    const location = rawLocation ?? [];
    
    const currentHike = useHikesStore(s => s.currentHike)
    const active = useHikesStore(s => s.active);

    const shareLocation = useHikesStore(s => s.startShareLocation);
    const stopSharingLocation = useHikesStore(s => s.stopShareLocation);    
    const coordinates = useHikesStore(s => s.coordinates);  
    
    const updateHikeStore = useHikesStore(s => s.updateHikeStore);
    const updateCurrentHike = useHikesStore(s => s.updateCurrentHike);
    const startHike = useHikesStore(s => s.startHike);
    const getLastKnownCoordinate = useHikesStore(s => s.getLastKnownCoordinate);
    const timerStartTime = useHikesStore(s => s.timerStartTime);
    const elapsedTime = useHikesStore(s => s.elapsedTime);

    const uploadDocument = useFilesStore(s => s.uploadDocument);
    const capturePhoto = useFilesStore(s => s.capturePhoto);    

    const create = useHikesStore(s => s.create);
    
    if(Platform.OS === 'web') {
        const tick = () => {
            if(!currentHike || currentHike.status !== 'started' || !timerStartTime){
                return;
            } 
            useHikesStore.getState().addCoordinate(new Location({
                latitude: new Date().getHours(),
                longitude: new Date().getMinutes(),
                altitude: new Date().getSeconds(),
                timestamp: new Date(),
            }));
            
            const now = Date.now();
    
            updateHikeStore({ elapsedTime: now - timerStartTime });
        }
    
        useEffect(() => {
            let interval: ReturnType<typeof setInterval> | undefined;
    
            if(currentHike?.status === 'started') {
                interval = setInterval(() => {
                    tick();
                }, 1000);
            }
    
            return () => {
                if(interval) clearInterval(interval);
            }
        },[currentHike?.status])
    
    }

    const onStartSharingLocation = async () => {
        try {
            await shareLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }    
    }

    const onStopSharingLocation = () => {
        try {            
            stopSharingLocation(groupId);    
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while stopping location sharing.");
        }
    }

    const onSendPicture = async () => {
        try {
            let documentUrl: string | null = null;

            if(Platform.OS === 'web') {
                documentUrl = await uploadDocument();
            } else if (Platform.OS === 'android' || Platform.OS === 'ios') {
                documentUrl = await capturePhoto();
            }

            if(!documentUrl)
                throw new Error(`Failed to capture or upload photo`);
            
            const newMessage = new Message({
                content: `${documentUrl}`,
                senderId: profile!.id,
                senderName: profile!.firstname,
                timesent: new Date(),
            })
            
            MessageRepository.sendMessage(groupId, newMessage);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sending picture.");
        }
    }

    const onEmergencyPress = () => {
        if(!profile || !groupId) return;

        const coordinate = getLastKnownCoordinate();
        
        if(!coordinate) {
            setLocalError("No location data available to send emergency alert");
            return;

        }
        
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${coordinate.latitude},${coordinate.longitude}`

        const newMessage = new Message({
            content: `Send help! \n\nLast known location: ${mapLink} \n\nTime: ${coordinate.timestamp}`,
            senderId: profile.id,
            senderName: profile.firstname,
            timesent: new Date(),
        })

        MessageRepository.sendMessage(groupId, newMessage);
    }

    const onStartHike = async (group: Group, booking: Booking) => {
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
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }    
    };

    const onResumeHike = () => {
        if (!currentHike || currentHike.status !== 'paused') {
            setLocalError("No paused hike to resume");
            return;
        }

        const newStartTime = Date.now() - elapsedTime; 

        updateCurrentHike({
            status: 'started', 
        });

        updateHikeStore({
            timerStartTime: newStartTime,
        });
    }

    const onPauseHike = () => {
        if (!currentHike || currentHike.status !== 'started') {
            setLocalError("No active hike to pause");
            return;
        }

        updateCurrentHike({ status: 'paused' });
    }

    const onCompleteHike = async () => {
        if (!currentHike) {
            setLocalError("No active hike to complete");
            return;
        }

        updateHikeStore({
            active: false,
            elapsedTime: 0,
            timerStartTime: undefined,
        })

        updateCurrentHike({ 
            status: 'completed', 
            endTime: new Date()
        });

        await create(profile!.id);
    }

    return {
        onStartSharingLocation,
        onStopSharingLocation,
        onStartHike,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onEmergencyPress,
        onSendPicture,
        location,
        error: localError,
        isLive,
        currentHike
    }
}