import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";

export function useBusiness() {
    const create = useBusinessesStore(s => s.create);
    const edit = useBusinessesStore(s => s.edit);
    const deleteBusiness = useBusinessesStore(s => s.delete);

    return {
        create,
        edit,
        delete: deleteBusiness,
    };
}
