import { BookingState, bookingStoreCreator } from "@/src/core/models/Booking/stores/bookingStoreCreator";
import { createThrottledJSONStorage } from "@/src/core/utility/createThrottledAsyncStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useBookingsStore = create<BookingState>()(
    persist(
        immer(bookingStoreCreator),
        {
            name: "booking-storage",
            storage: createThrottledJSONStorage(500),
            partialize: (state) => ({
                data: state.data,
                userBookings: state.userBookings,
                businessBookings: state.businessBookings,
                offerBookings: state.offerBookings,
            }),
        }
    )
);