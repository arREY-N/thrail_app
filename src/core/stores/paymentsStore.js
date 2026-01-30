import { pay } from '@/src/core/domain/paymentDomain';
import { create } from "zustand";
import { createPayment, fetchPayment } from "../repositories/paymentRepository";

const init = {
    userPayments: [],
    error: null,
    isLoading: false,
    payment: null,
}

export const usePaymentsStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    createPayment: async (paymentData) => {
        console.error('TEST VALIDATION ONLY');
        
        set({ isLoading: true, error: null})
        
        const { profile, offer, mode } = paymentData;
        const { firstname, lastname, email } = profile;
        const { businessId, businessName, hike } = offer 

        try {
            if(!mode) throw new Error('No payment mode selected')

            const receipt = pay();
            
            const { reference, amount, createdAt } = receipt;

            const paymentRecord = {
                user: {
                    id: profile.id,
                    name: `${firstname} ${lastname}`,
                    email
                },
                business: {
                    id: businessId,
                    name: businessName
                }, 
                receipt: {
                    id: reference,
                    amount: amount,
                    paidOn: createdAt,
                },
                offer: {
                    id: offer.id,
                    trail: hike.trail.name,
                }
            }

            const paymentId = await createPayment(paymentRecord);
            
            if(!paymentId) throw new Error('Payment failed');
            
            set((state) => {
                return {
                    userPayments: [
                        ...state.userPayments, 
                        { id: paymentId, ...paymentRecord }
                    ],
                    isLoading: false,
                }
            })
            
            return {id:paymentId, ...paymentRecord};
        } catch (err) {
            console.error(err.message);
            set({
                error: err.message || 'Failed validating payment',
                isLoading: false,
            })
        }
    },

    loadPayment: async (id) => {
        set({ isLoading: true, error: null });

        try {
            let receipt = null;

            if(get().userPayments.length === 0){
                console.log('no records');
                receipt = await fetchPayment(id);
            } else {
                console.log('in store')
                receipt = get().userPayments.find(p => p.id ===id);
            }

            if(!receipt) throw new Error('No receipt found');
            
            set({
                payment: receipt,
                isLoading: false
            })

        } catch (err) {
            console.log(err.message);
            set({
                error: err.message,
                isLoading: false
            })
        }
    }
}))