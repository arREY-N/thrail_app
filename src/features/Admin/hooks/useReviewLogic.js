import { getStatusConfig } from '@/src/constants/statusConfig';
import { checkIfMinor, formatDateToStandard } from '@/src/utils/dateFormatter';
import { useEffect, useMemo, useState } from 'react';

export default function useReviewLogic(booking, offers) {
    const [activeTab, setActiveTab] = useState('documents'); 
    const [docStates, setDocStates] = useState([]);
    const [viewedDocs, setViewedDocs] = useState({});
    const [rejectionReason, setRejectionReason] = useState('');
    
    const [personalVerified, setPersonalVerified] = useState(false);
    const [emergencyVerified, setEmergencyVerified] = useState(false);
    const [isMinor, setIsMinor] = useState(false);

    const currentStatus = booking?.status || 'for-reservation';
    const isApprovedStatus = ['for-payment', 'paid', 'downpayment', 'completed'].includes(currentStatus);
    const isRejectedStatus = currentStatus === 'reservation-rejected';
    const isCancelledStatus = ['cancelled', 'cancellation-rejected', 'refund', 'refunded', 'reschedule-rejected'].includes(currentStatus);
    const isReviewComplete = isApprovedStatus || isRejectedStatus || isCancelledStatus;

    const adminStatusConfig = getStatusConfig(currentStatus, 'admin');

    useEffect(() => {
        setIsMinor(checkIfMinor(booking?.user?.birthday));
    }, [booking?.user?.birthday]);

    useEffect(() => {
        if (!booking?.documents) return;

        const mapDocument = (name, file, valid) => {
            let validState = 'pending';
            if (valid === 'approved' || valid === true) validState = 'approved';
            if (valid === 'rejected' || valid === false) validState = 'rejected';
            if (isApprovedStatus) validState = 'approved';
            if (isRejectedStatus && validState === 'pending') validState = 'rejected';
            return { name: name || 'Unnamed Document', file, valid: validState };
        };

        const docsArray = Array.isArray(booking.documents) 
            ? booking.documents.map((d, i) => mapDocument(d.name || `Req ${i+1}`, d.file, d.valid))
            : Object.entries(booking.documents).map(([k, v]) => mapDocument(v.name || k, v.file || '', v.valid));
        
        setDocStates(docsArray);
        
        const initialViewed = {};
        docsArray.forEach((d, i) => { 
            if (d.valid !== 'pending') initialViewed[i] = true; 
        });
        setViewedDocs(initialViewed);
        
        if (isApprovedStatus) {
            setActiveTab('payment');
        }

    }, [booking, booking?.documents, isApprovedStatus, isRejectedStatus]);

    const hasRejections = docStates.some(d => d.valid === 'rejected');
    const isDecisionIncomplete = docStates.length > 0 && docStates.some(d => d.valid === 'pending');
    
    const availableOffers = useMemo(() => {
        return offers 
            ? offers.filter(o => o.id !== booking?.offer?.id).map(o => ({ 
                id: o.id, 
                label: formatDateToStandard(o.date),
                subLabel: `₱${o.price}`, 
                originalData: o 
            })) 
            : [];
    }, [offers, booking?.offer?.id]);

    return {
        activeTab, setActiveTab,
        docStates, setDocStates,
        viewedDocs, setViewedDocs,
        rejectionReason, setRejectionReason,
        personalVerified, setPersonalVerified,
        emergencyVerified, setEmergencyVerified,
        isMinor,
        currentStatus, isApprovedStatus, isRejectedStatus, isCancelledStatus, isReviewComplete,
        adminStatusConfig,
        hasRejections, isDecisionIncomplete,
        availableOffers
    };
}