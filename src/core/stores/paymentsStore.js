import { create } from "zustand";
import { createPayment } from "../repositories/paymentRepository";

const init = {
    userPayments: [],
    error: null,
    isLoading: false,
}

export const usePaymentsStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    createPayment: async (paymentData) => {
        set({isLoading: true, error: null});

        try {
            const paymentId = await createPayment(paymentData);

            if(!paymentId) throw new Error('Payment failed');
            
            set((state) => {
                return {
                    userPayments: [
                        ...state.userPayments, 
                        { id: paymentId, ...paymentData }
                    ],
                    isLoading: false,
                }
            })

            return paymentId;
        } catch (err) {
            set({
                error: err.message || 'Failed creating payment',
                isLoading: false,
            })
        }
    },
}))