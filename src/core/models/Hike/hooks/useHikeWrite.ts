// import { Booking, useBookingsStore } from "@/src/core/models/Booking/Booking";
// import { Hike } from "@/src/core/models/Hike/Hike";

// import { useHikeStore } from "@/src/core/models/Hike/stores/hikeStore";
// import { newHike } from "@/src/core/models/Hike/utils/HikeFactory";
// import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
// import { TrailLogic, useTrailsStore } from "@/src/core/models/Trail/Trail";
// import { router } from "expo-router";
// import { useEffect, useMemo, useState } from "react";

// export interface IUseWriteHike {
//     hike: Hike | null;
//     error: string | null;
//     isLoading: boolean;
//     booking?: Booking | null;
//     fullOffer?: Offer | null;

//     elapsedTime: number;
//     timerStartTime: number;
//     totalDistance: number;
//     totalElevationGain: number;
//     shareLocationEnabled: boolean;

//     onStartHike: () => void;
//     onPauseHike: () => void;
//     onResumeHike: () => void;
//     onCompleteHike: () => void;
//     onResetHike: () => void;
//     onEmergencyPress: () => void;
//     onAddReview: (trailId: string) => void;
//     setShareLocationEnabled: (enabled: boolean) => Promise<void>;
// }

// export type IUseWriteHikeParams = {
//     hikeId?: string;
//     trailId?: string;
//     bookingId?: string;
//     groupId?: string;
// }

// export function useHikeWrite(params: IUseWriteHikeParams = {}) {
//     const { groupId } = params;
//     export function useHikeWrite(params: IUseWriteHikeParams = {}): IUseWriteHike {
//         const { hikeId, trailId, bookingId, groupId } = params;
//         const { profile } = useAuthHook();

//         const [localError, setLocalError] = useState<string | null>(null);

//         const error = useHikeStore(s => s.error);
//         const bookings = useBookingsStore(s => s.userBookings);
//         const isLoading = useHikeStore(s => s.isLoading);
//         const trails = useTrailsStore(s => s.data);
//         const hikes = useHikeStore(s => s.hikes);

//         const businessOffers = useOfferStore(s => s.businessOffers);
//         const fetchOffer = useOfferStore(s => s.fetchOfferById);

//         const currentHike = useHikeStore(s => s.currentHike);
//         const elapsedTime = useHikeStore(s => s.elapsedTime);
//         const timerStartTime = useHikeStore(s => s.timerStartTime);
//         const totalDistance = useHikeStore(s => s.totalDistance);
//         const totalElevationGain = useHikeStore(s => s.totalElevationGain);
//         const active = useHikeStore(s => s.active);
//         const shareLocationEnabled = useHikeStore(s => s.shareLocationEnabled);

//         const shareLocation = useHikeStore(s => s.startShareLocation);
//         const stopSharingLocation = useHikeStore(s => s.stopShareLocation);
//         const setShareLocationEnabled = useHikeStore(s => s.setShareLocationEnabled);

//         const updateCurrentHike = useHikeStore(s => s.updateCurrentHike);
//         const create = useHikeStore(s => s.create);


//         const createBooking = useBookingsStore(s => s.create);
//         // const [booking, setBooking] = useState<Booking | null>(null);

//         // Derive active booking directly without redundant setState cascading renders
//         const targetBookingId = bookingId || (currentHike?.mode === 'booked' ? currentHike.bookingId : undefined);
//         const booking = useMemo(() => {
//             if (!targetBookingId) return null;
//             return bookings.find(b => b.id === targetBookingId) || null;
//         }, [targetBookingId, bookings]);

//         const offerId = booking?.offer?.id;

//         // Derive full offer directly from businessOffers store
//         const fullOffer = useMemo(() => {
//             if (!offerId) return null;
//             return businessOffers.find(o => o.id === offerId) || null;
//         }, [offerId, businessOffers]);

