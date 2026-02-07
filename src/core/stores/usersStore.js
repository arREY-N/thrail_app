import { deleteUser, fetchUserByEmail, fetchUsers } from '@/src/core/repositories/userRepository';
import { create } from 'zustand';

const init = {
    users: [],
    isLoading: true,
    error: null,
}

export const useUsersStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    loadAllUsers: async () => {
        if(get().users.length > 0) return;

        set({isLoading: true, error: null});
        
        try {
            const users = await fetchUsers();

            set({
                users,
                isLoading: false,
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed loading users',
                isLoading: false
            })
        }
    },

    loadUserByEmail: async (email) => {
        set({isLoading: true, error: null});
    
        const cachedUser = get().users.find(u => u.email === email);

        if(cachedUser){
            set({
                isLoading: false
            })
            return cachedUser;
        }

        try {
            const user = await fetchUserByEmail(email);
            if(!user){
                set({
                    isLoading: false,
                    error: 'User not found'
                });
                return null;
            }

            set((state) => {
                const alreadyExists = state.users.some(u => u.id === user.id);
                const newUsersList = alreadyExists ? state.users : [...state.users, user];

                return {
                    users: newUsersList,
                    isLoading: false
                }
            })

            return user;
        } catch (err) {
            set({
                error: err.message ?? 'Failed retrieving user',
                isLoading: false,
            })
            return null;
        }
    },

    deleteAccount: async (id) => {
        set({isLoading: true, error: null});

        try {
            if(!id) throw new Error('Invalid user ID');

            const success = await deleteUser(id);
 
            if(!success){
                set({
                    error: 'Failed deleting user',
                    isLoading: false
                })
                return;
            } 

            set((state) => {
                const newUserList = state.users.filter(u => u.id !== id);

                return{
                    isLoading: false,
                    users: newUserList
                }
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed deleting user',
                isLoading: false
            })
        }
    }

}))