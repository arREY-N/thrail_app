import { safeParseDateString } from '@/src/utils/dateFormatter';
import { useMemo, useState } from 'react';

export const FILTER_OPTIONS = ['All', 'Active', 'Expired', 'Rescheduled', 'Cancelled'];

export default function useOfferFilters(offers: any[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

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

        if (activeFilter !== 'All') {
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
        }

        return filtered.sort((a, b) => {
            const dateA = safeParseDateString(a.date || a.hikeDate);
            const dateB = safeParseDateString(b.date || b.hikeDate);

            dateA.setHours(0, 0, 0, 0);
            dateB.setHours(0, 0, 0, 0);

            const statusA = (a.status || '').toLowerCase();
            const statusB = (b.status || '').toLowerCase();

            const isActiveA = dateA >= today && statusA !== 'cancelled' && statusA !== 'rescheduled';
            const isActiveB = dateB >= today && statusB !== 'cancelled' && statusB !== 'rescheduled';

            if (isActiveA && !isActiveB) return -1;
            if (!isActiveA && isActiveB) return 1;

            if (isActiveA && isActiveB) {
                return dateA.getTime() - dateB.getTime();
            }

            return dateB.getTime() - dateA.getTime();
        });
    }, [offers, searchQuery, activeFilter]);

    return {
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        filteredAndSortedOffers,
    };
}