import { PaymentState, paymentStoreCreator } from "@/src/core/models/Payment/stores/paymentStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const usePaymentStore = create<PaymentState>()(
    persist(
        immer(paymentStoreCreator),
        {
            name: "payment-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const usePaymentsStore = usePaymentStore;
