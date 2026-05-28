import { useMemo, useState } from 'react';

export default function useBookingFilters(userBookings = []) {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [sortBy, setSortBy] = useState('hike-date'); 
    const [filterBy, setFilterBy] = useState('all'); 

    const tabs = [
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
            const hikeDate = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal || 0);
            
            const isPast = hikeDate.getTime() < today.getTime();
            const isDead = ['cancelled', 'refund', 'refunded', 'cancellation-rejected', 'reschedule-rejected'].includes(status);
            
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
                const dateA = new Date(a.offer?.date || 0).getTime();
                const dateB = new Date(b.offer?.date || 0).getTime();
                return activeTab === 'history' ? dateB - dateA : dateA - dateB; 
            } else if (sortBy === 'booked-date') {
                const getMs = (val) => val?.toDate ? val.toDate().getTime() : new Date(val || 0).getTime();
                return getMs(b.createdAt) - getMs(a.createdAt); 
            } else if (sortBy === 'last-updated') {
                const getMs = (val) => val?.toDate ? val.toDate().getTime() : new Date(val || 0).getTime();
                const timeA = getMs(a.updatedAt || a.createdAt);
                const timeB = getMs(b.updatedAt || b.createdAt);
                return timeB - timeA; 
            }
            return 0;
        });

        return filtered;
    }, [userBookings, activeTab, sortBy, filterBy]);

    const handleTabChange = (tabId) => {
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