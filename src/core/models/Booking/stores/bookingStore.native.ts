import { BookingState, bookingStoreCreator } from "@/src/core/models/Booking/stores/bookingStoreCreator";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useBookingsStore = create<BookingState>()(
    persist(immer(bookingStoreCreator), {
        name: "booking-storage",
    }),
);