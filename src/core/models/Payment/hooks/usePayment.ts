import { Payment } from "@/src/core/models/Payment/interfaces/Payment.types";
import { usePaymentStore } from "@/src/core/models/Payment/stores/paymentStore";

export function usePayment() {
    const create = usePaymentStore((s) => s.create);
    const remove = usePaymentStore((s) => s.remove);
    const isLoading = usePaymentStore((s) => s.isLoading);
    const error = usePaymentStore((s) => s.error);

    const createPayment = async (payment: Payment) => {
        return await create(payment);
    };

    const removePayment = async (id: string) => {
        await remove(id);
    };

    return {
        createPayment,
        removePayment,
        create,
        remove,
        isLoading,
        error,
    };
}