//         // Fetch offer details into store if not already present
//         useEffect(() => {
//             if (offerId && !businessOffers.some(o => o.id === offerId)) {
//                 fetchOffer(offerId);
//             }
//         }, [offerId, businessOffers, fetchOffer]);

//         // useEffect(() => {
//         //     let found: Hike | undefined;

//         //     if (active && ((trailId && currentHike?.trail.id === trailId) || (hikeId && currentHike?.id === hikeId))) {
//         //         console.log('Active hike already loaded with matching parameters. Using current hike from store.');
//         //         return;
//         //     }

//         //     if (currentHike && ((hikeId && currentHike.id !== hikeId) || (trailId && currentHike.trail.id !== trailId)) && active) {
//         //         setLocalError(`Rerunning hike: ${currentHike.trail.name}`);
//         //         updateCurrentHike({ startTime: new Date() })
//         //         console.log(currentHike);
//         //         return;
//         //     }

//         let found: Hike | undefined;

//         //     // ✅ FIX 1: Safely handle the "new_diy_session" so the app doesn't hang
//         //     if (hikeId === 'new_diy_session') {
//         //         console.log('starting new DIY hike session');
//         //         found = newHike({
//         //             trail: {
//         //                 id: "diy",
//         //                 name: "Free Roam (DIY)",
//         //                 location: "Unknown"
//         //             },
//         //             status: 'unhiked',
//         //             mode: 'direct',
//         //             startTime: new Date(),
//         //         });
//         //         updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0 });
//         //     }
//         //     else if (hikeId) {
//         //         console.log('with hikeId: ', hikeId)
//         //         const exist = hikes.find(h => h.id === hikeId);
//         //         if (exist) {
//         //             found = exist;
//         //             if (exist.mode === 'booked' && exist.bookingId) {
//         //                 const b = bookings.find(b => b.id === exist.bookingId);
//         //                 if (b) {
//         //                     setBooking(b);
//         //                     fetchOffer(b.offer.id).then(() => {
//         //                         const offer = useOfferStore.getState().businessOffers.find(o => o.id === b.offer.id) || null;
//         //                         setFullOffer(offer);
//         //                     });
//         //                 }
//         //             }
//         //         }
//         //         console.log('found with hikeId: ', found);
//         //     }
//         //     else if (trailId) {
//         //         console.log('with trailId: ', trailId)
//         //         const trail = trails.find(t => t.id === trailId);
//         //         if (trail) {
//         //             const isBooked = !!bookingId;
//         //             found = newHike({
//         //                 trail: TrailLogic.toSummary(trail),
//         //                 status: 'unhiked',
//         //                 mode: isBooked ? 'booked' : 'direct',
//         //                 bookingId: bookingId
//         //             });

//         //             if (isBooked) {
//         //                 const b = bookings.find(b => b.id === bookingId);
//         //                 if (b) {
//         //                     setBooking(b);
//         //                     fetchOffer(b.offer.id).then(() => {
//         //                         const offer = useOfferStore.getState().businessOffers.find(o => o.id === b.offer.id) || null;
//         //                         setFullOffer(offer);
//         //                     });
//         //                 }
//         //             }

//         //             updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0 });
//         //         }
//         //     }

//         //     if (!found) {
//         //         console.log('no hike found, proceeding with empty')
//         //         updateHikeStore({
//         //             elapsedTime: 0,
//         //             timerStartTime: 0,
//         //             totalDistance: 0,
//         //             totalElevationGain: 0,
//         //             currentHike: newHike()
//         //         });
//         //         setLocalError("Hiking details not found. Proceed with caution!");
//         //     } else {
//         //         console.log('hike found, proceed with ', found)
//         //         updateHikeStore({ currentHike: found });
//         //     }


