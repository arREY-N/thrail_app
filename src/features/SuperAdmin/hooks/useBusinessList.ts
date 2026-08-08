/**
 * @file useBusinessList.ts
 * @description Custom hook for managing Superadmin Tour Businesses data, search query filtering, active/archived status tab filtering, metric aggregation, and alphabetical sorting by business name.
 */

import { useMemo, useState } from 'react';
import { Business } from '@/src/core/models/Business/Business';

export type BusinessStatusFilter = 'All' | 'Active' | 'Archived';

export interface BusinessMetrics {
    total: number;
    active: number;
    archived: number;
}

export interface UseBusinessListReturn {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeTab: BusinessStatusFilter;
    setActiveTab: (tab: BusinessStatusFilter) => void;
    filteredBusinesses: Business[];
    metrics: BusinessMetrics;
}

/**
 * Custom hook to filter, aggregate metrics, and sort tour business accounts alphabetically by name.
 * 
 * @param {Business[]} businesses - Array of business domain objects from repository.
 * @returns {UseBusinessListReturn} Search query state, category filter tab state, metrics, and sorted filtered businesses.
 */
export function useBusinessList(businesses: Business[] = []): UseBusinessListReturn {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeTab, setActiveTab] = useState<BusinessStatusFilter>('All');

    // Aggregate platform metrics
    const metrics = useMemo<BusinessMetrics>(() => {
        const total = businesses.length;
        const active = businesses.filter((b) => b.active === true).length;
        const archived = businesses.filter((b) => b.active === false).length;
        return { total, active, archived };
    }, [businesses]);

    // Filter and sort businesses alphabetically by business name
    const filteredBusinesses = useMemo<Business[]>(() => {
        const query = searchQuery.trim().toLowerCase();

        // 1. Filter by status tab and search query
        const filtered = businesses.filter((b) => {
            const name = (b.name || '').toLowerCase();
            const address = (b.address || '').toLowerCase();
            const ownerName = (b.owner?.name || '').toLowerCase();
            const ownerEmail = (b.owner?.email || '').toLowerCase();
            const id = (b.id || '').toLowerCase();

            const matchesSearch =
                query === '' ||
                name.includes(query) ||
                address.includes(query) ||
                ownerName.includes(query) ||
                ownerEmail.includes(query) ||
                id.includes(query);

            let matchesTab = true;
            if (activeTab === 'Active') matchesTab = b.active === true;
            if (activeTab === 'Archived') matchesTab = b.active === false;

            return matchesSearch && matchesTab;
        });

        // 2. Sort alphabetically based on business name (A-Z)
        return filtered.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [businesses, searchQuery, activeTab]);

    return {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredBusinesses,
        metrics,
    };
}

export default useBusinessList;
