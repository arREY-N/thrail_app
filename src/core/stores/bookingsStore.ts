import { Booking } from "@/src/core/models/Booking/Booking";
import { BookingRepository } from "@/src/core/repositories/bookingRepository";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface BookState{
    create: (...args: any) => Promise<Booking>;
    checkBookings: (id: string) => boolean;
    cancelBooking: (booking: Booking, businessId: string) => Promise<void>;
    reset: () => void;
    fetchOfferBookings: (offerId: string, role: string) => Promise<void>;
    loadById: (bookingId: string) => Promise<void>; 
    loadAll: (role: string) => Promise<void>;
    load: (userId: string) => Promise<void>;
    
    data: Booking[];
    error: string | null;
    isLoading: boolean;
    userBookings: Booking[];
    offerBookings: Booking[];
}

const init = {
    data: [],
    userBookings: [],
    businessBookings: [],
    offerBookings: [],
    error: null,
    isLoading: false,
}

export const useBookingsStore = create<BookState>()(immer((set, get) => ({
    ...init,

    reset: () => set(init),

    loadAll: async (role: string) => {
        set({isLoading: true, error: null});
        try {
            if(role !== 'superadmin')
                throw new Error('Only superadmins can fetch all bookings');

            const bookings = await BookingRepository.fetchAll();
            set({ userBookings: bookings, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error
        }
    },

    fetchOfferBookings: async (offerId: string, role: string) => {
        set({isLoading: true, error: null});
        try {
            if(role !== 'admin')
                throw new Error('Only admins can fetch bookings for their offers');

            const offerBookings = await BookingRepository.fetchOfferBookings(offerId);

            set({
                offerBookings,
                isLoading: false,
            })
        } catch (err) {
            set({ isLoading: false })
            throw err
        }
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
            set({ isLoading: false })
            throw err
        }
    },

    load: async (userId: string) => {
        if(get().userBookings?.length > 0 && get().userBookings[0].user.id === userId) 
            return;

        set({isLoading: true, error: null});

        try {
            const userBookings = await BookingRepository.fetchUserBookings(userId);

            set({
                userBookings, 
                isLoading: false,
            })

        } catch (err) {
            set({ isLoading: false })
            throw err;
        }
    },

    loadById: async (bookingId: string) => {
        try {
            set({ isLoading: true, error: null });

            let booking = null;

            if(get().data.length > 0){
                booking = get().data.find(b => b.id === bookingId);
            }

            if(!booking){
                booking = await BookingRepository.fetchById(bookingId);
            }

            set((state) => {
                state.data = booking ? [...state.data.filter(b => b.id !== booking.id), booking] : state.data;
                state.isLoading = false;
            })
        } catch (error) {
            set({ isLoading: false })
            throw error;
        } 
    },

    delete: async () => {

    },

    create: async (booking: Booking, isAdmin: Boolean = false) => {
        set({isLoading: true, error: null});

        try {
            const data = await BookingRepository.write(booking);

            set((state) => {
                const index = isAdmin
                    ? state.offerBookings.findIndex(b => b.id === booking.id)
                    : state.userBookings.findIndex(b => b.id === booking.id); 
                
                if(index !== -1){
                    if(isAdmin){
                        state.offerBookings[index] = data;
                    } else {
                        state.userBookings[index] = data;
                    }
                } else {
                    if(isAdmin){
                        state.offerBookings.push(data);
                    } else {
                        state.userBookings.push(data);
                    }
                }
                
                state.isLoading = false;
            })
            return data;
        } catch (err) {
            set({ isLoading: false, })
            throw err;
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
            set({ isLoading: false, })
            throw err;
        }
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
            set({ isLoading: false })
            throw err;
        }
    }
})));

export default useBookingsStore