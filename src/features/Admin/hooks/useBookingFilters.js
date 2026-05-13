import { useMemo, useState } from 'react';

export const FILTER_OPTIONS = ['All', 'Needs Review', 'For Payment', 'Downpayment', 'Fully Paid', 'Completed', 'Rejected'];

export default function useBookingFilters(bookings) {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredBookings = useMemo(() => {
        if (!bookings) return [];

        let result = [...bookings];

        if (activeFilter !== 'All') {
            result = result.filter(b => {
                const status = b.status || '';
                const isPending = status === 'pending-docs' || status === 'for-reservation';
                
                if (activeFilter === 'Needs Review') return isPending;
                if (activeFilter === 'Rejected') return status === 'reservation-rejected' || status === 'cancelled';
                if (activeFilter === 'For Payment') return status === 'for-payment';
                if (activeFilter === 'Downpayment') return status === 'downpayment';
                if (activeFilter === 'Fully Paid') return status === 'paid';
                if (activeFilter === 'Completed') return status === 'completed';
                
                return true;
            });
        }

        const getPriorityScore = (status) => {
            const s = status || '';

            if (s === 'pending-docs' || s === 'for-reservation') return 1;
            if (s === 'paid') return 2;
            if (s === 'downpayment') return 3; 
            
            if (s === 'for-payment') return 4;
            if (s === 'completed') return 5;
            if (s === 'reservation-rejected' || s === 'cancelled') return 6;

            return 7;
        };

        return result.sort((a, b) => {
            const priorityA = getPriorityScore(a.status);
            const priorityB = getPriorityScore(b.status);
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            const getMs = (val) => val?.toDate ? val.toDate().getTime() : new Date(val || 0).getTime();
            const timeA = getMs(a.updatedAt || a.createdAt);
            const timeB = getMs(b.updatedAt || b.createdAt);
            
            return timeB - timeA;
        });

    }, [bookings, activeFilter]);

    return {
        activeFilter,
        setActiveFilter,
        filteredBookings,
    };
}