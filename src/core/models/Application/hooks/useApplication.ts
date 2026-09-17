import { useApplicationsStore } from "@/src/core/models/Application/stores/applicationStore";

export function useApplication() {
    const create = useApplicationsStore(s => s.create);
    const edit = useApplicationsStore(s => s.edit);
    const deleteApplication = useApplicationsStore(s => s.delete);
    const approveApplication = useApplicationsStore(s => s.approveApplication);
    const rejectApplication = useApplicationsStore(s => s.rejectApplication);
    const isLoading = useApplicationsStore(s => s.isLoading);
    const error = useApplicationsStore(s => s.error);

    return {
        create,
        edit,
        delete: deleteApplication,
        approveApplication,
        rejectApplication,
        isLoading,
        error,
    };
}
