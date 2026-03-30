import { BaseStore } from "@/src/core/interface/storeInterface";
import { Booking } from "@/src/core/models/Booking/Booking";
import { BookingRepository } from "@/src/core/repositories/bookingRepository";
import { dummyBookings } from "@/src/core/stores/dummyData";
import { create } from "zustand";

interface BookState extends BaseStore<Booking>{
    create: (...args: any) => Promise<boolean>;
    checkBookings: (id: string) => boolean;
    cancelBooking: (booking: Booking, businessId: string) => Promise<void>;
    reset: () => void;

    error: string | null;
    isLoading: boolean;
    userBookings: Booking[];
}

const init = {
    data: [...dummyBookings],
    current: new Booking(),
    userBookings: dummyBookings,
    error: null,
    isLoading: false,
}

export const useBookingsStore = create<BookState>()((set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async () => {

    },

    refresh: async (userId?: string | null) => {
        set({isLoading: true, error: null});

        try {
            if(!userId) 
                throw new Error('User ID is required for refreshing bookings');
            
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

    load: async (userId: string) => {
        if(get().userBookings?.length > 0 && get().userBookings[0].userId === userId) 
            return;

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

    delete: async () => {

    },

    create: async (booking: Booking) => {
        set({isLoading: true, error: null});

        try {
            const data = await BookingRepository.write(booking);

            set((state) => {
                const updated = state.userBookings.some(b => b.id === data.id) 
                    ? state.userBookings.map(b => b.id === data.id ? data : b)
                    : [...state.userBookings, data]

                return {
                    userBookings: updated,
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

            bookingData.status = 'for-cancellation';

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