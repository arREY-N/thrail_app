import { PaymentState, paymentStoreCreator } from "@/src/core/models/Payment/stores/paymentStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const usePaymentStore = create<PaymentState>()(
    immer(paymentStoreCreator)
);

export const usePaymentsStore = usePaymentStore;
