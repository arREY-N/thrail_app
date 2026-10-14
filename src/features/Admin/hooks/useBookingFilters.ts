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
                const isNeedsReview = status === 'for-reservation' || status === 'for-cancellation' || status === 'for-reschedule';
                
                if (activeFilter === 'Needs Review') return isNeedsReview;
                if (activeFilter === 'Rejected') return ['reservation-rejected', 'cancelled', 'refund', 'refunded', 'expired', 'cancellation-rejected', 'reschedule-rejected'].includes(status);
                if (activeFilter === 'For Payment') return status === 'for-payment' || status === 'approved-docs';
                if (activeFilter === 'Downpayment') return status === 'downpayment';
                if (activeFilter === 'Fully Paid') return status === 'paid';
                if (activeFilter === 'Completed') return status === 'completed' || status === 'finished' || status === 'rescheduled';
                
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

        // 3-Tier Hierarchy for 'All' tab: Action Required -> In-Progress -> Dead / Closed
        const getPriorityTier = (status?: BookingStatus | string): number => {
            const s = status || '';

            // Tier 1: Action Required by Admin (Top)
            if (s === 'for-reservation' || s === 'for-cancellation' || s === 'for-reschedule' || s === 'paid') {
                return 1;
            }

            // Tier 2: Active & In-Progress / Confirmed (Middle)
            if (s === 'for-payment' || s === 'approved-docs' || s === 'downpayment' || s === 'completed' || s === 'rescheduled') {
                return 2;
            }

            // Tier 3: Dead / Closed / Finished Records (Bottom)
            if (['finished', 'cancelled', 'reservation-rejected', 'refund', 'refunded', 'expired', 'cancellation-rejected', 'reschedule-rejected'].includes(s)) {
                return 3;
            }

            return 4;
        };

        return result.sort((a, b) => {
            const tierA = getPriorityTier(a.status);
            const tierB = getPriorityTier(b.status);
            
            if (tierA !== tierB) {
                return tierA - tierB;
            }

            const timeA = getMs(a.updatedAt || a.createdAt);
            const timeB = getMs(b.updatedAt || b.createdAt);
            
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
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