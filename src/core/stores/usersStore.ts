import { UserRepository } from '@/src/core/repositories/userRepository';
import { UserUI } from '@/src/types/entities/User';
import { Property } from '@/src/types/Property';
import { create } from 'zustand';
import { BaseStore } from '../interface/storeInterface';
import { editProperty } from '../utility/editProperty';

export interface UserState extends BaseStore<UserUI> {
    searched: UserUI[] | [];
}

const init = {
    data: [],
    current: null,
    isLoading: true,
    error: null,
    searched: [],
}

export const useUsersStore = create<UserState>((set, get) => ({
    ...init,

    fetchAll: async () => {
        const data = get().data;
        if(data.length > 0) return;

        set({ isLoading: true, error: null });
        
        try {
            const users = await UserRepository.fetchAll();
            const sorted = users.sort((a: UserUI, b: UserUI) => a.firstname.localeCompare(b.firstname))
            
            set({
                data: sorted,
                isLoading: false,
            })
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed loading users',
                isLoading: false
            })
        }
    },

    refresh: async () => {
        set({ isLoading: true, error: null });
        
        try {
            const users = await UserRepository.fetchAll();
            const sorted = users.sort((a: UserUI, b: UserUI) => a.firstname.localeCompare(b.firstname))
            
            set({
                data: sorted,
                isLoading: false,
            })
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed loading users',
                isLoading: false
            })
        }
    },

    load: async (id: string | null) => {
        if(!id) {
            set({ current: new UserUI() })
            return;
        }

        set({ isLoading: true, error: null })

        try {
            let user: UserUI | undefined | null = null;
            let data = get().data;

            if(data.length > 0){
                user = data.find(u => u.id === id);
            }

            if(!user){
                user = await UserRepository.fetchById(id);
            }

            if(!user){
                throw new Error(`Could not find user with id ${id}`);
            }

            const userInstance = new UserUI(user);

            set(() => {
                const newData = data.find(d => d.id === userInstance.id)
                    ? data
                    : [userInstance, ...data];

                const sorted = newData.sort((a, b) => a.lastname.localeCompare(b.lastname));
                
                return {
                    data: sorted,
                    current: userInstance,
                    isLoading: false
                }
            })
        } catch (err) {
            console.error(err)
            set({
                error: (err as Error).message ?? `Failed loading user with id ${id}`,
                isLoading: false
            })
        }
    },

    create: async () => {
        const current = get().current;

        if(!current){
            set({  error: 'No new data to save' });
            return false;
        }

        set({ isLoading: true, error: null });

        try {
            const validatedUser = new UserUI(current);

            const savedUser = await UserRepository.write(validatedUser);

            set({
                data: get().data.some(d => d.id === savedUser.id)
                    ? [...get().data.filter(d => d.id !== savedUser.id), savedUser]
                    : [...get().data, savedUser],
                isLoading: false,
            })

            return true;
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message,
                isLoading: false
            })
        }

        return true;
    },

    delete: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
            if(!id) throw new Error('Invalid user ID');

            const success = await UserRepository.delete(id);
 
            if(!success){
                set({
                    error: 'Failed deleting user',
                    isLoading: false
                })
                return;
            } 

            set({
                data: get().data.filter(d => d.id !== id),
                isLoading: false,
            })
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed deleting user',
                isLoading: false
            })
        }
    },

    edit: (property: Property) => {
        set((state) => {
            if(!state.current) return state;

            return{
                current: editProperty(state.current, property)
            }
        })
    },
    
    reset: () => set(init),

    loadUserByEmail: async (email: string): Promise<void> => {
        set({ isLoading: true, error: null });
    
        const cachedUsers = get().data.filter(u => u.email === email);

        if(cachedUsers.length > 0){
            set({
                searched: cachedUsers,
                isLoading: false
            })
            return;
        }

        try {
            const users = await UserRepository.fetchByEmail(email);
            
            if(users.length === 0){
                throw new Error(`Failed loading user with email ${email}`)
            }

            set((state) => {
                return {
                    searched: users,
                    isLoading: false
                }
            })
        } catch (err) {
            set({
                error: (err as Error).message ?? 'Failed retrieving user',
                isLoading: false,
            })
        }
    },
}))