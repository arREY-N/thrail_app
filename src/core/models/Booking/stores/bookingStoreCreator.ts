import { BookingRepo } from "@/src/core/init/repositories";
import { Booking } from "@/src/core/models/Booking/Ref_Booking";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface BookingState {
    create: (booking: Booking, isAdmin?: boolean) => Promise<Booking>;
    checkBookings: (id: string) => boolean;
    reset: () => void;
    fetchOfferBookings: (offerId: string, role: string) => Promise<void>;
    loadById: (bookingId: string) => Promise<Booking | null>;
    loadAll: (role: string) => Promise<void>;
    load: (userId: string) => Promise<void>;
    refresh: (userId?: string | null) => Promise<void>;
    subscribeToBusinessBookings: (offerId: string) => Promise<void>;
    unsubscribeFromBusinessBookings: (offerId: string) => void;
    subscribeToUserBookings: (userId: string) => Unsubscribe;
    createBooking: (booking: Booking) => Promise<void>;

    data: Booking[];
    subscriptionError: string | null;
    error: string | null;
    isLoading: boolean;
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

    subscribeToBusinessBookings: async (offerId: string) => {
        try {
            if (get().activeListeners[offerId]) {
                return;
            }

            const { businessId } = useAuthStore.getState();

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
                booking = get().data.find((b) => b.id === bookingId) ?? null;
            }

            if (!booking) {
                booking = await BookingRepo.fetchById(bookingId);
            }

            set((state) => {
                state.data = booking ? [...state.data.filter((b) => b.id !== booking.id), booking] : state.data;
                state.isLoading = false;
            });

            return booking;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    createBooking: async (booking: Booking) => {
        try {
            set({ isLoading: true, error: null });
            console.log("Creating booking: ", booking);
            const result = await BookingRepo.write(booking);

            set({
                data: [...get().data.filter((b) => b.id !== result.id), result],
                isLoading: false,
            })
        } catch (error) {
            console.error("Error creating booking:", (error as Error).message);
            set({ isLoading: false });
            throw error;
        }
    },

    create: async (booking: Booking, isAdmin = false) => {
        set({ isLoading: true, error: null });

        try {
            const data = await BookingRepo.write(booking);

            set((state) => {
                const index = isAdmin
                    ? state.offerBookings.findIndex((b) => b.id === data.id)
                    : state.userBookings.findIndex((b) => b.id === data.id);

                if (index !== -1) {
                    if (isAdmin) {
                        state.offerBookings[index] = data;
                    } else {
                        state.userBookings[index] = data;
                    }
                } else if (isAdmin) {
                    state.offerBookings.push(data);
                } else {
                    state.userBookings.push(data);
                }

                state.isLoading = false;
            });
            return data;
        } catch (err) {
            set({ isLoading: false });
            throw err;
        }
    },

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