//         //     return () => {
//         //         if (
//         //             (bookingId && currentHike?.bookingId !== bookingId && currentHike?.status === 'unhiked') ||
//         //             (currentHike && (currentHike.status === 'completed' || currentHike.status === 'unhiked'))) {
//         //             console.log('linis');
//         //             console.log(currentHike)
//         //             console.log(currentHike.status);
//         //             // console.log('removing current hike');
//         //             updateHikeStore({ currentHike: null });
//         //         } else {
//         //             console.log('or nah')
//         //         }
//         //     }
//         // }, [hikeId, trailId, bookingId, profile?.id, active, currentHike, groupId, updateCurrentHike, updateHikeStore, hikes, bookings, fetchOffer, trails]);





//         const onPauseHike = () => {
//             if (!currentHike || currentHike.status !== 'started') return;
//             const currentElapsedTime = Date.now() - timerStartTime;
//             updateCurrentHike({ status: 'paused' });
//             updateHikeStore({ elapsedTime: currentElapsedTime });
//             if (groupId) {
//                 onStopSharingLocation();
//             }
//         }

//         const onResumeHike = async () => {
//             // if (!currentHike || currentHike.status !== 'paused') return;
//             // const newStartTime = Date.now() - elapsedTime;

//             // updateCurrentHike({
//             //     status: 'started',
//             // });

//             // updateHikeStore({
//             //     timerStartTime: newStartTime,
//             //     active: true,
//             // });

//             // if (groupId) {
//             //     updateHikeStore({ activeGroupId: groupId });
//             //     await onStartSharingLocation();
//             // }
//         }

//         const onCompleteHike = async () => {
//             // if (!currentHike || !profile?.id) return;

//             // // ✅ FIX 2: Calculate final seconds if they didn't pause before finishing
//             // const finalDuration = currentHike.status === 'started'
//             //     ? elapsedTime + (Date.now() - timerStartTime)
//             //     : elapsedTime;

//             // updateHikeStore({ active: false });

//             // const completedHike = newHike({
//             //     ...currentHike,
//             //     status: 'completed',
//             //     endTime: new Date(),
//             //     distance: totalDistance,
//             //     duration: finalDuration,   // ✅ Safely saves the exact millisecond duration
//             //     elevation: totalElevationGain
//             // });

//             // updateCurrentHike(completedHike);
//             // await create(profile.id, completedHike);

//             // if (completedHike.mode === 'booked' && booking) {
//             //     await createBooking({ ...booking, status: 'finished' });
//             // }

//             // if (groupId) {
//             //     onStopSharingLocation();
//             // }
//         }

//         const onResetHike = () => {
//             // if (!currentHike) return;
//             // updateCurrentHike({ status: 'unhiked', startTime: undefined, endTime: undefined });
//             // updateHikeStore({ elapsedTime: 0, timerStartTime: 0, totalDistance: 0, totalElevationGain: 0, active: false });
//         }

//         const onEmergencyPress = () => onPauseHike();

//         const onAddReview = (trailId: string) => {
//             // if (!currentHike || currentHike.status !== 'completed') return;

//             // router.push({
//             //     pathname: '/(main)/review/write',
//             //     params: {
//             //         trailId: trailId,
//             //         hikeId: currentHike.id,
//             //         distance: String(currentHike.distance || totalDistance),
//             //         duration: String(currentHike.duration || elapsedTime),
//             //         elevation: String(currentHike.elevation || totalElevationGain)
//             //     }
//             // })
//         }


//         return {
//             // hike: currentHike,
//             // error: error || localError,
//             // isLoading,
//             // booking,
//             // fullOffer: offer,

//             // elapsedTime,
//             // timerStartTime,
//             // totalDistance,
//             // totalElevationGain,
//             // shareLocationEnabled,

//             onEmergencyPress,
//             // onStartHike,
//             onAddReview,
//             onPauseHike,
//             onResumeHike,
//             onCompleteHike,
//             onResetHike,
//             setShareLocationEnabled,
//         }
//     }
