import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Hike } from "@/src/core/models/Hike/Hike";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useEffect, useState } from "react";

export interface IUseWriteHike {
    hike: Hike | null;
    error: string | null;
    isLoading: boolean;
    booking?: Booking | null;
    elapsedTime: number;

    onStartHike: () => void;
    onPauseHike: () => void;
    onResumeHike: () => void;
    onCompleteHike: () => void;
    onResetHike: () => void;

    onAddReview: (trailId: string) => void;
}

export type IUseWriteHikeParams = {
    hikeId?: string;
    trailId?: string;
}

export default function useWriteHike(params: IUseWriteHikeParams): IUseWriteHike {
    const { hikeId, trailId } = params;
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);

    const error = useHikesStore(s => s.error);
    const bookings = useBookingsStore(s => s.userBookings);
    const isLoading = useHikesStore(s => s.isLoading);
    const trails = useTrailsStore(s => s.data);
    const hikes = useHikesStore(s => s.hikes);
    
    const currentHike = useHikesStore(s => s.currentHike);
    const elapsedTime = useHikesStore(s => s.elapsedTime);
    const timerStartTime = useHikesStore(s => s.timerStartTime);
    const active = useHikesStore(s => s.active);

    const updateCurrentHike = useHikesStore(s => s.updateCurrentHike);
    const updateHikeStore = useHikesStore(s => s.updateHikeStore);
    const create = useHikesStore(s => s.create);

    const [booking, setBooking] = useState<Booking | null>(null);

    useEffect(() => {
        let found: Hike | undefined;

        if(active && ((trailId && currentHike?.trail.id === trailId) || (hikeId && currentHike?.id === hikeId)))
            return;
        
        if (
            currentHike && (
                (hikeId && currentHike.id !== hikeId) || 
                (trailId && currentHike.trail.id !== trailId)) && 
            active
        ) {
            const errorMsg = `This hike is still active: ${currentHike.trail.name}`;
            setLocalError(errorMsg);
            console.log(errorMsg);
            return;
        }

        if (!profile?.id) {
            setLocalError("User ID is required to load hike");
            return;
        }

        if (hikeId) {
            const exist = hikes.find(h => h.id === hikeId);
            
            if (!exist) {
                setLocalError("Hike not found");
                return;
            }

            if (exist.mode === 'booked') {
                const booking = bookings.find(b => b.id === exist.bookingId);
                if (!booking) {
                    setLocalError("Booking not found for booked hike");
                } else {
                    setBooking(booking);
                }
            }
            
            found = exist; 
        } else if (trailId) {
            const trail = trails.find(t => t.id === trailId);
            
            if (!trail) {
                setLocalError("Trail not found for hike creation");
                return;
            }

            found = new Hike({
                trail: TrailLogic.toSummary(trail),
                status: 'unhiked',
                mode: 'direct'
            });
        }

        if (!found) {
            setLocalError("No hike data available to start");
            return;
        }

        updateHikeStore({
            currentHike: found,
        })
    },[hikeId, trailId, profile?.id])

    const onStartHike = () => {
        if(!currentHike) {
            setLocalError("No hike loaded to start");
            return;
        }

        if(active){
            onResumeHike();
            return;
        }

        updateCurrentHike({
            status: 'started',
            startTime: new Date(),
        });

        updateHikeStore({
            active: true,
            elapsedTime: 0,
            timerStartTime: Date.now(),
        })
    };

    const onPauseHike = () => {
        if (!currentHike || currentHike.status !== 'started') {
            setLocalError("No active hike to pause");
            return;
        }

        updateCurrentHike({ status: 'paused' });
    }

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

    const onCompleteHike = async () => {
        if (!currentHike) {
            setLocalError("No active hike to complete");
            return;
        }

        updateHikeStore({
            active: false,
        })

        updateCurrentHike({ 
            status: 'completed', 
            endTime: new Date()
        });

        const completedHike = new Hike({
            ...currentHike,
            status: 'completed',
            endTime: new Date(),
        })
        
        await create(completedHike, profile!.id)
    }

    const onResetHike = () => {
        if (!currentHike) {
            setLocalError("No hike to reset");
            return;
        }

        updateCurrentHike({
            status: 'unhiked',
            startTime: undefined,
            endTime: undefined,
        });

        updateHikeStore({
            elapsedTime: 0,
            timerStartTime: null,
            active: false,
        })
    }

    const tick = () => {
        if(!currentHike || currentHike.status !== 'started' || !timerStartTime){
            return;
        } 

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


    const onAddReview = (trailId: string) => {
        // if(hike && hike.status !== 'completed'){
        //     setLocalError('cannot review an incomplete hike');
        //     return;
        // }
        
        // console.log('add review', trailId);
        // router.push({
        //     pathname: '/(main)/review/write',
        //     params: {
        //         trailId: trailId
        //     }
        // })
    }


    return {
        hike: currentHike || new Hike(),
        error: error || localError,
        isLoading,
        booking,

        elapsedTime,

        onStartHike,
        onAddReview,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onResetHike,

    }
}
    