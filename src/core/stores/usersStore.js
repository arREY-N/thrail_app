import { create } from 'zustand'

export const useUsersStore = create((set, get) => ({
    users: [],
    isLoading: false,
    error: null,

}))