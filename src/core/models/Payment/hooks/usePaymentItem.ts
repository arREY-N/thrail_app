import { Payment } from "@/src/core/models/Payment/interfaces/Payment.types";
import { usePaymentStore } from "@/src/core/models/Payment/stores/paymentStore";
import { useEffect, useState } from "react";

export function usePaymentItem(id?: string) {
    const payments = usePaymentStore((s) => s.payments);
    const isLoading = usePaymentStore((s) => s.isLoading);
    const error = usePaymentStore((s) => s.error);
    const [payment, setPayment] = useState<Payment | null>(null);

    useEffect(() => {
        if (!id) return;

        const found = payments.find((p) => p.id === id);
        if (found) {
            setPayment(found);
            return;
        }

        const fetch = async () => {
            const item = await usePaymentStore.getState().load(id);
            if (item) setPayment(item);
        };

        fetch();
    }, [id, payments]);

    return {
        payment,
        isLoading,
        error,
    };
}
