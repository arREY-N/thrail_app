import { Booking, useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useAuthHook } from "@/src/core/models/User/User";

import { Hike } from "@/src/core/models/Hike/interfaces/Hike.types";
import { useHikeStore } from "@/src/core/models/Hike/stores/hikeStore";
import { newHike } from "@/src/core/models/Hike/utils/HikeFactory";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { TrailLogic, useTrailsStore } from "@/src/core/models/Trail/Trail";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

export interface IUseWriteHike {
    hike: Hike | null;
    error: string | null;
    isLoading: boolean;
    booking?: Booking | null;
    fullOffer?: Offer | null;

    elapsedTime: number;
    timerStartTime: number;
    totalDistance: number;
    totalElevationGain: number;
    shareLocationEnabled: boolean;

    onStartHike: () => void;
    onPauseHike: () => void;
    onResumeHike: () => void;
    onCompleteHike: () => void;
    onResetHike: () => void;
    onEmergencyPress: () => void;
    onAddReview: (trailId: string) => void;
    setShareLocationEnabled: (enabled: boolean) => Promise<void>;
}

export type IUseWriteHikeParams = {
    hikeId?: string;
    trailId?: string;
    bookingId?: string;
    groupId?: string;
}

export function useHikeWrite(params: IUseWriteHikeParams = {}): IUseWriteHike {
    const { hikeId, trailId, bookingId, groupId } = params;
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);

    const error = useHikeStore(s => s.error);
    const bookings = useBookingsStore(s => s.userBookings);
    const isLoading = useHikeStore(s => s.isLoading);
    const trails = useTrailsStore(s => s.data);
    const hikes = useHikeStore(s => s.hikes);

    const businessOffers = useOfferStore(s => s.businessOffers);
    const fetchOffer = useOfferStore(s => s.fetchOfferById);

    const currentHike = useHikeStore(s => s.currentHike);
    const elapsedTime = useHikeStore(s => s.elapsedTime);
    const timerStartTime = useHikeStore(s => s.timerStartTime);
    const totalDistance = useHikeStore(s => s.totalDistance);
    const totalElevationGain = useHikeStore(s => s.totalElevationGain);
    const active = useHikeStore(s => s.active);
    const shareLocationEnabled = useHikeStore(s => s.shareLocationEnabled);

    const shareLocation = useHikeStore(s => s.startShareLocation);
    const stopSharingLocation = useHikeStore(s => s.stopShareLocation);
    const setShareLocationEnabled = useHikeStore(s => s.setShareLocationEnabled);

    const updateCurrentHike = useHikeStore(s => s.updateCurrentHike);
    const updateHikeStore = useHikeStore(s => s.updateHikeStore);
    const create = useHikeStore(s => s.create);
    const startHike = useHikeStore(s => s.startHike);

    const createBooking = useBookingsStore(s => s.create);

    // Derive active booking directly without redundant setState cascading renders
    const targetBookingId = bookingId || (currentHike?.mode === 'booked' ? currentHike.bookingId : undefined);
    const booking = useMemo(() => {
        if (!targetBookingId) return null;
        return bookings.find(b => b.id === targetBookingId) || null;
    }, [targetBookingId, bookings]);

    const offerId = booking?.offer?.id;

    // Derive full offer directly from businessOffers store
    const fullOffer = useMemo(() => {
        if (!offerId) return null;
        return businessOffers.find(o => o.id === offerId) || null;
    }, [offerId, businessOffers]);

    // Fetch offer details into store if not already present
    useEffect(() => {
        if (offerId && !businessOffers.some(o => o.id === offerId)) {
            fetchOffer(offerId);
        }
    }, [offerId, businessOffers, fetchOffer]);

    useEffect(() => {
        if (!profile?.id) return;

        const isDiy = hikeId === 'new_diy_session';

        // 1. If store already holds a hike matching our parameters, do not recreate it
        const current = useHikeStore.getState().currentHike;
        if (current) {
            if (isDiy && current.trail?.id === 'diy') {
                return;
            }
            if (hikeId && !isDiy && current.id === hikeId) {
                return;
            }
            if (trailId && current.trail?.id === trailId) {
                return;
            }
        }

        let found: Hike | undefined;

        // ✅ Handle the "new_diy_session"
        if (isDiy) {
            found = newHike({
                trail: {
                    id: "diy",
                    name: "Free Roam (DIY)",
                    location: "Unknown"
                },
                status: 'unhiked',
                mode: 'direct',
                startTime: new Date(),
            });
            updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0, currentHike: found });
            return;
        }

        if (hikeId) {
            const exist = hikes.find(h => h.id === hikeId);
            if (exist) {
                found = exist;
            }
        } else if (trailId) {
            const trail = trails.find(t => t.id === trailId);
            if (trail) {
                const isBooked = !!bookingId;
                found = newHike({
                    trail: TrailLogic.toSummary(trail),
                    status: 'unhiked',
                    mode: isBooked ? 'booked' : 'direct',
                    bookingId: bookingId
                });
                updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0 });
            }
        }

        if (!found) {
            updateHikeStore({
                elapsedTime: 0,
                timerStartTime: 0,
                totalDistance: 0,
                totalElevationGain: 0,
                currentHike: newHike(),
                error: "Hiking details not found. Proceed with caution!"
            });
        } else {
            updateHikeStore({ currentHike: found });
        }

        return () => {
            const latestHike = useHikeStore.getState().currentHike;
            if (latestHike && (latestHike.status === 'completed' || latestHike.status === 'unhiked')) {
                updateHikeStore({ currentHike: null });
            }
        };
    }, [hikeId, trailId, bookingId, profile?.id, hikes, bookings, trails, updateHikeStore]);

    const onStartSharingLocation = async () => {
        try {
            if (!groupId) throw new Error("Group ID is required to share location");

            await shareLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }
    }

    const onStopSharingLocation = () => {
        try {
            if (!groupId) throw new Error("Group ID is required to share location");
            stopSharingLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while stopping location sharing.");
        }
    }

    const onStartHike = async () => {
        if (!profile?.id) {
            setLocalError("User ID is required to start hike");
            return;
        }

        if (!currentHike) {
            setLocalError("No hike loaded to start");
            return;
        }

        if (active && currentHike.status === 'paused') {
            onResumeHike();
            return;
        }

        await startHike(profile!.id);
        if (groupId) {
            updateHikeStore({ activeGroupId: groupId });
            await onStartSharingLocation();
        }
    };

    const onPauseHike = () => {
        if (!currentHike || currentHike.status !== 'started') return;
        const currentElapsedTime = Date.now() - timerStartTime;
        updateCurrentHike({ status: 'paused' });
        updateHikeStore({ elapsedTime: currentElapsedTime });
        if (groupId) {
            onStopSharingLocation();
        }
    }

    const onResumeHike = async () => {
        if (!currentHike || currentHike.status !== 'paused') return;
        const newStartTime = Date.now() - elapsedTime;

        updateCurrentHike({
            status: 'started',
        });

        updateHikeStore({
            timerStartTime: newStartTime,
            active: true,
        });

        if (groupId) {
            updateHikeStore({ activeGroupId: groupId });
            await onStartSharingLocation();
        }
    }

    const onCompleteHike = async () => {
        if (!currentHike || !profile?.id) return;

        // ✅ FIX 2: Calculate final seconds if they didn't pause before finishing
        const finalDuration = currentHike.status === 'started'
            ? elapsedTime + (Date.now() - timerStartTime)
            : elapsedTime;

        updateHikeStore({ active: false });

        const completedHike = newHike({
            ...currentHike,
            status: 'completed',
            endTime: new Date(),
            distance: totalDistance,
            duration: finalDuration,   // ✅ Safely saves the exact millisecond duration           
            elevation: totalElevationGain
        });

        updateCurrentHike(completedHike);
        await create(profile.id, completedHike);

        if (completedHike.mode === 'booked' && booking) {
            await createBooking({ ...booking, status: 'finished' });
        }

        if (groupId) {
            onStopSharingLocation();
        }
    }

    const onResetHike = () => {
        if (!currentHike) return;
        updateCurrentHike({ status: 'unhiked', startTime: undefined, endTime: undefined });
        updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0, active: false });
    }

    const onEmergencyPress = () => onPauseHike();

    const onAddReview = (trailId: string) => {
        if (!currentHike || currentHike.status !== 'completed') return;

        router.push({
            pathname: '/(main)/review/write',
            params: {
                trailId: trailId,
                hikeId: currentHike.id,
                distance: String(currentHike.distance || totalDistance),
                duration: String(currentHike.duration || elapsedTime),
                elevation: String(currentHike.elevation || totalElevationGain)
            }
        })
    }

    return {
        hike: currentHike || newHike(),
        error: error || localError,
        isLoading,
        booking,
        fullOffer,

        elapsedTime,
        timerStartTime,
        totalDistance,
        totalElevationGain,
        shareLocationEnabled,

        onEmergencyPress,
        onStartHike,
        onAddReview,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onResetHike,
        setShareLocationEnabled,
    }
}
