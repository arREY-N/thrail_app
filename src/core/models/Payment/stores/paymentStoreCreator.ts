import { Payment } from "@/src/core/models/Payment/interfaces/Payment.types";
import { PaymentRepo } from "@/src/core/models/Payment/repositories/PaymentRepository";
import { newPayment } from "@/src/core/models/Payment/utils/PaymentFactory";
import { useAuthStore } from "@/src/core/models/User/User";
import { StateCreator } from "zustand";

export interface PaymentState {
    payments: Payment[];
    current: Payment | null;
    isLoading: boolean;
    error: string | null;

    fetchAll: () => Promise<void>;
    refresh: () => Promise<void>;
    fetchUserPayments: (userId?: string) => Promise<void>;
    fetchBusinessPayments: (businessId: string) => Promise<void>;
    load: (id: string | null) => Promise<Payment | null>;
    create: (payment: Payment) => Promise<Payment | null>;
    remove: (id: string) => Promise<void>;
    reset: () => void;
    setCurrent: (payment: Payment | null) => void;
}

const init = {
    payments: [],
    current: null,
    isLoading: false,
    error: null,
};

export const paymentStoreCreator: StateCreator<
    PaymentState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    fetchAll: async () => {
        set({ isLoading: true, error: null });
        try {
            if (get().payments.length > 0) {
                set({ isLoading: false });
                return;
            }

            const payments = await PaymentRepo.fetchAll();
            set({ payments, isLoading: false });
        } catch (err) {
            console.error("Failed to fetch all payments:", err);
            set({ error: (err as Error).message ?? "Failed to load payments", isLoading: false });
        }
    },

    refresh: async () => {
        set({ isLoading: true, error: null });
        try {
            const payments = await PaymentRepo.fetchAll();
            set({ payments, isLoading: false });
        } catch (err) {
            console.error("Failed to refresh payments:", err);
            set({ error: (err as Error).message ?? "Failed to refresh payments", isLoading: false });
        }
    },

    fetchUserPayments: async (userId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const targetUserId = userId || useAuthStore.getState().profile?.id;
            if (!targetUserId) {
                set({ isLoading: false });
                return;
            }

            const payments = await PaymentRepo.fetchByUserId(targetUserId);
            set({ payments, isLoading: false });
        } catch (err) {
            console.error("Failed to fetch user payments:", err);
            set({ error: (err as Error).message ?? "Failed to load user payments", isLoading: false });
        }
    },

    fetchBusinessPayments: async (businessId: string) => {
        if (!businessId) return;
        set({ isLoading: true, error: null });
        try {
            const payments = await PaymentRepo.fetchByBusinessId(businessId);
            set({ payments, isLoading: false });
        } catch (err) {
            console.error("Failed to fetch business payments:", err);
            set({ error: (err as Error).message ?? "Failed to load business payments", isLoading: false });
        }
    },

    load: async (id: string | null): Promise<Payment | null> => {
        if (!id) {
            const empty = newPayment();
            set({ current: empty, isLoading: false });
            return empty;
        }

        set({ isLoading: true, error: null });
        try {
            let payment = get().payments.find((p) => p.id === id) || null;

            if (!payment) {
                payment = await PaymentRepo.fetchById(id);
            }

            if (!payment) {
                set({ error: "Payment record not found", isLoading: false });
                return null;
            }

            set((state) => {
                state.current = payment;
                const exists = state.payments.some((p) => p.id === id);
                if (!exists && payment) {
                    state.payments.push(payment);
                }
                state.isLoading = false;
            });

            return payment;
        } catch (err) {
            console.error("Failed to load payment:", err);
            set({ error: (err as Error).message ?? "Failed to load payment", isLoading: false });
            return null;
        }
    },

    create: async (payment: Payment): Promise<Payment | null> => {
        set({ isLoading: true, error: null });
        try {
            const savedPayment = await PaymentRepo.write(payment);
            set((state) => {
                const index = state.payments.findIndex((p) => p.id === savedPayment.id);
                if (index !== -1) {
                    state.payments[index] = savedPayment;
                } else {
                    state.payments.push(savedPayment);
                }
                state.current = savedPayment;
                state.isLoading = false;
            });
            return savedPayment;
        } catch (err) {
            console.error("Failed to save payment:", err);
            set({ error: (err as Error).message ?? "Failed to save payment", isLoading: false });
            return null;
        }
    },

    remove: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await PaymentRepo.delete(id);
            set((state) => {
                state.payments = state.payments.filter((p) => p.id !== id);
                if (state.current?.id === id) {
                    state.current = null;
                }
                state.isLoading = false;
            });
        } catch (err) {
            console.error("Failed to delete payment:", err);
            set({ error: (err as Error).message ?? "Failed to delete payment", isLoading: false });
        }
    },

    reset: () => set(init),

    setCurrent: (payment: Payment | null) => set({ current: payment }),
});
