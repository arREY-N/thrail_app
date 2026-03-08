import { Admin } from "@/src/core/models/Admin/Admin";
import { User } from "@/src/core/models/User/User";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { useEffect, useState } from "react";

export type UseAdminWriteParams = {
    userId: string;
}

export interface IUseAdminWrite {
    onFindUserPress: (email: string) => Promise<void>
    onReloadPress: () => Promise<void>
    onMakeAdminPress: (user: User) => Promise<void>

    searched: User[];
    isOwner: boolean;
    isLoading: boolean;
    businessAdmins: Admin[];
}

export default function useAdminWrite(params: UseAdminWriteParams): IUseAdminWrite{
    const { userId } = params;

    const loadUserByEmail = useUsersStore(s => s.loadUserByEmail);
    const reloadBusinessAdmins = useBusinessesStore(s => s.reloadBusinessAdmins);
    const createBusinessAdmin = useBusinessesStore(s => s.createBusinessAdmin);

    const users = useUsersStore(s => s.data);
    const searchedStore  = useUsersStore(s => s.searched);
    const businessAdmins = useBusinessesStore(s => s.businessAdmins);

    const businessAccount = useBusinessesStore(s => s.current);
    const isLoading = useBusinessesStore(s => s.isLoading);

    const [searched, setSearched] = useState<User[]>([]);
    const [isOwner, setIsOwner] = useState<boolean>(false)
    const [localError, setLocalError] = useState<string>('');

    useEffect(() => {
        console.log(userId, businessAccount?.owner.id);
        if(userId && businessAccount?.owner.id === userId){
            setIsOwner(true);
        } else {
            setIsOwner(false);
        }
    }, [userId, businessAccount?.owner.id])
    
    useEffect(() => {
        setSearched(searchedStore);
    }, [searchedStore])

    const onFindUserPress = async (email: string) => {
        const cached = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
        if(cached) {
            setSearched([cached]);
        } else {
            const response = await loadUserByEmail(email);

            setSearched( response.length > 0 ? response : []);
        }
    }

    const onReloadPress = async () => {
        if(businessAccount)
            await reloadBusinessAdmins(businessAccount.id);
    }

    const onMakeAdminPress = async (user: User) => {
        try {
            if(!businessAccount) throw new Error('Business account must be logged in to make new admins');
            
            await createBusinessAdmin({user, businessId: businessAccount.id})
            
            setSearched([]);
        } catch (error) {
            setLocalError((error as Error).message || 'Failed making admin')
        }
    }


    return {
        onFindUserPress,
        onReloadPress,
        onMakeAdminPress,
        searched,
        isOwner,
        isLoading,
        businessAdmins,
    }
}