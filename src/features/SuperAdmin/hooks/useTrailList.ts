/**
 * @file useTrailList.ts
 * @description Custom hook for managing Trails & Routes data, search query filtering, province tab filtering, SaaS metric calculations, and A-Z alphabetical sorting.
 */

import { useMemo, useState } from 'react';

import { Trail } from '@/src/core/models/Trail/Trail';

/**
 * Interface representing calculated metrics for the Trails & Routes dashboard.
 */
export interface TrailMetrics {
    total: number;
    activeTrails: number;
    totalMapPins: number;
    provincesCovered: number;
}

/**
 * Custom hook managing trail search filtering, province tab filtering, SaaS metrics, and alphabetical sorting.
 * 
 * @param trails - Raw list of Trail domain objects fetched from store/repository.
 */
export function useTrailList(trails: Trail[]) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('All');

    // Calculate platform SaaS metrics
    const metrics = useMemo<TrailMetrics>(() => {
        const total = trails.length;
        let activeTrails = 0;
        let totalMapPins = 0;
        const coveredSet = new Set<string>();

        trails.forEach((t) => {
            if (t.general?.active !== false) {
                activeTrails += 1;
            }
            if (t.offlinePoints?.length) {
                totalMapPins += t.offlinePoints.length;
            }
            if (Array.isArray(t.general?.province)) {
                t.general.province.forEach((p: string | { name?: string }) => {
                    const norm = typeof p === 'string' ? p.trim() : (p?.name || '');
                    if (norm) {
                        coveredSet.add(norm);
                    }
                });
            }
        });

        return {
            total,
            activeTrails,
            totalMapPins,
            provincesCovered: coveredSet.size,
        };
    }, [trails]);

    // Filter and sort trails alphabetically A-Z by name
    const filteredTrails = useMemo<Trail[]>(() => {
        const query = searchQuery.trim().toLowerCase();

        return trails
            .filter((trail) => {
                const name = trail.general?.name || '';
                const nameMatch = name.toLowerCase().includes(query);
                const idMatch = (trail.id || '').toLowerCase().includes(query);
                const provinceMatch = Array.isArray(trail.general?.province)
                    ? trail.general.province.some((p: string | { name?: string }) => {
                          const pName = typeof p === 'string' ? p : (p?.name || '');
                          return pName.toLowerCase().includes(query);
                      })
                    : false;

                const matchesSearch = !query || nameMatch || idMatch || provinceMatch;

                // Province Tab Filtering
                let matchesTab = true;
                if (activeTab && activeTab !== 'All') {
                    matchesTab = Array.isArray(trail.general?.province)
                        ? trail.general.province.some((p: string | { name?: string }) => {
                              const pName = typeof p === 'string' ? p : (p?.name || '');
                              return pName.toLowerCase() === activeTab.toLowerCase();
                          })
                        : false;
                }

                return matchesSearch && matchesTab;
            })
            .sort((a, b) => (a.general?.name || '').localeCompare(b.general?.name || ''));
    }, [trails, searchQuery, activeTab]);

    return {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredTrails,
        metrics,
    };
}

export default useTrailList;
