import { useBusinessState } from "@/src/core/models/Business/hooks/useBusinessState";
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useEffect } from "react";

export function useBusinessItem(businessId: string) {
    const business = useBusinessesStore(s => s.data).find(b => b.id === businessId)
    const { isFetching } = useBusinessState();

    useEffect(() => {
        const fetch = async () => {
            await useBusinessesStore.getState().load(businessId);
        }

        fetch();
    }, [businessId])

    return {
        business,
        isFetching,
    }
}