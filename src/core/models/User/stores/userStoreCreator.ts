import { BaseStore } from "@/src/core/interface/storeInterface";
import { IEmergencyContact, NotificationToken, User } from "@/src/core/models/User/interfaces/User.types";
import { UserRepo } from "@/src/core/models/User/repositories/UserRepository";
import { newUser } from "@/src/core/models/User/utils/UserFactory";
import { StateCreator } from "zustand";

export interface UserState extends BaseStore<User> {
    searched: User[];
    loadUserByEmail: (email: string) => Promise<User[]>;
    loadUser: (id: string) => Promise<User | null>;
    addUserNotificationToken: (token: NotificationToken<Date>, user: User) => Promise<void>;
    setEmergencyContact: (user: User, contact: IEmergencyContact) => Promise<void>;
}

const init = {
    data: [],
    current: null,
    isLoading: false,
    error: null,
    searched: [],
};

export const userStoreCreator: StateCreator<
    UserState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    reset: () => set(init),

    loadUser: async (id: string): Promise<User | null> => {
        set({ isLoading: true, error: null });
        try {
            const user = await UserRepo.fetchById(id);

            if (!user) {
                throw new Error(`Could not find user with id ${id}`);
            }

            set({
                isLoading: false,
            });

            return newUser(user);
        } catch (error) {
            console.error((error as Error).message);
            set({
                error: (error as Error).message ?? `Failed loading user with id ${id}`,
                isLoading: false,
            });
            return null;
        }
    },

    fetchAll: async () => {
        const data = get().data;
        if (data.length > 0) return;

        set({ isLoading: true, error: null });

        try {
            const users = await UserRepo.fetchAll();
            if (users.length === 0) {
                set({ isLoading: false, error: 'No users found' });
                return;
            }

            const sorted = users.sort((a: User, b: User) => a.firstname?.localeCompare(b.firstname));

            set({
                data: sorted,
                isLoading: false,
            });
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed loading users',
                isLoading: false,
            });
        }
    },

    refresh: async () => {
        set({ isLoading: true, error: null });

        try {
            const users = await UserRepo.fetchAll();
            const sorted = users.sort((a: User, b: User) => a.firstname.localeCompare(b.firstname));

            set({
                data: sorted,
                isLoading: false,
            });
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed loading users',
                isLoading: false,
            });
        }
    },

    load: async (id: string | null) => {
        if (!id) {
            set({ current: newUser() });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            let user: User | undefined | null = null;
            const data = get().data;

            if (data.length > 0) {
                user = data.find(u => u.id === id);
            }

            if (!user) {
                user = await UserRepo.fetchById(id);
            }

            if (!user) {
                throw new Error(`Could not find user with id ${id}`);
            }

            const userInstance = newUser(user);

            set(state => {
                const existingIndex = state.data.findIndex(d => d.id === userInstance.id);
                if (existingIndex >= 0) {
                    state.data[existingIndex] = userInstance;
                } else {
                    state.data.unshift(userInstance);
                }
                state.data.sort((a, b) => a.lastname.localeCompare(b.lastname));
                state.current = userInstance;
                state.isLoading = false;
            });
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? `Failed loading user with id ${id}`,
                isLoading: false,
            });
        }
    },

    create: async (user?: User) => {
        const current = user || get().current;

        if (!current) {
            set({ error: 'No new data to save' });
            return false;
        }

        set({ isLoading: true, error: null });

        try {
            const validatedUser = newUser(current);
            const savedUser = await UserRepo.write(validatedUser);

            set(state => {
                const existingIndex = state.data.findIndex(d => d.id === savedUser.id);
                if (existingIndex >= 0) {
                    state.data[existingIndex] = savedUser;
                } else {
                    state.data.push(savedUser);
                }
                state.isLoading = false;
            });

            return true;
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
            return false;
        }
    },

    setEmergencyContact: async (user: User, contact: IEmergencyContact) => {
        set({ isLoading: true, error: null });

        try {
            const validatedUser = newUser({
                ...user,
                emergencyContact: contact,
            });

            await UserRepo.write(validatedUser);

            set({ isLoading: false });
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },

    delete: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
            if (!id) throw new Error('Invalid user ID');

            await UserRepo.delete(id);

            set(state => {
                state.data = state.data.filter(d => d.id !== id);
                state.isLoading = false;
            });
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed deleting user',
                isLoading: false,
            });
        }
    },

    loadUserByEmail: async (email: string): Promise<User[]> => {
        set({ isLoading: true, error: null });

        try {
            const users = await UserRepo.fetchByEmail(email);

            if (users.length === 0) {
                throw new Error(`No user with email ${email}`);
            }

            set(state => {
                const searchedIds = new Set(users.map(u => u.id));
                const filtered = state.data.filter(u => !searchedIds.has(u.id));
                state.data = [...filtered, ...users];
                state.searched = users;
                state.isLoading = false;
            });

            return users;
        } catch (err) {
            set({
                error: (err as Error).message ?? 'Failed retrieving user',
                isLoading: false,
            });
            return [];
        }
    },

    addUserNotificationToken: async (token: NotificationToken<Date>, user: User) => {
        try {
            const tokenExisting = user.fcmTokens?.find(t => t.token === token.token);

            if (!tokenExisting) {
                const updatedUser = newUser({
                    ...user,
                    fcmTokens: [...(user.fcmTokens || []), token],
                });

                await UserRepo.write(updatedUser);
            }
        } catch (err) {
            console.error("Failed to add notification token:", err);
        }
    },
});
