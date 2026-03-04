import { useUsersStore } from "@/src/core/stores/usersStore";

/** Provides access to managing user entities */
export default function useUserWrite(){
    const remove = useUsersStore(s => s.delete);

    return{
        onDeleteAccountPress: remove
    }
}