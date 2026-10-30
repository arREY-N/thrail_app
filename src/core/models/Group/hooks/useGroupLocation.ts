import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/interfaces/Group.types";
import { GroupRepo } from "@/src/core/models/Group/repositories/GroupRepository";
import { HikeRepo, newHike, useHikeStore } from "@/src/core/models/Hike/Hike";
import { newMessage } from "@/src/core/models/Message/Message";
import { useAuthHook } from "@/src/core/models/User/User";
import { useFilesStore } from "@/src/core/stores/fileStore";
import { logger } from "@/src/core/utility/errorFormatter";
import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";

export const DEFAULT_EMERGENCY_HOTLINE = '911';

export function useGroupLocation(groupId: string) {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);

    // Automatically subscribe to group member locations on mount; unsubscribe on unmount
    useEffect(() => {
        if (!groupId) return;

        // If hikeStore already has an active listener for this groupId, avoid duplicate listener
        if (typeof useHikeStore.getState().activeListeners[groupId] === "function") {
            return;
        }

        const unsub = HikeRepo.listenToLocations(groupId, (locations) => {
            useHikeStore.setState((state) => ({
                locationByGroup: { ...state.locationByGroup, [groupId]: locations }
            }));
        });

        return () => {
            if (typeof unsub === "function") {
                unsub();
            }
            // Only clean up locationByGroup if hikeStore is not actively sharing/listening to this group
            if (!useHikeStore.getState().activeListeners[groupId]) {
                useHikeStore.setState((state) => {
                    const newLocations = { ...state.locationByGroup };
                    delete newLocations[groupId];
                    return { locationByGroup: newLocations };
                });
            }
        };
    }, [groupId]);

    const isLive = useHikeStore(s => s.live);

    const rawLocation = useHikeStore(s => s.locationByGroup[groupId]);

    const location = rawLocation ?? [];

    const currentHike = useHikeStore(s => s.currentHike);

    const shareLocation = useHikeStore(s => s.startShareLocation);
    const stopSharingLocation = useHikeStore(s => s.stopShareLocation);

    const updateHikeStore = useHikeStore(s => s.updateHikeStore);
    const updateCurrentHike = useHikeStore(s => s.updateCurrentHike);
    const startHike = useHikeStore(s => s.startHike);
    const elapsedTime = useHikeStore(s => s.elapsedTime);
    const currentLocation = useHikeStore(s => s.currentLocation);

    const uploadDocument = useFilesStore(s => s.uploadDocument);
    const capturePhoto = useFilesStore(s => s.capturePhoto);

    const create = useHikeStore(s => s.create);

    const contactNumber = profile?.emergencyContact?.contactNumber || "";
    const chatId = profile?.emergencyContact?.chatId || null;
    const contactName = profile?.emergencyContact?.name || "your emergency contact";

    const onStartSharingLocation = async () => {
        try {
            await shareLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sharing location.");
        }
    };

    const onStopSharingLocation = () => {
        try {
            stopSharingLocation(groupId);
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while stopping location sharing.");
        }
    };

    const onSendPicture = async () => {
        try {
            if (!profile) return;

            const currentChatId = profile?.emergencyContact?.chatId || null;

            let documentUrl: string | null = null;

            if (Platform.OS === 'web') {
                documentUrl = await uploadDocument();
            } else if (Platform.OS === 'android' || Platform.OS === 'ios') {
                documentUrl = await capturePhoto();
            }

            if (!documentUrl)
                throw new Error(`Failed to capture or upload photo`);

            const msg = newMessage({
                content: `${documentUrl}`,
                senderId: profile.id,
                senderName: profile.firstname,
                timesent: new Date(),
            });

            logger('useGroupLocation', 'sending picture', groupId);

            if (groupId) {
                logger('useGroupLocation', 'Sending to group: ', groupId);
                await GroupRepo.sendMessage(groupId, msg);
                return;
            }

            if (currentChatId) {
                logger('useGroupLocation', 'Sending to chat: ', currentChatId);
                await GroupRepo.sendMessage(currentChatId, msg);
                return;
            }

            throw new Error('Cannot send a picture to non-app users. If this is an independent hike, please check if you have set an emergency contact that has an active Thrail account');
        } catch (error) {
            console.log(error);
            setLocalError(error instanceof Error ? error.message : "An unexpected error occurred while sending picture.");
        }
    };

    const onEmergencyPress = async (): Promise<{ success: boolean; reason?: string }> => {
        console.log('sending emergency message');

        if (!profile) return { success: false, reason: 'UNAUTHENTICATED' };

        if (!currentLocation) {
            setLocalError("No location data available to send emergency alert");
            return { success: false, reason: 'NO_LOCATION' };
        }

        const mapLink = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;

        const msg = newMessage({
            content: `Send help! \n\nLast known location: ${mapLink} \n\nTime: ${currentLocation.timestamp}`,
            senderId: profile.id,
            senderName: profile.firstname,
            timesent: new Date(),
        });

        if (groupId) {
            logger('useGroupLocation', 'Sending to group: ', groupId);
            await GroupRepo.sendMessage(groupId, msg);
            return { success: true };
        }

        if (chatId) {
            logger('useGroupLocation', 'Sending to chat: ', chatId);
            await GroupRepo.sendMessage(chatId, msg);
            return { success: true };
        }

        if (contactNumber) {
            onSendSMS();
            return { success: true };
        }

        return { success: false, reason: 'NO_EMERGENCY_RECIPIENT' };
    };

    const onSendSMS = () => {
        const lat = currentLocation?.latitude ?? 0;
        const lon = currentLocation?.longitude ?? 0;
        const coordsText = (currentLocation?.latitude && currentLocation?.longitude)
            ? `[${lat.toFixed(6)}, ${lon.toFixed(6)}]`
            : "[Location Pending]";
        const recipient = contactNumber || DEFAULT_EMERGENCY_HOTLINE;
        const message = `THRAIL APP EMERGENCY SOS \n\nThis is ${profile?.firstname || ""} ${profile?.lastname || ""}. I have assigned you, ${contactName}, as my contact person. \nI am having a trail emergency and require immediate assistance. Copy this location in any browser or in Google Maps: \n\n${coordsText}`;
        Linking.openURL(`sms:${recipient}?body=${encodeURIComponent(message)}`);
    };

    const onStartHike = async (group: Group, booking: Booking) => {
        try {
            if (!profile?.id)
                throw new Error("User not authenticated. Please log in to share location");

            if (currentHike && currentHike.trail.id !== group.trail.id)
                throw new Error(`You already have an active hike in ${currentHike?.trail.name} for a different trail. Please end that hike before starting a new one.`);

            const hike = newHike({
                status: 'started',
                mode: 'booked',
                bookingId: booking.id,
                startTime: new Date(),
                hikeDate: booking.offer.date,
                trail: group.trail,
            });

            updateHikeStore({ currentHike: hike });
            await startHike(hike, profile);
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
    };

    const onPauseHike = () => {
        if (!currentHike || currentHike.status !== 'started') {
            setLocalError("No active hike to pause");
            return;
        }

        updateCurrentHike({ status: 'paused' });
    };

    const onCompleteHike = async () => {
        if (!currentHike) {
            setLocalError("No active hike to complete");
            return;
        }

        if (groupId) {
            onStopSharingLocation();
        }

        updateHikeStore({
            active: false,
            elapsedTime: 0,
            timerStartTime: undefined,
        });

        updateCurrentHike({
            status: 'completed',
            endTime: new Date(),
        });

        await create(profile!.id);
    };

    return {
        onStartSharingLocation,
        onStopSharingLocation,
        onStartHike,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onEmergencyPress,
        onSendPicture,
        onSendSMS,
        location,
        error: localError,
        isLive,
        currentHike,
    };
}
export default useGroupLocation;
