import { useUserStore } from "@/src/core/models/User/User";
import { SuperadminParams } from "./useSuperadmin";

export function useSuperadminWrite(params: SuperadminParams | null) {
    const removeUser = useUserStore(s => s.delete);

    return {
        onDeleteAccountPress: removeUser,
    }
}