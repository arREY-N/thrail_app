import { useAdminStore } from "@/src/core/models/Admin/stores/adminStore";

export function useAdmin() {
    const createAdmin = useAdminStore(s => s.createAdmin);
    const removeAdmin = useAdminStore(s => s.removeAdmin);
    const isLoading = useAdminStore(s => s.isLoading);
    const error = useAdminStore(s => s.error);

    return {
        createAdmin,
        removeAdmin,
        isLoading,
        error,
    };
}
