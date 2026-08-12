import { BookingRepo } from "@/src/core/init/repositories";
import { Booking } from "@/src/core/models/Booking/interfaces/IBooking";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface BookingState {
    create: (booking: Booking, isAdmin?: boolean) => Promise<Booking>;
    checkBookings: (id: string) => boolean;
    reset: () => void;
    fetchOfferBookings: (offerId: string, role: string) => Promise<void>;
    loadById: (bookingId: string) => Promise<void>;
    loadAll: (role: string) => Promise<void>;
    load: (userId: string) => Promise<void>;
    refresh: (userId?: string | null) => Promise<void>;
    subscribeToBusinessBookings: (offerId: string, businessId: string) => Promise<void>;
    unsubscribeFromBusinessBookings: (offerId: string) => void;
    subscribeToUserBookings: (userId: string) => Unsubscribe;
    deleteBooking: (bookingId: string) => Promise<void>;

    data: Booking[];
    subscriptionError: string | null;
    error: string | null;
    isLoading: boolean;
    isWriting: boolean;
    userBookings: Booking[];
    offerBookings: Booking[];
    businessBookings: Booking[];

    bookingByOffer: Record<string, Booking[]>;
    activeListeners: Record<string, Unsubscribe>;
}

const init = {
    data: [],
    userBookings: [],
    businessBookings: [],
    offerBookings: [],
    error: null,
    subscriptionError: null,
    isLoading: false,
    isWriting: false,
    bookingByOffer: {},
    activeListeners: {},
};

