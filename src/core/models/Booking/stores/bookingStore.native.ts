import { BookingState, bookingStoreCreator } from "@/src/core/models/Booking/stores/bookingStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useBookingsStore = create<BookingState>()(
    persist(
        immer(bookingStoreCreator),
        {
            name: "booking-storage",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)