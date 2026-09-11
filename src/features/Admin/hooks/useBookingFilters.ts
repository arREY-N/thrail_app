/**
 * @file useBookingFilters.ts
 * @description Custom hook to manage booking filters and sorting on the OfferView screen.
 */

import { useMemo, useState } from 'react';

import { Booking, BookingStatus } from '@/src/core/models/Booking/Booking';

export const FILTER_OPTIONS = ['All', 'Needs Review', 'For Payment', 'Downpayment', 'Fully Paid', 'Completed', 'Rejected'];

/**
 * useBookingFilters — Filters and sorts a list of bookings for a offer.
 * 
 * @param bookings - The array of booking objects to filter and sort.
 * @returns An object containing the active filter, sorting order state, setter functions, and filtered/sorted bookings.
 */
export default function useBookingFilters(bookings: Booking[]) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const filteredBookings = useMemo(() => {
        if (!bookings) return [];

        let result = [...bookings];

        if (activeFilter !== 'All') {
            result = result.filter(b => {
                const status = b.status || '';
                const isPending = status === 'pending-docs' || status === 'for-reservation';
                
                if (activeFilter === 'Needs Review') return isPending;
                if (activeFilter === 'Rejected') return ['reservation-rejected', 'cancelled', 'refund', 'refunded', 'expired', 'cancellation-rejected', 'reschedule-rejected'].includes(status);
                if (activeFilter === 'For Payment') return status === 'for-payment' || status === 'approved-docs';
                if (activeFilter === 'Downpayment') return status === 'downpayment';
                if (activeFilter === 'Fully Paid') return status === 'paid';
                if (activeFilter === 'Completed') return status === 'completed' || status === 'finished';
                
                return true;
            });
        }

        const getMs = (val: unknown): number => {
            if (val instanceof Date) return val.getTime();
            if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
                return (val as { toDate: () => Date }).toDate().getTime();
            }
            if (typeof val === 'string' || typeof val === 'number') {
                return new Date(val).getTime() || 0;
            }
            return 0;
        };

        // If filtering on a specific status, sort purely by date based on sortOrder
        if (activeFilter !== 'All') {
            return result.sort((a, b) => {
                const timeA = getMs(a.updatedAt || a.createdAt);
                const timeB = getMs(b.updatedAt || b.createdAt);
                return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
            });
        }

        // Default 'All' tab sorting: Priority first, then latest first
        const getPriorityScore = (status?: BookingStatus | string) => {
            const s = status || '';

            if (s === 'pending-docs' || s === 'for-reservation') return 1;
            if (s === 'paid') return 2;
            if (s === 'downpayment') return 3; 
            
            if (s === 'for-payment' || s === 'approved-docs') return 4;
            if (s === 'completed' || s === 'finished') return 5;
            if (['reservation-rejected', 'cancelled', 'refund', 'refunded', 'expired', 'cancellation-rejected', 'reschedule-rejected'].includes(s)) return 6;

            return 7;
        };

        return result.sort((a, b) => {
            const priorityA = getPriorityScore(a.status);
            const priorityB = getPriorityScore(b.status);
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            const timeA = getMs(a.updatedAt || a.createdAt);
            const timeB = getMs(b.updatedAt || b.createdAt);
            
            return timeB - timeA;
        });

    }, [bookings, activeFilter, sortOrder]);

    return {
        activeFilter,
        setActiveFilter,
        sortOrder,
        setSortOrder,
        filteredBookings,
    };
}