export const bookingStoreCreator: StateCreator<BookingState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    reset: () => set(init),

    subscribeToUserBookings: (userId: string): Unsubscribe => {
        try {
            return BookingRepo.listenToUserBookings(userId, (bookings) =>
                set({
                    userBookings: bookings,
                }),
            );
        } catch (error) {
            console.error("Error subscribing to user bookings: ", error);
            set({ subscriptionError: "Failed to subscribe to user bookings" });
            throw error;
        }
    },

    subscribeToBusinessBookings: async (offerId: string, businessId: string) => {
        try {
            if (get().activeListeners[offerId]) {
                return;
            }

            if (!businessId) {
                throw new Error("Business ID is required for subscribing to business bookings");
            }

            const unsubscribe = BookingRepo.listenToBusinessBookings(offerId, businessId, (bookings) =>
                set((state) => ({
                    bookingByOffer: {
                        ...state.bookingByOffer,
                        [offerId]: bookings,
                    },
                })),
            );

            set((state) => ({
                activeListeners: {
                    ...state.activeListeners,
                    [offerId]: unsubscribe,
                },
            }));
        } catch (error) {
            console.error("Error subscribing to business bookings: ", error);
            throw error;
        }
    },

    deleteBooking: async (bookingId: string) => {
        try {
            set({ isWriting: true, error: null });

            const booking = get().userBookings.find((b) => b.id === bookingId);

            if (!booking) {
                throw new Error("Booking not found");
            }

            if(booking.status !== 'for-reservation'){
                throw new Error("Only bookings with pending status can be deleted.");
            }

            if(booking.offer.date < new Date()) {
                throw new Error("You cannot cancel a booking for a past date.");
            }

            await BookingRepo.delete(bookingId, booking.user.id);
            set((state) => ({
                userBookings: state.userBookings.filter((b) => b.id !== bookingId),
                isWriting: false,
            }));
        } catch (error) {
            set({ isWriting: false, error: `Failed to delete booking: ${(error as Error).message}` });
            throw error;
        }
    },

    unsubscribeFromBusinessBookings: (offerId: string) => {
        const unsubscribe = get().activeListeners[offerId];

        if (unsubscribe) {
            unsubscribe();
            set((state) => {
                const newListeners = { ...state.activeListeners };
                delete newListeners[offerId];
                return {
                    ...state,
                    activeListeners: newListeners,
                };
            });
        }
    },

    loadAll: async (role: string) => {
        set({ isLoading: true, error: null });
        try {
            if (role !== "superadmin") {
                throw new Error("Only superadmins can fetch all bookings");
            }

            const bookings = await BookingRepo.fetchAll();
            set({ userBookings: bookings, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchOfferBookings: async (offerId: string, role: string) => {
        set({ isLoading: true, error: null });
        try {
            if (role !== "admin") {
                throw new Error("Only admins can fetch bookings for their offers");
            }

            const offerBookings = await BookingRepo.fetchOfferBookings(offerId);

            set({
                offerBookings,
                isLoading: false,
            });
        } catch (err) {
            set({ isLoading: false });
            throw err;
        }
    },

    refresh: async (userId?: string | null) => {
        set({ isLoading: true, error: null });

        try {
            if (!userId) {
                throw new Error("User ID is required for refreshing bookings");
            }

            const userBookings = await BookingRepo.fetchUserBookings(userId);

            set({
                userBookings,
                isLoading: false,
            });
        } catch (err) {
            set({ isLoading: false });
            throw err;
        }
    },

    load: async (userId: string) => {
        if (get().userBookings?.length > 0 && get().userBookings[0].user.id === userId) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const userBookings = await BookingRepo.fetchUserBookings(userId);

            set({
                userBookings,
                isLoading: false,
            });
        } catch (err) {
            set({ isLoading: false });
            throw err;
        }
    },

    loadById: async (bookingId: string) => {
        try {
            set({ isLoading: true, error: null });

            let booking = null;

            if (get().data.length > 0) {
                console.log('[bookingStore] Searching for booking in store data...');
                booking = get().data.find((b) => b.id === bookingId) ?? null;
            }

            if (!booking) {
                console.log('[bookingStore] Booking not found in store data. Fetching from repository...');
                booking = await BookingRepo.fetchById(bookingId);
            }

            if(!booking) {
                console.log('[bookingStore] Booking not found in repository.');
                throw new Error("Booking not found");
            }

            console.log('loaded booking:', upsertItem(get().data, booking));
            set({
                isLoading: false,
                data: upsertItem(get().data, booking),
            })
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    create: async (booking: Booking, isAdmin = false) => {
        try {
            const existing = [get().userBookings, get().offerBookings, get().businessBookings].flat().find(b => b.offer.id === booking.offer.id);
            

            if (existing && existing.status !== 'reservation-rejected') {
                throw new Error("Booking for this offer already exists and is currently in progress.");
            }

            set({ isLoading: true, error: null });

            const result = await BookingRepo.write(booking);

            set((state) => {
                if(isAdmin) {
                    return {
                        offerBookings: upsertItem(state.offerBookings, result)
                    }
                } else {
                    return {
                        userBookings: upsertItem(state.userBookings, result),
                    }
                }
            });

            return result;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    // create: async (booking: Booking, isAdmin = false) => {
    //     set({ isLoading: true, error: null });

    //     try {


    //         const data = await BookingRepo.write(booking);

    //         set((state) => {
    //             const index = isAdmin
    //                 ? state.offerBookings.findIndex((b) => b.id === data.id)
    //                 : state.userBookings.findIndex((b) => b.id === data.id);

    //             if (index !== -1) {
    //                 if (isAdmin) {
    //                     state.offerBookings[index] = data;
    //                 } else {
    //                     state.userBookings[index] = data;
    //                 }
    //             } else if (isAdmin) {
    //                 state.offerBookings.push(data);
    //             } else {
    //                 state.userBookings.push(data);
    //             }

    //             state.isLoading = false;
    //         });
    //         return data;
    //     } catch (err) {
    //         set({ isLoading: false });
    //         throw err;
    //     }
    // },

    checkBookings: (id: string): boolean => {
        set({ isLoading: true, error: null });

        try {
            if (get().userBookings.some((u) => u.offer.id === id)) {
                throw new Error("Already booked this offer");
            }

            set({ isLoading: false, error: null });
            return true;
        } catch (err) {
            set({ isLoading: false });
            throw err;
        }
    }
});