import { TrackHikerGPSFlow } from "@/src/core/flows/TrackHikerGPSFlow";
import { useHikeStore } from "@/src/core/models/Hike/stores/hikeStore";
import { newHike } from "@/src/core/models/Hike/utils/HikeFactory";
import { TrailLogic, useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useAuthStore } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function useCurrentHike(trailId: string) {
    const [localError, setLocalError] = useState<string | null>(null);

    const profile = useAuthStore(s => s.profile);

    const currentHike = useHikeStore(s => s.currentHike);
    const elapsedTime = useHikeStore(s => s.elapsedTime);
    const timerStartTime = useHikeStore(s => s.timerStartTime);
    const isLoading = useHikeStore(s => s.isLoading);
    const active = useHikeStore(s => s.active);
    const startHike = useHikeStore(s => s.startHike);
    const create = useHikeStore(s => s.create);

    const { startBackgroundTracking, stopBackgroundTracking } = TrackHikerGPSFlow();

    const coordinates = useHikeStore(s => s.coordinates);
    const lastKnownCoordinate = coordinates.at(-1) ?? null;
    const updateCurrentHike = useHikeStore(s => s.updateCurrentHike);
    const updateHikeStore = useHikeStore(s => s.updateHikeStore);

    const trails = useTrailsStore(s => s.data);

    useEffect(() => {
        if (active && currentHike && currentHike.trail.id !== trailId) {
            console.log(`Active hike found for a different trail: ${currentHike?.trail.id}`);
            queueMicrotask(() => {
                setLocalError(`Active hike found for a different trail: ${currentHike?.trail.id}`);
            });
            return;
        }

        if (trailId && currentHike?.trail.id !== trailId) {
            const trail = trails.find(t => t.id === trailId);

            if (!trail) {
                queueMicrotask(() => {
                    setLocalError('Trail not found');
                });
                return;
            }

            const hike = newHike({
                trail: TrailLogic.toSummary(trail),
                status: 'unhiked',
                mode: 'direct'
            });

            updateHikeStore({ currentHike: hike });
        }

        return () => {
            console.log('Unmounting useCurrentHike, checking if hike needs to be reset', currentHike);
            if (currentHike && (currentHike.status === 'unhiked' || currentHike.status === 'completed')) {
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
    }, [active, currentHike, trailId, trails, updateHikeStore]);

    useEffect(() => {
        if (currentHike && currentHike.status !== 'started') {
            return;
        }

        const interval = setInterval(() => {
            const currentElapsed = Date.now() - timerStartTime;
            updateHikeStore({ elapsedTime: currentElapsed });
        }, 500);

        return () => clearInterval(interval);
    }, [active, currentHike, currentHike?.status, timerStartTime, updateHikeStore]);

    const onResetHike = () => {
        if (!currentHike) {
            setLocalError("No hike data available to reset");
            return;
        }

        updateCurrentHike({ status: 'unhiked' });
        updateHikeStore({ elapsedTime: 0, timerStartTime: 0, active: false });
    }

    const onStartHike = async () => {
        try {
            if (!profile) {
                throw new Error("User profile not found. Please log in again.");
            }

            if (!currentHike) {
                throw new Error("No hike data available to start");
            }

            if (active && currentHike.status === 'paused') {
                onResumeHike();
                return;
            }

            console.log('Starting hike with id: ', currentHike.id);
            await startHike(profile.id);
            startBackgroundTracking();
            console.log('current hike: ', currentHike);
        } catch (error) {
            console.error("Error starting hike: ", error);
            setLocalError("Failed to start hike. Please try again.");
        }
    }

    const onPauseHike = () => {
        if (!currentHike || currentHike.status !== 'started') {
            setLocalError("No active hike to pause");
            return;
        }

        const currentElapsed = timerStartTime ? Date.now() - timerStartTime : 0;

        updateHikeStore({
            elapsedTime: currentElapsed,
        });

        updateCurrentHike({ status: 'paused' });
        stopBackgroundTracking();
    }

    const onResumeHike = () => {
        console.log('Resuming hike with id: ', currentHike?.id);
        if (!currentHike || currentHike.status !== 'paused') {
            console.log("Current hike status: ", currentHike?.status);
            setLocalError("No paused hike to resume");
            return;
        }

        updateCurrentHike({ status: 'started' });

        const newStartTime = Date.now() - elapsedTime;
        updateHikeStore({ timerStartTime: newStartTime, active: true });
        startBackgroundTracking();
    }

    const onCompleteHike = async () => {
        if (!currentHike) {
            setLocalError("No active hike to complete");
            return;
        }

        stopBackgroundTracking();

        updateHikeStore({
            active: false,
            elapsedTime: 0,
            timerStartTime: undefined,
        })

        updateCurrentHike({
            status: 'completed',
            endTime: new Date()
        });

        const completedHike = newHike({
            ...currentHike,
            status: 'completed',
            endTime: new Date(),
        })

        console.log('Completed hike: ', completedHike);
        await create(profile!.id, completedHike);
        //router.replace('/');
    }


    const onEmergencyPress = () => {

    }

    const onAddReview = () => {
        try {
            if (!currentHike)
                throw new Error("No hike data available to review");

            if (currentHike.status !== 'completed')
                throw new Error('Cannot review an incomplete hike');

            router.push({
                pathname: '/(main)/review/write',
                params: {
                    trailId: currentHike.trail.id,
                }
            });
        } catch (error) {
            catchError((error as Error), 'error', 'useCurrentHike()')
            setLocalError("No hike data available to review");
        }
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