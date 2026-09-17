import { useMountainStore } from "@/src/core/models/Mountain/stores/mountainStore";

export function useMountain() {
    const create = useMountainStore(s => s.create);
    const edit = useMountainStore(s => s.edit);
    const deleteMountain = useMountainStore(s => s.delete);
    const isLoading = useMountainStore(s => s.isLoading);
    const error = useMountainStore(s => s.error);

    return {
        create,
        edit,
        delete: deleteMountain,
        isLoading,
        error,
    };
}
