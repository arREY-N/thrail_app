/**
 * @file useBookingFilters.ts
 * @description Custom hook to manage booking filters and sorting on the OfferView screen.
 */

import { useMemo, useState } from 'react';

import { IBooking } from '@/src/core/models/Booking/Booking';

export const FILTER_OPTIONS = ['All', 'Needs Review', 'For Payment', 'Downpayment', 'Fully Paid', 'Completed', 'Rejected'];

/**
 * useBookingFilters — Filters and sorts a list of bookings for a offer.
 * 
 * @param bookings - The array of booking objects to filter and sort.
 * @returns An object containing the active filter, sorting order state, setter functions, and filtered/sorted bookings.
 */
export default function useBookingFilters(bookings: IBooking[]) {
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
                if (activeFilter === 'Rejected') return status === 'reservation-rejected' || status === 'cancelled';
                if (activeFilter === 'For Payment') return status === 'for-payment';
                if (activeFilter === 'Downpayment') return status === 'downpayment';
                if (activeFilter === 'Fully Paid') return status === 'paid';
                if (activeFilter === 'Completed') return status === 'completed';
                
                return true;
            });
        }

        const getMs = (val: any) => val?.toDate ? val.toDate().getTime() : new Date(val || 0).getTime();

        // If filtering on a specific status, sort purely by date based on sortOrder
        if (activeFilter !== 'All') {
            return result.sort((a, b) => {
                const timeA = getMs(a.updatedAt || a.createdAt);
                const timeB = getMs(b.updatedAt || b.createdAt);
                return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
            });
        }

        // Default 'All' tab sorting: Priority first, then latest first
        const getPriorityScore = (status: any) => {
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