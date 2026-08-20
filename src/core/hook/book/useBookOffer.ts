
import { Booking, newBooking, useBookingsStore } from "@/src/core/models/Booking/Booking";

import { useState } from "react";
import { Alert } from "react-native";

export type UseBookOfferParams = {
    bookingId?: string;
    trailId?: string;
    offerId?: string;
}

export default function useBookOffer(params: UseBookOfferParams = {}) {
    Alert.alert('useBookOffer() is to be deprecated. Remove any usage of this hook. Report an issue if replacement hook is needed');

    const bookings = useBookingsStore(s => s.userBookings);
    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);

    const [booking, setBooking] = useState<Booking>(newBooking());

    return {
        booking,
        bookings,
        error,
        isLoading,
    }
}