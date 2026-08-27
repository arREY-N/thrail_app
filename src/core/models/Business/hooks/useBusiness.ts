import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";

export function useBusiness() {
    const create = useBusinessesStore(s => s.create);
    const edit = useBusinessesStore(s => s.edit);
    const deleteBusiness = useBusinessesStore(s => s.delete);
    const isLoading = useBusinessesStore(s => s.isLoading);
    const error = useBusinessesStore(s => s.error);

    return {
        create,
        edit,
        delete: deleteBusiness,
        isLoading,
        error,
    };
}
