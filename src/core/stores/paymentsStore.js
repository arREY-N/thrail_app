import { create } from "zustand";
import { createPayment, createReceipt, fetchPayment } from "../repositories/paymentRepository";

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
        const { business, trail, price } = offer 

        try {
            if(!mode) throw new Error('No payment mode selected')

            const receipt = createReceipt(price);
            
            const { reference, amount, createdAt } = receipt;

            const paymentRecord = {
                user: {
                    id: profile.id,
                    name: `${firstname} ${lastname}`,
                    email
                },
                business: {
                    id: business.id,
                    name: business.name
                }, 
                receipt: {
                    id: reference,
                    amount: amount,
                    paidOn: createdAt,
                },
                offer: {
                    id: offer.id,
                    trail: trail.name,
                }
            }

            const paymentId = await createPayment(paymentRecord);
            
            if(!paymentId) throw new Error('Payment failed');
            
            const payment = await fetchPayment(paymentId);

            set((state) => {
                return {
                    userPayments: [
                        ...state.userPayments, 
                        payment
                    ],
                    isLoading: false,
                }
            })
            
            return payment;
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