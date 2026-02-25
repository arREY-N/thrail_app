import { useEffect } from "react";
import { useUsersStore } from "../stores/usersStore";
import { UserParams } from "./useUserDomain";

export default function useUserWrite(params: UserParams | null){
    const loadUser = useUsersStore(s => s.load);
    const remove = useUsersStore(s => s.delete);

    const user = useUsersStore(s => s.current);
    const isLoading = useUsersStore(s => s.isLoading);

    useEffect(() => {
        loadUser(params?.userId);
    },[params?.userId])

    return{
        user,
        isLoading,
        onDeleteAccountPress: remove
    }
}