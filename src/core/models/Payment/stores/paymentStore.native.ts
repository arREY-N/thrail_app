import { PaymentState, paymentStoreCreator } from "@/src/core/models/Payment/stores/paymentStoreCreator";
import { createThrottledJSONStorage } from "@/src/core/utility/createThrottledAsyncStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const usePaymentStore = create<PaymentState>()(
    persist(
        immer(paymentStoreCreator),
        {
            name: "payment-storage",
            storage: createThrottledJSONStorage(500),
        }
    )
);

export const usePaymentsStore = usePaymentStore;
