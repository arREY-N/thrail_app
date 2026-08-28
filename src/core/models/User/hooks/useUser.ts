import { useUserStore } from "@/src/core/models/User/stores/userStore";

export function useUser() {
    const loadUser = useUserStore(s => s.loadUser);
    const loadUserByEmail = useUserStore(s => s.loadUserByEmail);
    const create = useUserStore(s => s.create);
    const deleteUser = useUserStore(s => s.delete);
    const setEmergencyContact = useUserStore(s => s.setEmergencyContact);
    const addUserNotificationToken = useUserStore(s => s.addUserNotificationToken);
    const isLoading = useUserStore(s => s.isLoading);
    const error = useUserStore(s => s.error);

    return {
        loadUser,
        loadUserByEmail,
        create,
        deleteUser,
        setEmergencyContact,
        addUserNotificationToken,
        isLoading,
        error,
    };
}
