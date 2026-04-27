import { IBaseDomainHook } from "@/src/core/interface/domainHookInterface";
import { User } from "@/src/core/models/User/User";
import { Role } from "@/src/core/models/User/User.types";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { useEffect } from "react";

export interface IUserDomain extends IBaseDomainHook{
    /** Access all users available, for galleries */
    users: User[];
    /** Access single user */
    user: User | null;
}

export type UserDomainParams = {
    /** Role of the logged in user, default is user*/
    role?: Role | null;
    
    /** ID of specific user to view */
    id?: string;
}

/** 
 * @param {UserDomainParams} params - Provide active user's role, and 
 * the id of user to be viewed
 * @returns {IUserDomain} Access to user objects 
*/
export default function useUser(params: UserDomainParams = { role: 'user' }): IUserDomain{
    const { role, id } = params;

    const loadAllUsers = useUsersStore(s => s.fetchAll);
    const loadUser = useUsersStore(s => s.load);
    const users = useUsersStore(s => s.data);
    const user = useUsersStore(s => s.current);
    const isLoading = useUsersStore(s => s.isLoading);
    const error = useUsersStore(s => s.error);

    useEffect(() => {
        if(role === 'superadmin'){
            loadAllUsers();
        }
    }, [role]);

    useEffect(() => {
        loadUser(id);
    }, [id, loadUser]);

    return {
        users,
        user,
        isLoading,
        error
    }
}