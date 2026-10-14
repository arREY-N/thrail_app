/**
 * @file useUserList.ts
 * @description Custom hook for managing Superadmin User Accounts data, search query filtering, role tab filtering, metric aggregation, and alphabetical A-Z sorting based on user first and last names.
 */

import { useMemo, useState } from 'react';
import { User } from '@/src/core/models/User/User';

export type RoleFilter = 'All' | 'Hikers' | 'Admins' | 'Superadmins';

export interface UserMetrics {
    total: number;
    hikers: number;
    admins: number;
    superadmins: number;
}

export interface UseUserListReturn {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeTab: RoleFilter;
    setActiveTab: (tab: RoleFilter) => void;
    filteredUsers: User[];
    metrics: UserMetrics;
}

/**
 * Custom hook to filter, aggregate, and sort user accounts alphabetically by first and last name.
 * 
 * @param {User[]} users - Array of raw user domain objects from repository.
 * @returns {UseUserListReturn} Search query state, category filter tab state, metrics, and sorted filtered users.
 */
export function useUserList(users: User[] = []): UseUserListReturn {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeTab, setActiveTab] = useState<RoleFilter>('All');

    // Aggregate platform metrics
    const metrics = useMemo<UserMetrics>(() => {
        const total = users.length;
        const hikers = users.filter((u) => u.role === 'user' || !u.role).length;
        const admins = users.filter((u) => u.role === 'admin').length;
        const superadmins = users.filter((u) => u.role === 'superadmin').length;
        return { total, hikers, admins, superadmins };
    }, [users]);

    // Filter and sort users alphabetically strictly by First Name and Last Name
    const filteredUsers = useMemo<User[]>(() => {
        const query = searchQuery.trim().toLowerCase();

        // 1. Filter by role tab and search query
        const filtered = users.filter((u) => {
            const fullName = `${u.firstname || ''} ${u.lastname || ''}`.trim().toLowerCase();
            const username = (u.username || '').toLowerCase();
            const email = (u.email || '').toLowerCase();

            const matchesSearch =
                query === '' ||
                fullName.includes(query) ||
                username.includes(query) ||
                email.includes(query) ||
                (u.id && u.id.toLowerCase().includes(query));

            const userRole = u.role || 'user';
            let matchesRole = true;
            if (activeTab === 'Hikers') matchesRole = userRole === 'user';
            if (activeTab === 'Admins') matchesRole = userRole === 'admin';
            if (activeTab === 'Superadmins') matchesRole = userRole === 'superadmin';

            return matchesSearch && matchesRole;
        });

        // 2. Sort alphabetically based on first and last name (A-Z)
        return filtered.sort((a, b) => {
            const nameA = `${a.firstname || ''} ${a.lastname || ''}`.trim().toLowerCase() || a.username?.toLowerCase() || a.email?.toLowerCase() || '';
            const nameB = `${b.firstname || ''} ${b.lastname || ''}`.trim().toLowerCase() || b.username?.toLowerCase() || b.email?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        });
    }, [users, searchQuery, activeTab]);

    return {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredUsers,
        metrics,
    };
}

export default useUserList;
