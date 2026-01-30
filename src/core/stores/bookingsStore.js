import { create } from "zustand";
import { cancelBooking, createBooking, fetchUserBookings } from "../repositories/bookingRepository";

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

    createBooking: async ({cancelledBy, bookingData}) => {
        set({isLoading: true, error: null});

        try {
            console.log('Store: ', bookingData);

            const bookingId = await createBooking({
                ...bookingData,
                ...cancelledBy
            });

            set((state) => {
                console.log({ bookingId, ...bookingData })
                return {
                    userBookings: [
                        ...state.userBookings, 
                        { bookingId, ...bookingData }
                    ],
                    isLoading: false,
                }
            })
        } catch (err) {
            set({
                error: err.message || 'Failed creating booking',
                isLoading: false,
            })
        }
    },

    checkBookings: (id) => {
        set({ isLoading: true, error: null });

        try {
            console.log('Checking ', id);

            if(get().userBookings.some(u => u.offerId === id))
                throw new Error('Already booked this offer');

            set({ isLoading: false, error: null });
            
            return true;
        } catch (err) {
            set({
                error: err.message,
                isLoading: false,
            })
        }
    },

    cancelBooking: async (bookingData) => {
        set({isLoading: true, error: null});

        try {
            const cancelledBooking = await cancelBooking(bookingData);

            if(!cancelledBooking) throw new Error('Cancelled object not retrieved');

            set((state) => {
                const newBookingList = state.userBookings.filter(
                    u => u.id !== cancelledBooking.id
                )

                return{
                    userBookings: [...newBookingList, cancelledBooking],
                    isLoading: false
                }
            });
        } catch (err) {
            set({
                isLoading: false,
                error: err.message || 'Failed cancelling booking'
            })
        }
    }
}));

export default useBookingsStore