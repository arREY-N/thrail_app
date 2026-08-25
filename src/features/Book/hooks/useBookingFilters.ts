import { IBooking } from '@/src/core/models/Booking/Booking';
import { useMemo, useState } from 'react';

export type TabId = 'upcoming' | 'pending' | 'history';
export type SortBy = 'hike-date' | 'booked-date' | 'last-updated';
export type FilterBy = 'all' | 'action-needed' | 'waiting' | 'partial';

/**
 * Custom hook to manage booking filters, sorting, and tab selection.
 * 
 * @param {IBooking[]} userBookings - Array of bookings to filter and sort
 * @returns Object containing state and setter functions for filters
 */
export default function useBookingFilters(userBookings: IBooking[] = []) {
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

        let filtered = userBookings.filter(booking => {
            const status = booking.status;
            
            const dateVal = booking.offer?.date;
            const hikeDate = dateVal instanceof Date 
                ? dateVal 
                : (dateVal && typeof dateVal === 'object' && 'toDate' in dateVal ? (dateVal as import('firebase/firestore').Timestamp).toDate() : new Date((dateVal as Date | string | number) || 0));
            
            const isPast = hikeDate.getTime() < today.getTime();
            const isDead = ['cancelled', 'refund', 'refunded', 'cancellation-rejected', 'reschedule-rejected', 'finished'].includes(status);
            
            if (isDead || isPast) {
                return activeTab === 'history';
            }
            
            if (activeTab === 'pending') {
                return ['for-reservation', 'pending-docs', 'reservation-rejected', 'approved-docs', 'for-payment', 'for-reschedule'].includes(status);
            }
            
            if (activeTab === 'upcoming') {
                return ['paid', 'downpayment', 'rescheduled', 'completed'].includes(status);
            }
            
            return false;
        });

        if (filterBy === 'action-needed') {
            filtered = filtered.filter(b => ['for-payment', 'approved-docs', 'reservation-rejected'].includes(b.status));
        } else if (filterBy === 'waiting') {
            filtered = filtered.filter(b => ['for-reservation', 'pending-docs', 'for-reschedule', 'paid'].includes(b.status));
        } else if (filterBy === 'partial') {
            filtered = filtered.filter(b => b.status === 'downpayment');
        }

        filtered.sort((a, b) => {
            if (sortBy === 'hike-date') {
                const dateAVal = a.offer?.date;
                const dateBVal = b.offer?.date;
                const dateA = (dateAVal instanceof Date ? dateAVal : (dateAVal && typeof dateAVal === 'object' && 'toDate' in dateAVal ? (dateAVal as any).toDate() : new Date((dateAVal as Date | string | number) || 0))).getTime();
                const dateB = (dateBVal instanceof Date ? dateBVal : (dateBVal && typeof dateBVal === 'object' && 'toDate' in dateBVal ? (dateBVal as any).toDate() : new Date((dateBVal as Date | string | number) || 0))).getTime();
                return activeTab === 'history' ? dateB - dateA : dateA - dateB; 
            } else if (sortBy === 'booked-date') {
                const getMs = (val: any) => val instanceof Date ? val.getTime() : (val?.toDate ? val.toDate().getTime() : new Date(val || 0).getTime());
                return getMs(b.createdAt) - getMs(a.createdAt); 
            } else if (sortBy === 'last-updated') {
                const getMs = (val: any) => val instanceof Date ? val.getTime() : (val?.toDate ? val.toDate().getTime() : new Date(val || 0).getTime());
                const timeA = getMs(a.updatedAt || a.createdAt);
                const timeB = getMs(b.updatedAt || b.createdAt);
                return timeB - timeA; 
            }
            return 0;
        });

        return filtered;
    }, [userBookings, activeTab, sortBy, filterBy]);

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
