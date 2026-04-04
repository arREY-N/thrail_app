import { useMemo, useState } from 'react';

// Todo: move this to core folder
export default function useBookingFilters(userBookings) {
    const [activeTab, setActiveTab] = useState('Upcoming');
    
    const tabs = ['Upcoming', 'Pending', 'History'];

    const filteredBookings = useMemo(() => {
        if (!userBookings || userBookings.length === 0) return [];
        
        return userBookings
            .filter(booking => {
                const status = booking.status;
                
                const isHistory = [
                    'for-cancellation', 
                    'refund', 
                    'cancellation-rejected', 
                    'cancelled'
                ].includes(status);
                
                const isPending = [
                    'for-reservation', 
                    'pending-docs', 
                    'for-payment', 
                    'approved-docs', 
                    'for-reschedule'
                ].includes(status);
                
                const isUpcoming = [
                    'paid', 
                    'completed'
                ].includes(status);
                
                if (activeTab === 'Upcoming') return isUpcoming;
                if (activeTab === 'Pending') return isPending;
                if (activeTab === 'History') return isHistory;
                
                return false; 
            })

            .sort((a, b) => {
                const dateA = new Date(a.offer?.date || a.createdAt).getTime();
                const dateB = new Date(b.offer?.date || b.createdAt).getTime();

                if (activeTab === 'History') {
                    return dateB - dateA; 
                } else {
                    return dateA - dateB; 
                }
            });
            
    }, [userBookings, activeTab]);

    return {
        tabs,
        activeTab,
        setActiveTab,
        filteredBookings
    };
}