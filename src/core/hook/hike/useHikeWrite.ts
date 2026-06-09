import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Offer } from "@/src/core/models/Offer/Offer";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import { BookingRepository } from "@/src/core/repositories/bookingRepository";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailStores/trailsStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";

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

    onStartHike: () => void;
    onPauseHike: () => void;
    onResumeHike: () => void;
    onCompleteHike: () => void;
    onResetHike: () => void;
    onEmergencyPress: () => void;
    onAddReview: (trailId: string) => void; 
}

export type IUseWriteHikeParams = {
    hikeId?: string;
    trailId?: string;
    bookingId?: string;
    groupId?: string;
}

export default function useWriteHike(params: IUseWriteHikeParams = {}): IUseWriteHike {
    const { hikeId, trailId, bookingId, groupId } = params;
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);

    const error = useHikesStore(s => s.error);
    const bookings = useBookingsStore(s => s.userBookings);
    const isLoading = useHikesStore(s => s.isLoading);
    const trails = useTrailsStore(s => s.data);
    const hikes = useHikesStore(s => s.hikes);

    const fetchOffer = useOffersStore(s => s.fetchOfferById);
    const [fullOffer, setFullOffer] = useState<Offer | null>(null);

    const currentHike = useHikesStore(s => s.currentHike);
    const elapsedTime = useHikesStore(s => s.elapsedTime);
    const timerStartTime = useHikesStore(s => s.timerStartTime);
    const totalDistance = useHikesStore(s => s.totalDistance);
    const totalElevationGain = useHikesStore(s => s.totalElevationGain);
    const active = useHikesStore(s => s.active);

    const shareLocation = useHikesStore(s => s.startShareLocation);
    const stopSharingLocation = useHikesStore(s => s.stopShareLocation);

    const updateCurrentHike = useHikesStore(s => s.updateCurrentHike);
    const updateHikeStore = useHikesStore(s => s.updateHikeStore);
    const create = useHikesStore(s => s.create);
    const startHike = useHikesStore(s => s.startHike);

    const [booking, setBooking] = useState<Booking | null>(null);

    useEffect(() => {
        setLocalError(null); // Clear local error on parameter change
    },[]);
    useEffect(() => {
        let found: Hike | undefined;

        if(active && ((trailId && currentHike?.trail.id === trailId) || (hikeId && currentHike?.id === hikeId))) {
            console.log('Active hike already loaded with matching parameters. Using current hike from store.');
            return;
        }
        
        if (currentHike && ((hikeId && currentHike.id !== hikeId) || (trailId && currentHike.trail.id !== trailId)) && active) {
            setLocalError(`Rerunning hike: ${currentHike.trail.name}`);
            updateCurrentHike({ startTime: new Date() })
            console.log(currentHike);
            return;
        }

        if (!profile?.id) return;
        console.log('in useHike Write');
        console.log('Params:', { hikeId, trailId, bookingId, groupId });

        // ✅ FIX 1: Safely handle the "new_diy_session" so the app doesn't hang
        if (hikeId === 'new_diy_session') {
            console.log('starting new DIY hike session');
            found = new Hike({
                trail: { id: "diy", name: "Free Roam (DIY)" },
                status: 'unhiked',
                mode: 'direct',
                startTime: new Date(),
            });
            updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0 });
        } 
        else if (hikeId) {
            console.log('with hikeId: ', hikeId)
            const exist = hikes.find(h => h.id === hikeId);
            if (exist) {
                found = exist; 
                if (exist.mode === 'booked' && exist.bookingId) {
                    const b = bookings.find(b => b.id === exist.bookingId);
                    if (b) {
                        setBooking(b);
                        fetchOffer(b.offer.id).then(o => setFullOffer(o));
                    }
                }
            }
            console.log('found with hikeId: ', found);
        } 
        else if (trailId) {
            console.log('with trailId: ', trailId)
            const trail = trails.find(t => t.id === trailId);
            if (trail) {
                const isBooked = !!bookingId;
                found = new Hike({
                    trail: TrailLogic.toSummary(trail),
                    status: 'unhiked',
                    mode: isBooked ? 'booked' : 'direct',
                    bookingId: bookingId
                });

                if (isBooked) {
                    const b = bookings.find(b => b.id === bookingId);
                    if (b) {
                        setBooking(b);
                        fetchOffer(b.offer.id).then(o => setFullOffer(o));
                    }
                }

                updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0 });
            }
        }
        
        if(!found){
            console.log('no hike found, proceeding with empty')
            updateHikeStore({ 
                elapsedTime: 0, 
                timerStartTime: 0, 
                totalDistance: 0, 
                totalElevationGain: 0,
                currentHike: new Hike()
            });
            setLocalError("Hiking details not found. Proceed with caution!");
        } else {
            console.log('hike found, proceed with ', found)
            updateHikeStore({ currentHike: found });
        }


        return () => {
            if(
                (bookingId && currentHike?.bookingId !== bookingId && currentHike?.status === 'unhiked') || 
                (currentHike && (currentHike.status === 'completed' || currentHike.status === 'unhiked')))
            {
                console.log('linis');
                console.log(currentHike)
                console.log(currentHike.status);
                // console.log('removing current hike');
                updateHikeStore({ currentHike: null });
            } else {
                console.log('or nah')
            }
        }
    },[hikeId, trailId, bookingId, profile?.id]);
    
    const onStartSharingLocation = async () => {
        try {
            if(!groupId) throw new Error("Group ID is required to share location");
            
            await shareLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }    
    }

    const onStopSharingLocation = () => {
        try {            
            if(!groupId) throw new Error("Group ID is required to share location");
            stopSharingLocation(groupId);    
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while stopping location sharing.");
        }
    }

    const onStartHike = async () => {
        if(!profile?.id) {
            setLocalError("User ID is required to start hike");
            return;
        }

        if(!currentHike) {
            setLocalError("No hike loaded to start");
            return;
        }

        if(active && currentHike.status === 'paused'){
            onResumeHike();
            return;
        }

        await startHike(profile!.id);
        if(groupId) {
            updateHikeStore({ activeGroupId: groupId });
            await onStartSharingLocation();
        }
    };

    const onPauseHike = () => {
        if (!currentHike || currentHike.status !== 'started') return;
        const currentElapsedTime = Date.now() - timerStartTime;
        updateCurrentHike({ status: 'paused' });
        updateHikeStore({ elapsedTime: currentElapsedTime });
        if(groupId){
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

        if(groupId) {
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
        
        const completedHike = new Hike({
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
            const finishedBooking = new Booking({ ...booking, status: 'finished' });
            await BookingRepository.write(finishedBooking);
        }
        
        if(groupId){
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
        hike: currentHike || new Hike(),
        error: error || localError,
        isLoading,
        booking,
        fullOffer,
        
        elapsedTime,
        timerStartTime,
        totalDistance,
        totalElevationGain,
        
        onEmergencyPress,
        onStartHike,
        onAddReview,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onResetHike,
    }
}
    