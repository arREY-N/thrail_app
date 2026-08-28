import { Trail } from "@/src/core/models/Trail/interfaces/Trail.types";
import { useTrailStore } from "@/src/core/models/Trail/stores/trailStore";

export function useTrail() {
    const isLoading = useTrailStore(s => s.isLoading);
    const error = useTrailStore(s => s.error);

    const createTrail = async (trail: Trail) => {
        return await useTrailStore.getState().create(trail);
    };

    const deleteTrail = async (id: string) => {
        await useTrailStore.getState().delete(id);
    };

    const reset = () => {
        useTrailStore.getState().reset();
    };

    return {
        isLoading,
        error,
        createTrail,
        deleteTrail,
        reset,
    };
}
