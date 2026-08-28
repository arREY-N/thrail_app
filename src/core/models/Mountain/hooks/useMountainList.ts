import { useMountainStore } from "@/src/core/models/Mountain/stores/mountainStore";
import { router } from "expo-router";
import { useEffect } from "react";

export function useMountainList() {
    const mountains = useMountainStore(s => s.data);
    const isLoading = useMountainStore(s => s.isLoading);
    const error = useMountainStore(s => s.error);

    useEffect(() => {
        const fetchAll = async () => {
            await useMountainStore.getState().fetchAll();
        };

        fetchAll();
    }, []);

    const onWritePress = (mountainId?: string | null) => {
        if (mountainId) {
            router.push({
                pathname: '/(main)/superadmin/mountain/write',
                params: { mountainId }
            })
        } else {
            router.push({
                pathname: '/(main)/superadmin/mountain/write',
            })
        }
    }

    return {
        mountains,
        isLoading,
        error,
        onWritePress,
        refresh: () => useMountainStore.getState().refresh(),
    };
}
