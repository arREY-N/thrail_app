import { useUsersStore } from "../stores/usersStore";
import { SuperadminParams } from "./useSuperadmin";

export default function useSuperadminWrite(params: SuperadminParams | null){
    const removeUser = useUsersStore(s => s.delete);

    return{
        onDeleteAccountPress: removeUser,
    }
}