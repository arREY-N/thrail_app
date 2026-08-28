import { usePaymentStore } from "@/src/core/models/Payment/stores/paymentStore";
import { useEffect } from "react";

export function usePaymentList(userId?: string) {
    const payments = usePaymentStore((s) => s.payments);
    const isLoading = usePaymentStore((s) => s.isLoading);
    const error = usePaymentStore((s) => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (userId) {
                await usePaymentStore.getState().fetchUserPayments(userId);
            } else {
                await usePaymentStore.getState().fetchAll();
            }
        };

        fetch();
    }, [userId]);

    const refresh = async () => {
        if (userId) {
            await usePaymentStore.getState().fetchUserPayments(userId);
        } else {
            await usePaymentStore.getState().refresh();
        }
    };

    return {
        payments,
        isLoading,
        error,
        refresh,
    };
}
