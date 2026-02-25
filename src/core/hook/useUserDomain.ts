import { router } from "expo-router";
import { useEffect } from "react";
import { useUsersStore } from "../stores/usersStore";

export type UserParams = {
    userId: string;
}

export default function useUserDomain(params: UserParams | null){
    const loadUsers = useUsersStore(s => s.fetchAll);
    const users = useUsersStore(s => s.data);
    const isLoading = useUsersStore(s => s.isLoading);
    const error = useUsersStore(s => s.error);

    useEffect(() => {
        loadUsers();
    },[]);

    const onViewAccountPress = (userId: string) => {
        console.log('View account: ', userId);
        router.push({
            pathname: '/(main)/user/view',
            params: { userId }
        })
    }

    const onAdminPress = () => {
        router.push('/(main)/admin')
    }
    
    const onSuperadminPress = () => {
        router.push('/(main)/superadmin');
    }

    return {
        users,
        isLoading,
        error,
        onViewAccountPress,
        onAdminPress,
        onSuperadminPress,
    }
}