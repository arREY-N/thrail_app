import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { useMemo, useState } from 'react';

export type TabId = 'upcoming' | 'pending' | 'history';
export type SortBy = 'hike-date' | 'booked-date' | 'last-updated';
export type FilterBy = 'all' | 'action-needed' | 'waiting' | 'partial';

/**
 * Custom hook to manage booking filters, sorting, and tab selection.
 * 
 * @param {Booking[]} userBookings - Array of bookings to filter and sort
 * @param {Cancellation[]} [userCancellations] - Array of user cancellation requests
 * @returns Object containing state and setter functions for filters
 */
export default function useBookingFilters(
    userBookings: Booking[] = [],
    userCancellations: Cancellation[] = []
) {
    const [activeTab, setActiveTab] = useState<TabId>('upcoming');
    const [sortBy, setSortBy] = useState<SortBy>('hike-date'); 
    const [filterBy, setFilterBy] = useState<FilterBy>('all'); 

    const tabs: { id: TabId; label: string }[] = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'pending', label: 'Pending' },
        { id: 'history', label: 'History' },
    ];

    const filteredBookings = useMemo(() => {
        if (!userBookings || userBookings.length === 0) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getEffectiveStatus = (booking: Booking): string => {
            const activeCancellation = userCancellations?.find(
                c => c.bookingId === booking.id && (c.status === 'pending' || c.status === 'rejected')
            );
            if (activeCancellation?.status === 'pending') {
                return 'for-cancellation';
            }
            if (
                activeCancellation?.status === 'rejected' &&
                booking.status !== 'cancelled' &&
                booking.status !== 'refund' &&
                booking.status !== 'refunded'
            ) {
                return 'cancellation-rejected';
            }
            return booking.status;
        };

        let filtered = userBookings.filter(booking => {
            const status = getEffectiveStatus(booking);
            
            const dateVal = booking.offer?.date;
            const hikeDate = dateVal instanceof Date 
                ? dateVal 
                : (dateVal && typeof dateVal === 'object' && 'toDate' in dateVal ? (dateVal as import('firebase/firestore').Timestamp).toDate() : new Date((dateVal as Date | string | number) || 0));
            
            const isPast = hikeDate.getTime() < today.getTime();
            const isDead = [
                'cancelled',
                'refund',
                'refunded',
                'finished',
                'expired'
            ].includes(status);
            
            if (isDead || isPast) {
                return activeTab === 'history';
            }
            
            if (activeTab === 'pending') {
                return [
                    'for-reservation',
                    'reservation-rejected',
                    'approved-docs',
                    'for-payment',
                    'for-reschedule',
                    'for-cancellation',
                    'cancellation-rejected',
                    'reschedule-rejected',
                ].includes(status);
            }
            
            if (activeTab === 'upcoming') {
                return ['paid', 'downpayment', 'rescheduled', 'completed'].includes(status);
            }
            
            return false;
        });

        if (filterBy === 'action-needed') {
            filtered = filtered.filter(b => [
                'for-payment',
                'approved-docs',
                'reservation-rejected',
                'cancellation-rejected',
                'reschedule-rejected',
            ].includes(getEffectiveStatus(b)));
        } else if (filterBy === 'waiting') {
            filtered = filtered.filter(b => [
                'for-reservation',
                'for-reschedule',
                'for-cancellation',
                'paid',
            ].includes(getEffectiveStatus(b)));
        } else if (filterBy === 'partial') {
            filtered = filtered.filter(b => getEffectiveStatus(b) === 'downpayment');
        }

        const getMs = (val: unknown): number => {
            if (val instanceof Date) return val.getTime();
            if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
                return (val as { toDate: () => Date }).toDate().getTime();
            }
            if (typeof val === 'string' || typeof val === 'number') {
                return new Date(val).getTime();
            }
            return 0;
        };

        filtered.sort((a, b) => {
            if (sortBy === 'hike-date') {
                const dateA = getMs(a.offer?.date);
                const dateB = getMs(b.offer?.date);
                return activeTab === 'history' ? dateB - dateA : dateA - dateB; 
            } else if (sortBy === 'booked-date') {
                return getMs(b.createdAt) - getMs(a.createdAt); 
            } else if (sortBy === 'last-updated') {
                const timeA = getMs(a.updatedAt || a.createdAt);
                const timeB = getMs(b.updatedAt || b.createdAt);
                return timeB - timeA; 
            }
            return 0;
        });

        return filtered;
    }, [userBookings, userCancellations, activeTab, sortBy, filterBy]);

    const handleTabChange = (tabId: TabId) => {
        setActiveTab(tabId);
    };

    return {
        tabs,
        activeTab,
        setActiveTab: handleTabChange,
        filteredBookings,
        sortBy,
        setSortBy,
        filterBy,
        setFilterBy
    };
}
