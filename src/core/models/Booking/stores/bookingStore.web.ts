import { BookingState, bookingStoreCreator } from "@/src/core/models/Booking/stores/bookingStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useBookingsStore = create<BookingState>()(
    immer(bookingStoreCreator)
);