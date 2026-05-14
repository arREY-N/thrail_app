import { useHikerGPS } from "@/src/core/hook/trail/useHikerGPS";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useEffect, useState } from "react";

export default function useCurrentHike(trailId: string){
    const [localError, setLocalError] = useState<string | null>(null);

    const profile = useAuthStore(s => s.profile);

    const currentHike = useHikesStore(s => s.currentHike);
    const elapsedTime = useHikesStore(s => s.elapsedTime);
    const timerStartTime = useHikesStore(s => s.timerStartTime);
    const isLoading = useHikesStore(s => s.isLoading);
    const active = useHikesStore(s => s.active);
    const startHike = useHikesStore(s => s.startHike);

    const { onStartGps, onEndGps } = useHikerGPS();

    const [lastKnownCoordinate, setLastKnownCoordinate] = useState<Location | null>(null);
    const coordinates = useHikesStore(s => s.coordinates);
    const updateCurrentHike = useHikesStore(s => s.updateCurrentHike);
    const updateHikeStore = useHikesStore(s => s.updateHikeStore);  

    const trails = useTrailsStore(s => s.data); 

    useEffect(() => {
        if(coordinates.length === 0) return;

        const lastCoordinate = coordinates[coordinates.length - 1];
        setLastKnownCoordinate(lastCoordinate);
    },[coordinates])
    useEffect(() => {
        if(active && currentHike && currentHike.trail.id !== trailId){
            console.log(`Active hike found for a different trail: ${currentHike?.trail.id}`);
            setLocalError(`Active hike found for a different trail: ${currentHike?.trail.id}`);
            return;
        }

        if(trailId && currentHike?.trail.id !== trailId){
            const trail = trails.find(t => t.id === trailId);  

            if(!trail) {
                setLocalError('Trail not found');
                return;
            }

            const hike = new Hike({
                trail: TrailLogic.toSummary(trail),
                status: 'unhiked',
                mode: 'direct'
            })

            updateHikeStore({ currentHike: hike });
        }

        return () => {
            console.log('Unmounting useCurrentHike, checking if hike needs to be reset', currentHike);
            if(currentHike && (currentHike.status === 'unhiked' || currentHike.status === 'completed')){
                console.log('resetting current hike on unmount', currentHike);
                updateHikeStore({ 
                    currentHike: null,
                    active: false,
                 });
            } else {
                console.log('not resetting current hike on unmount because hike is active');
                console.log(currentHike);
            }
        }
    },[trailId]);

    useEffect(() => {
        if(currentHike && currentHike.status !== 'started'){
            return;
        }

        const interval = setInterval(() => {
            const currentElapsed = Date.now() - timerStartTime;
            updateHikeStore({ elapsedTime: currentElapsed });
        }, 500);

        return () => clearInterval(interval);
    },[active, currentHike?.status,]);

    const onResetHike = () => {
        if(!currentHike) {
            setLocalError("No hike data available to reset");
            return;
        }

        updateCurrentHike({ status: 'unhiked' });
        updateHikeStore({ elapsedTime: 0, timerStartTime: 0, active: false });
    }

    const onStartHike = async () => {
        try{
            if(!profile){
                throw new Error("User profile not found. Please log in again.");
            }
    
            if(!currentHike) {
                throw new Error("No hike data available to start");
            }
    
            if(active && currentHike.status === 'paused'){
                onResumeHike();
                return;
            }
            
            console.log('Starting hike with id: ', currentHike.id);
            await startHike(profile.id);
            onStartGps();

        } catch(error){
            console.error("Error starting hike: ", error);
            setLocalError("Failed to start hike. Please try again.");
        }
    }

    const onPauseHike = () => {
        if(!currentHike || currentHike.status !== 'started') {
            setLocalError("No active hike to pause");
            return;
        }

        const currentElapsed = timerStartTime ? Date.now() - timerStartTime : 0;
        
        updateHikeStore({ 
            elapsedTime: currentElapsed, 
        });
        
        updateCurrentHike({ status: 'paused' });
        onEndGps();
    }

    const onResumeHike = () => {
        console.log('Resuming hike with id: ', currentHike?.id);
        if(!currentHike || currentHike.status !== 'paused') {
            console.log("Current hike status: ", currentHike?.status);
            setLocalError("No paused hike to resume");
            return;
        }

        updateCurrentHike({ status: 'started' });

        const newStartTime = Date.now() - elapsedTime; 
        updateHikeStore({ timerStartTime: newStartTime, active: true });
        onStartGps();
    }

    const onCompleteHike = () => {
        onEndGps();
    }


    const onEmergencyPress = () => {

    }

    const onAddReview = () => {

    }

    return {
        currentHike,
        elapsedTime,
        error: localError,
        isLoading,
        lastKnownCoordinate,

        onAddReview,
        onStartHike,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onResetHike,
        onEmergencyPress,
    }

}