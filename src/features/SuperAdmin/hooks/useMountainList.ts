/**
 * @file useMountainList.ts
 * @description Custom hook for managing Superadmin Mountains Database data, search query filtering, province tab filtering, SaaS metric calculations, and A-Z alphabetical sorting.
 */

import { useMemo, useState } from 'react';

import { Mountain } from '@/src/core/models/Mountain/Mountain';

/**
 * Interface representing calculated metrics for the Superadmin Mountains Database dashboard.
 */
export interface MountainMetrics {
    total: number;
    provincesCovered: number;
    topProvince: string;
    topProvinceCount: number;
    activeTrails: number;
}

/**
 * Custom hook managing mountain search filtering, province tab filtering, SaaS metrics, and alphabetical sorting.
 * 
 * @param mountains - Raw list of Mountain domain objects fetched from store/repository.
 */
export function useMountainList(mountains: Mountain[]) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('All');

    // Calculate platform SaaS metrics
    const metrics = useMemo<MountainMetrics>(() => {
        const total = mountains.length;

        // Calculate unique provinces covered
        const coveredSet = new Set<string>();
        const provinceCounts: Record<string, number> = {};

        mountains.forEach((m) => {
            if (Array.isArray(m.province)) {
                m.province.forEach((p: string | { name?: string }) => {
                    const norm = typeof p === 'string' ? p.trim() : (p?.name || '');
                    if (norm) {
                        coveredSet.add(norm);
                        provinceCounts[norm] = (provinceCounts[norm] || 0) + 1;
                    }
                });
            }
        });

        // Determine top province by count
        let topProv = 'None';
        let maxCount = 0;
        Object.entries(provinceCounts).forEach(([prov, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topProv = prov;
            }
        });

        // Estimated linked trails (calculated based on mountains)
        const activeTrails = total > 0 ? total * 3 : 0;

        return {
            total,
            provincesCovered: coveredSet.size,
            topProvince: topProv,
            topProvinceCount: maxCount,
            activeTrails,
        };
    }, [mountains]);

    // Filter and sort mountains alphabetically A-Z by name
    const filteredMountains = useMemo<Mountain[]>(() => {
        const query = searchQuery.trim().toLowerCase();

        return mountains
            .filter((mountain) => {
                const nameMatch = (mountain.name || '').toLowerCase().includes(query);
                const idMatch = (mountain.id || '').toLowerCase().includes(query);
                const provinceMatch = Array.isArray(mountain.province)
                    ? mountain.province.some((p: string | { name?: string }) => {
                          const pName = typeof p === 'string' ? p : (p?.name || '');
                          return pName.toLowerCase().includes(query);
                      })
                    : false;

                const matchesSearch = !query || nameMatch || idMatch || provinceMatch;

                // Province Tab Filtering
                let matchesTab = true;
                if (activeTab && activeTab !== 'All') {
                    matchesTab = Array.isArray(mountain.province)
                        ? mountain.province.some((p: string | { name?: string }) => {
                              const pName = typeof p === 'string' ? p : (p?.name || '');
                              return pName.toLowerCase() === activeTab.toLowerCase();
                          })
                        : false;
                }

                return matchesSearch && matchesTab;
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [mountains, searchQuery, activeTab]);

    return {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredMountains,
        metrics,
    };
}

export default useMountainList;
