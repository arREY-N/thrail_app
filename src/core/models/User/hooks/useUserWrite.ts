import { useUserStore } from "@/src/core/models/User/stores/userStore";

/** Provides access to managing user entities */
export function useUserWrite() {
    const remove = useUserStore(s => s.delete);

    return {
        onDeleteAccountPress: remove
    }
}