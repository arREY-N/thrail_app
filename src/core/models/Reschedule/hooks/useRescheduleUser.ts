import { Booking } from "@/src/core/models/Booking/Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import { formatDateToStandard } from "@/src/utils/dateFormatter";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform } from "react-native";

export const useRescheduleUser = () => {
    const [localError, setLocalError] = useState<string | null>(null);
    
    const onRescheduleBooking = async (bookingToReschedule: Booking, newOffer: Offer) => {
        try {
            if(!bookingToReschedule) throw new Error('No booking found');
            if(!newOffer) throw new Error('A new offer must be provided to reschedule');

            console.log("TODO: Backend Reschedule Integration", {
                oldBooking: bookingToReschedule,
                newOffer: newOffer
            });

            const msg = `Successfully requested to reschedule to ${newOffer.trail?.name || 'a new date'} on ${formatDateToStandard(newOffer.date)}. (Placeholder)`;

            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert("Reschedule Requested", msg);
            }

            router.back();

        } catch (error) {
            setLocalError((error as Error).message || 'Failed to reschedule booking');
        }
    }

    return {
        localError,
        onRescheduleBooking
    }
}