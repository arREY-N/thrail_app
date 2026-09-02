import { TrackHikerGPSFlow } from "@/src/core/flows/TrackHikerGPSFlow";
import { useBookingUserItem } from "@/src/core/models/Booking/Booking";
import { newHike, useHikesStore, useHikeState, useHikeStore } from "@/src/core/models/Hike/Hike";
import { getReverseGeocode } from "@/src/core/models/Location/Location";
import { useOfferItem } from "@/src/core/models/Offer/Offer";
import { ITrailSummary, newTrail, TrailLogic, useTrailItem } from "@/src/core/models/Trail/Trail";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export type IUseWriteHikeParams = {
    hikeId?: string;
    trailId?: string;
    bookingId?: string;
    groupId?: string;
}

export function CreateHikeFlow(params: IUseWriteHikeParams = {}) {
    const { hikeId, trailId, bookingId, groupId } = params;
    const { profile } = useAuthHook();

    const { startBackgroundTracking, stopBackgroundTracking } = TrackHikerGPSFlow();

    const [localError, setLocalError] = useState<string | null>(null);

    const isDiy = trailId === 'diy' || trailId === 'new_diy_session' || !trailId;

    const { hikeLoading, hikeError } = useHikeState();

    const { booking } = useBookingUserItem(bookingId);
    const { offer } = useOfferItem(booking?.offer.id)
    const { trail, trailError, trailLoading } = useTrailItem(trailId);

    const updateCurrentHike = useHikeStore(s => s.updateCurrentHike);
    const shareLocation = useHikeStore(s => s.startShareLocation);
    const stopSharingLocation = useHikeStore(s => s.stopShareLocation);
    const coordinates = useHikeStore(s => s.coordinates);

    const create = useHikeStore(s => s.create);
    const updateHikeStore = useHikeStore(s => s.updateHikeStore);
    const startHike = useHikeStore(s => s.startHike);
    const timerStartTime = useHikeStore(s => s.timerStartTime);
    const elapsedTime = useHikeStore(s => s.elapsedTime);
    const activeHike = useHikesStore(s => {
        const storedHike = s.currentHike;

        if (!storedHike) return null;

        if (s.active && (storedHike.status === 'started' || storedHike.status === 'paused')) {
            return storedHike;
        }

        if (isDiy && storedHike.trail.id === 'diy') {
            return storedHike
        }

        if (trailId && storedHike.trail.id === trailId)
            return storedHike;

        if (hikeId && storedHike.id === hikeId)
            return storedHike;

        return null;
    });

    const fallbackTrail = isDiy
        ? newTrail({
            id: 'diy',
            general: {
                name: 'Independent Route (DIY Trail)',
                province: ['unknown'],
                active: false,
                address: "",
                mountain: [],
                rating: 0,
                reviewCount: 0,
                description: "",
                guidelines: []
            },
        })
        : null;

    const resolvedTrail = trail ?? fallbackTrail;

    const currentHike = activeHike ?? (
        resolvedTrail
            ? newHike({
                trail: TrailLogic.toSummary(resolvedTrail),
                bookingId,
                mode: bookingId ? 'booked' : 'direct'
            })
            : null
    )

    const onStartHike = async () => {
        if (!profile?.id) {
            setLocalError("User ID is required to start hike");
            return;
        }

        if (activeHike && currentHike?.status === 'paused') {
            onResumeHike();
            return;
        }

        if (!currentHike) {
            setLocalError("No hike loaded to start");
            return;
        }

        await startHike(
            currentHike,
            {
                id: profile.id,
                firstname: profile.firstname,
                lastname: profile.lastname
            }
        );
        if (groupId) {
            updateHikeStore({
                activeGroupId: groupId,
            });
            // await onStartSharingLocation();
        }

        startBackgroundTracking();
    };

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
        if (!profile) {
            setLocalError("User ID is required to resume hike");
            return;
        }

        if (!currentHike || currentHike.status !== 'paused') {
            setLocalError("No paused hike to resume");
            return;
        }

        updateCurrentHike({ status: 'started' });

        const newStartTime = Date.now() - elapsedTime;
        updateHikeStore({
            timerStartTime: newStartTime,
            active: true,
            profile: {
                id: profile.id,
                firstname: profile.firstname,
                lastname: profile.lastname
            }
        });
        startBackgroundTracking();
    }

    const onCompleteHike = async () => {
        if (!currentHike) {
            setLocalError("No active hike to complete");
            return;
        }

        if (!profile) {
            setLocalError("User profile is required to complete hike");
            return;
        }

        stopBackgroundTracking();

        updateHikeStore({
            active: false,
        })

        let location: ITrailSummary = currentHike.trail;
        if (currentHike.trail.id === 'diy' || currentHike.trail.id === 'diy_session' || currentHike.trail.id === '') {
            const coor = coordinates[0];

            if (!coor.latitude || !coor.longitude) {
                return;
            };

            const locationName = await getReverseGeocode(coor.latitude, coor.longitude);

            location = {
                id: currentHike.trail.id,
                location: locationName?.location || 'Location Unknown',
                name: locationName?.name || 'Location Unknown',
            }
        }

        updateCurrentHike({
            status: 'completed',
            endTime: new Date(),
            user: UserLogic.toSummary(profile),
            trail: location
        });

        await create(profile!.id);
        //router.replace('/');
    }

    const onResetHike = () => {
        stopBackgroundTracking();
        updateHikeStore({
            currentHike: null,
            active: false,
            elapsedTime: 0,
            timerStartTime: 0,
            totalDistance: 0,
            totalElevationGain: 0,
            coordinates: [],
            activeGroupId: null,
            live: false,
        });
    };

    const onAddReview = (trailId: string) => {
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
            catchError((error as Error), 'error', 'CreateHikeFlow()')
            setLocalError("No hike data available to review");
        }
    }

    const onStartSharingLocation = async () => {
        try {
            if (!groupId) throw new Error("Group ID is required to share location");

            await shareLocation(groupId);
        } catch (error) {
            catchError(error as Error)
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }
    }

    const onStopSharingLocation = () => {
        try {
            if (!groupId) throw new Error("Group ID is required to share location");
            stopSharingLocation(groupId);
        } catch (error) {
            catchError(error as Error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while stopping location sharing.");
        }
    }

    useEffect(() => {
        if (currentHike?.status !== 'started') {
            return;
        }

        const interval = setInterval(() => {
            const currentElapsed = Date.now() - timerStartTime;
            updateHikeStore({ elapsedTime: currentElapsed });
        }, 500);

        return () => clearInterval(interval);
    }, [currentHike?.status, timerStartTime, updateHikeStore]);

    useEffect(() => {
        return () => {
            const stored = useHikeStore.getState().currentHike;
            if (stored && (stored.status === 'completed' || stored.status === 'unhiked')) {
                updateHikeStore({
                    currentHike: null,
                    active: false,
                    elapsedTime: 0,
                    timerStartTime: 0,
                    totalDistance: 0,
                    totalElevationGain: 0,
                    coordinates: [],
                    activeGroupId: null,
                    live: false,
                });
            }
        };
    }, [updateHikeStore]);

    return {
        currentHike,
        booking,
        fullOffer: offer,
        isLoading: hikeLoading || trailLoading,
        error: hikeError || trailError || localError,

        elapsedTime,
        timerStartTime,
        totalDistance: useHikeStore(s => s.totalDistance),
        totalElevationGain: useHikeStore(s => s.totalElevationGain),
        shareLocationEnabled: useHikeStore(s => s.shareLocationEnabled),

        onEmergencyPress: () => { },
        onStartHike,
        onAddReview,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onResetHike,
        setShareLocationEnabled: async () => { },
    }
}