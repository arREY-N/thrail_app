/**
 * @file useApplicationList.ts
 * @description Custom hook for managing Superadmin business applications data, live search filtering, status tab filtering, and SaaS metrics calculations.
 */

import { useMemo, useState } from 'react';

import { IApplication } from '@/src/core/models/Application/Application.types';

/**
 * Calculated SaaS metrics for the Superadmin business applications dashboard.
 */
export interface ApplicationMetrics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

/**
 * Custom hook managing business application search filtering, status tab filtering, and SaaS metrics.
 * 
 * @param applications - Raw list of IApplication domain objects fetched from store/repository.
 */
export function useApplicationList(applications: IApplication[] = []) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('All');

    // Calculate platform SaaS metrics
    const metrics = useMemo<ApplicationMetrics>(() => {
        const total = applications.length;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        applications.forEach((app) => {
            const status = (app.status || '').toLowerCase();
            if (status === 'pending') pending++;
            else if (status === 'approved') approved++;
            else if (status === 'rejected') rejected++;
        });

        return {
            total,
            pending,
            approved,
            rejected,
        };
    }, [applications]);

    // Filter applications by search query and active tab
    const filteredApplications = useMemo<IApplication[]>(() => {
        const query = searchQuery.trim().toLowerCase();

        return applications.filter((app) => {
            const matchesTab =
                activeTab === 'All' ||
                (app.status || '').toLowerCase() === activeTab.toLowerCase();

            const nameMatch = (app.name || '').toLowerCase().includes(query);
            const ownerMatch = (app.owner?.name || '').toLowerCase().includes(query);
            const idMatch = (app.id || '').toLowerCase().includes(query);

            const matchesSearch = !query || nameMatch || ownerMatch || idMatch;

            return matchesTab && matchesSearch;
        });
    }, [applications, searchQuery, activeTab]);

    return {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredApplications,
        metrics,
    };
}

export default useApplicationList;
