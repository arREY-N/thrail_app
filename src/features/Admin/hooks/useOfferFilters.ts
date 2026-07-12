/**
 * @file useOfferFilters.ts
 * @description Custom hook for searching, filtering, and sorting offers in the Admin Offer List screen.
 */

import { safeParseDateString } from '@/src/utils/dateFormatter';
import { useMemo, useState } from 'react';

export const FILTER_OPTIONS = ['Active', 'Expired', 'Rescheduled', 'Cancelled'];

/**
 * useOfferFilters — Manages search querying, active filter tabs, and multi-select trail filters.
 * 
 * @param offers - The array of raw offers to search and filter against.
 * @returns State and setter functions for filters and the filtered/sorted offers array.
 */
export default function useOfferFilters(offers: any[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Active');
    const [sortBy, setSortBy] = useState('date-asc');
    const [filterTrailNames, setFilterTrailNames] = useState<string[]>([]);

    const uniqueTrailNames = useMemo(() => {
        if (!offers) return [];
        const names = new Set<string>();
        offers.forEach(offer => {
            if (offer.trail?.name) {
                names.add(offer.trail.name);
            }
        });
        return Array.from(names).sort();
    }, [offers]);

    const filteredAndSortedOffers = useMemo(() => {
        if (!offers) return [];
        
        let filtered = [...offers];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(offer => {
                const trailName = offer.trail?.name || '';
                return trailName.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        if (filterTrailNames.length > 0) {
            filtered = filtered.filter(offer => {
                const trailName = offer.trail?.name || '';
                return filterTrailNames.includes(trailName);
            });
        }

        filtered = filtered.filter(offer => {
            const status = (offer.status || '').toLowerCase();
            const offerDate = safeParseDateString(offer.date || offer.hikeDate);
            offerDate.setHours(0, 0, 0, 0);
            
            const isPast = offerDate < today;
            const isUpcomingOrToday = offerDate >= today;

            if (activeFilter === 'Cancelled') {
                return status === 'cancelled';
            } else if (activeFilter === 'Rescheduled') {
                return status === 'rescheduled';
            } else if (activeFilter === 'Expired') {
                return isPast && status !== 'cancelled' && status !== 'rescheduled';
            } else if (activeFilter === 'Active') {
                return isUpcomingOrToday && status !== 'cancelled' && status !== 'rescheduled';
            }
            
            return true;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'price-asc') {
                return (Number(a.price) || 0) - (Number(b.price) || 0);
            }
            if (sortBy === 'price-desc') {
                return (Number(b.price) || 0) - (Number(a.price) || 0);
            }

            const dateA = safeParseDateString(a.date || a.hikeDate).getTime();
            const dateB = safeParseDateString(b.date || b.hikeDate).getTime();

            if (sortBy === 'date-desc') {
                return dateB - dateA;
            }
            return dateA - dateB;
        });
    }, [offers, searchQuery, activeFilter, sortBy, filterTrailNames]);

    return {
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        sortBy,
        setSortBy,
        filterTrailNames,
        setFilterTrailNames,
        uniqueTrailNames,
        filteredAndSortedOffers,
    };
}