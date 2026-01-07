import { create } from "zustand";
import { createBooking, fetchUserBookings } from "../repositories/bookingRepository";

const init = {
    userBookings: [],
    error: null,
    isLoading: false,
}

export const useBookingsStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    loadUserBookings: async (userId) => {
        // if(get().userBookings?.length > 0 && get().userBookings[0].userId === userId) return;

        set({isLoading: true, error: null});

        try {
            const userBookings = await fetchUserBookings(userId);

            set({
                userBookings, 
                isLoading: false,
            })

        } catch (err) {
            set({
                error: err.message || `Failed loading bookings for ${userId}`,
                isLoading: false 
            })
        }
    },

    createBooking: async (bookingData) => {
        set({isLoading: true, error: null});

        try {
            console.log('Store: ', bookingData);

            const bookingId = await createBooking(bookingData);

            set((state) => {
                console.log({ bookingId, ...bookingData })
                return {
                    userBookings: [...state.userBookings, { bookingId, ...bookingData }],
                    isLoading: false,
                }
            })
        } catch (err) {
            set({
                error: err.message || 'Failed creating booking',
                isLoading: false,
            })
        }
    }
}));

export default useBookingsStore