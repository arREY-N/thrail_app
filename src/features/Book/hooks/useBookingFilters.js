import { useMemo, useState } from 'react';

// Todo: move this to core folder
export default function useBookingFilters(userBookings) {
    const [activeTab, setActiveTab] = useState('All');
    
    const tabs = ['All', 'Pending', 'Approved', 'Paid', 'Cancelled'];

    const filteredBookings = useMemo(() => {
        if (!userBookings || userBookings.length === 0) return [];
        
        return userBookings.filter(booking => {
            const status = booking.status;
            const isCancelled = ['for-cancellation', 'refund', 'cancellation-rejected', 'cancelled'].includes(status);
            const isPending = ['for-reservation', 'pending-docs'].includes(status);
            const isApproved = ['for-payment', 'approved-docs'].includes(status);
            const isPaid = ['paid', 'completed'].includes(status);
            
            if (activeTab === 'All') return true;
            if (activeTab === 'Pending') return isPending;
            if (activeTab === 'Approved') return isApproved;
            if (activeTab === 'Paid') return isPaid;
            if (activeTab === 'Cancelled') return isCancelled;
            
            return true;
        });
    }, [userBookings, activeTab]);

    return {
        tabs,
        activeTab,
        setActiveTab,
        filteredBookings
    };
}