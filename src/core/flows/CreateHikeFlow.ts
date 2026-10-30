import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from "@/src/core/flows/TrackHikerGPSFlow";
import { useBookingUserItem } from "@/src/core/models/Booking/Booking";
import { newHike, useHikesStore, useHikeState, useHikeStore, HikeRepo } from "@/src/core/models/Hike/Hike";
import { getReverseGeocode, newLocation } from "@/src/core/models/Location/Location";
import { useOfferItem } from "@/src/core/models/Offer/Offer";
import { ITrailSummary, newTrail, TrailLogic, useTrailItem } from "@/src/core/models/Trail/Trail";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";
import { catchError, logger } from "@/src/core/utility/errorFormatter";
import { clearLocalTrack } from "@/src/core/utility/hikeStorage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type IUseWriteHikeParams = {
    hikeId?: string;
    trailId?: string;
    bookingId?: string;
    groupId?: string;
}

export function CreateHikeFlow(params: IUseWriteHikeParams = {}) {
    const { hikeId, trailId, bookingId, groupId } = params;
    const { profile } = useAuthHook();

    const startBackgroundTracking = startBackgroundLocationTracking;
    const stopBackgroundTracking = stopBackgroundLocationTracking;

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
    const deleteHike = useHikeStore(s => s.remove);
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
        : null

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

    // Pre-hike GPS readiness: seed currentLocation immediately if not yet populated
    useEffect(() => {
        if (Platform.OS === 'web') return;
        if (!useHikeStore.getState().currentLocation) {
            Location.getLastKnownPositionAsync()
                .then((lastPos) => {
                    if (lastPos && !useHikeStore.getState().currentLocation) {
                        useHikeStore.getState().setCurrentLocation(newLocation({
                            latitude: lastPos.coords.latitude,
                            longitude: lastPos.coords.longitude,
                            altitude: lastPos.coords.altitude ?? undefined,
                            accuracy: lastPos.coords.accuracy ?? undefined,
                            speed: lastPos.coords.speed ?? undefined,
                            timestamp: new Date(lastPos.timestamp || Date.now()),
                            status: 'ACTIVE',
                        }));
                    }
                })
                .catch(() => {});
        }
    }, []);

    // Ensure sharing is enabled by default
    useEffect(() => {
        if (currentHike?.status === 'unhiked') {
            updateHikeStore({ shareLocationEnabled: true });
        }
    }, [currentHike?.status, updateHikeStore]);

    const onStartHike = async () => {
        if (!profile?.id) {
            setLocalError("User ID is required to start hike");
            return;
        }

        if (activeHike && currentHike?.status === 'paused') {
            await onResumeHike();
            return;
        }

        if (!currentHike) {
            setLocalError("No hike loaded to start");
            return;
        }

        // Pre-hike GPS readiness: ensure currentLocation is populated before start
        if (Platform.OS !== 'web' && !useHikeStore.getState().currentLocation) {
            try {
                const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (currentPos) {
                    useHikeStore.getState().setCurrentLocation(newLocation({
                        latitude: currentPos.coords.latitude,
                        longitude: currentPos.coords.longitude,
                        altitude: currentPos.coords.altitude ?? undefined,
                        accuracy: currentPos.coords.accuracy ?? undefined,
                        speed: currentPos.coords.speed ?? undefined,
                        timestamp: new Date(currentPos.timestamp || Date.now()),
                        status: 'ACTIVE',
                    }));
                }
            } catch (posErr) {
                console.warn("[onStartHike] Pre-hike GPS fix acquisition warning:", posErr);
            }
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
            const isSharingAllowed = useHikeStore.getState().shareLocationEnabled !== false;
            if (isSharingAllowed) {
                try {
                    await shareLocation(groupId);
                } catch (shareErr) {
                    console.warn("[onStartHike] Background location share initialization warning:", shareErr);
                }
            }
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
        useHikeStore.getState().logHikeEvent('HIKE_PAUSED');
        // Note: Keep background location tracking and live location broadcasting alive while paused
    };

    const onResumeHike = async () => {
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
            lastShareTime: 0,
            profile: {
                id: profile.id,
                firstname: profile.firstname,
                lastname: profile.lastname
            }
        });

        // Ensure live location sharing is active if group exists and sharing is enabled
        const targetGroupId = groupId || useHikeStore.getState().activeGroupId;
        if (targetGroupId && useHikeStore.getState().shareLocationEnabled !== false) {
            updateHikeStore({
                activeGroupId: targetGroupId,
                live: true,
            });
            try {
                await shareLocation(targetGroupId);
            } catch (shareErr) {
                console.warn("[onResumeHike] Location share initialization warning:", shareErr);
            }
        }

        useHikeStore.getState().logHikeEvent('HIKE_RESUMED');
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

        const targetGroup = groupId || useHikeStore.getState().activeGroupId;
        if (targetGroup) {
            if (profile?.id) {
                HikeRepo.deleteLocation(profile.id, targetGroup).catch(() => {});
            }
            stopSharingLocation(targetGroup);
        }
        //router.replace('/');
    }

    const onResetHike = async () => {

        try {

            if (!profile) {
                throw new Error('User profile is required to reset hike');
            }
            if (!currentHike) {
                throw new Error('No hike recorded to reset');
            }
            stopBackgroundTracking();
            const targetGroup = groupId || useHikeStore.getState().activeGroupId;
            if (targetGroup) {
                if (profile?.id) {
                    HikeRepo.deleteLocation(profile.id, targetGroup).catch(() => {});
                }
                stopSharingLocation(targetGroup);
            }
            await clearLocalTrack();
            updateHikeStore({
                currentHike: null,
                active: false,
                elapsedTime: 0,
                timerStartTime: 0,
                totalDistance: 0,
                totalElevationGain: 0,
                coordinates: [],
                walkedRoute: [],
                isSegmentFirstPoint: true,
                activeGroupId: null,
                live: false,
            });

            logger('CreateHikeFlow', 'resetting hike', currentHike);
            await deleteHike(currentHike?.id, profile.id);
        } catch (error) {
            catchError((error as Error), 'error', 'CreateHikeFlow()')
            setLocalError((error as Error).message);
        }
    };

    const onAddReview = (trailId: string) => {
        try {
            if (!currentHike)
                throw new Error("No hike data available to review");

            if (currentHike.status !== 'completed')
                throw new Error('Cannot review an incomplete hike');

            router.push({
                pathname: '/(app)/(main)/review/write',
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
                    walkedRoute: [],
                    isSegmentFirstPoint: true,
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
        setShareLocationEnabled: async (enabled: boolean) => {
            try {
                await useHikeStore.getState().setShareLocationEnabled(enabled);
                const targetGroup = groupId || useHikeStore.getState().activeGroupId;
                if (enabled && targetGroup && !useHikeStore.getState().live) {
                    await shareLocation(targetGroup);
                }
            } catch (error) {
                catchError(error as Error);
                setLocalError(error instanceof Error ? error.message : "Failed to toggle location sharing.");
            }
        },
        onStartSharingLocation,
        onStopSharingLocation,
    }
}