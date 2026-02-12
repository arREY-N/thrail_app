import { BaseStore } from "@/src/core/interface/storeInterface";
import { PaymentUI } from "@/src/types/entities/Payment";
import { create } from "zustand";
import { fetchPayment } from "../repositories/paymentRepository";

export interface PaymentState extends BaseStore<PaymentUI>{
    fetchUserPayments(): Promise<void>
}

const init = {
    data: [],
    current: null,
    error: null,
    isLoading: false,
}

export const usePaymentsStore = create<PaymentState>((set, get) => ({
    ...init,

    fetchAll: async () => {
        
    },

    fetchUserPayments: async () => {

    },

    refresh: async () => {

    },

    load: async (
        id: string | null
    ) => {
        if(!id){
            set({ current: new PaymentUI() });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            let receipt = null;

            if(get().data.length === 0){
                console.log('no records');
                receipt = await fetchPayment(id);
            } else {
                console.log('in store')
                receipt = get().data.find(p => p.id ===id);
            }

            if(!receipt) throw new Error('No receipt found');
            
            set({
                current: receipt,
                isLoading: false
            })

        } catch (err) {
            console.log((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false
            })
        }
    },

    create: async () => {
        return true;
    },

    edit: () => {

    },

    delete: async (
        id: string
    ) => {

    },

    reset: () => set(init),

    // createPayment: async (
    //     paymentData: PaymentUI
    // ) => {
    //     console.error('TEST VALIDATION ONLY');
        
    //     set({ isLoading: true, error: null})

    //     const data = new PaymentUI(paymentData);

    //     const { 
    //         profile, 
    //         offer, 
    //         mode 
    //     } = paymentData;
        
    //     const { firstname, lastname, email } = profile;
    //     const { business, trail, price } = offer 

    //     try {
    //         if(!paymentData.mode) throw new Error('No payment mode selected')

    //         const receipt = createReceipt(price);

    //         const withReceipt = {
    //             ...paymentData,
    //             ...receipt,
    //         }

    //         const record = PaymentMapper.toDB(paymentData);

    //         const paymentId = await createPayment(record);
            
    //         if(!paymentId) throw new Error('Payment failed');
            
    //         const payment = await fetchPayment(paymentId);

    //         set((state) => {
    //             return {
    //                 userPayments: [
    //                     ...state.userPayments, 
    //                     payment
    //                 ],
    //                 isLoading: false,
    //             }
    //         })
            
    //         return payment;
    //     } catch (err) {
    //         console.error(err.message);
    //         set({
    //             error: err.message || 'Failed validating payment',
    //             isLoading: false,
    //         })
    //     }
    // },
}))