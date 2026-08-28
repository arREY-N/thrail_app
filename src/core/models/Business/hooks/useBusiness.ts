import { useBusinessAdmin } from "@/src/core/models/Business/hooks/useBusinessAdmin";
import { useBusinessState } from "@/src/core/models/Business/hooks/useBusinessState";
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { User, getUsersByEmail, useAuthHook } from "@/src/core/models/User/User";

import { catchError } from "@/src/core/utility/errorFormatter";
import { useMemo, useState } from "react";

export function useBusiness() {
    const { profile } = useAuthHook();
    const { businessAccount, businessAdmins } = useBusinessAdmin();
    const { isLoading, error: storeError } = useBusinessState();

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searched, setSearched] = useState<User[]>([]);

    const isOwner = useMemo(() => {
        return profile?.id && businessAccount?.owner.id === profile.id ? true : false;
    }, [profile, businessAccount])

    const create = useBusinessesStore(s => s.create);
    const edit = useBusinessesStore(s => s.edit);
    const deleteBusiness = useBusinessesStore(s => s.delete);

    const createBusinessAdmin = useBusinessesStore(s => s.createBusinessAdmin);

    const onMakeAdminPress = async (user: User) => {
        try {
            setError('');
            setSuccess('')
            if (!businessAccount) throw new Error('Business account must be logged in to make new admins');
            await createBusinessAdmin({ user, businessId: businessAccount.id })
            setSuccess('New admin created successfully');
        } catch (error) {
            setError((error as Error).message);
            catchError(error as Error, 'error', 'useBusiness()')
        }
    }

    const onFindUserPress = async (email: string) => {
        try {
            setError('');
            setSuccess('');

            const user = await getUsersByEmail(email);
            setSearched(user);
        } catch (error) {
            setError((error as Error).message);
            catchError(error as Error, 'error', 'useBusiness()')
        }
    }


    return {
        isLoading,
        error: error || storeError,
        success,
        isOwner,
        searched,
        businessAdmins,
        onMakeAdminPress,
        onFindUserPress,
        create,
        edit,
        delete: deleteBusiness,
    };
}
