import { BaseStore } from "@/src/core/interface/storeInterface";
import { Booking } from "@/src/core/models/Booking/Booking";
import { BookingRepository } from "@/src/core/repositories/bookingRepository";
import { create } from "zustand";

interface BookState extends BaseStore<Booking>{
    loadUserBookings: (id: string) => Promise<void>;
    create: (...args: any) => Promise<boolean>;
    checkBookings: (id: string) => boolean;
    cancelBooking: (booking: Booking, businessId: string) => Promise<void>;
    reset: () => void;

    error: string | null;
    isLoading: boolean;
    userBookings: Booking[];
}

const init = {
    data: [],
    current: new Booking(),
    userBookings: [],
    error: null,
    isLoading: false,
}

export const useBookingsStore = create<BookState>()((set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async () => {

    },

    refresh: async () => {

    },

    load: async () => {

    },

    delete: async () => {

    },


    loadUserBookings: async (userId: string) => {
        // if(get().userBookings?.length > 0 && get().userBookings[0].userId === userId) return;

        set({isLoading: true, error: null});

        try {
            const userBookings = await BookingRepository.fetchUserBookings(userId);

            set({
                userBookings, 
                isLoading: false,
            })

        } catch (err) {
            set({
                error: (err as Error).message || `Failed loading bookings for ${userId}`,
                isLoading: false 
            })
        }
    },

    create: async ({cancelledBy, bookingData}) => {
        set({isLoading: true, error: null});

        try {
            console.log('Store: ', bookingData);

            const bookingId = await BookingRepository.write({
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
            return true;
        } catch (err) {
            set({
                error: (err as Error).message || 'Failed creating booking',
                isLoading: false,
            })
            return false;
        }
    },

    checkBookings: (id: string): boolean => {
        set({ isLoading: true, error: null });

        try {
            console.log('Checking ', id);

            if(get().userBookings.some(u => u.offerId === id))
                throw new Error('Already booked this offer');

            set({ isLoading: false, error: null });
            
            return true;
        } catch (err) {
            set({
                error: (err as Error).message,
                isLoading: false,
            })
        }

        return false;
    },

    cancelBooking: async (bookingData: Booking, businessId: string) => {
        set({isLoading: true, error: null});

        try {
            await BookingRepository.cancelBooking(bookingData, businessId);

            bookingData.status = 'cancelled';

            set((state) => {
                const newBookingList = state.userBookings.filter(
                    u => u.id !== bookingData.id
                )

                return{
                    userBookings: [...newBookingList, bookingData],
                    isLoading: false
                }
            });
        } catch (err) {
            set({
                isLoading: false,
                error: (err as Error).message || 'Failed cancelling booking'
            })
        }
    }
}));

export default useBookingsStore