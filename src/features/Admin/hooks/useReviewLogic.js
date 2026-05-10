import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';
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
    const isReviewComplete = isApprovedStatus || isRejectedStatus;

    useEffect(() => {
        if (booking?.user?.birthday) {
            const bday = new Date(booking.user.birthday);
            if (Number.isNaN(bday.getTime())) {
                setIsMinor(false);
                return;
            }

            const today = new Date();
            let age = today.getFullYear() - bday.getFullYear();
            const m = today.getMonth() - bday.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
                age--;
            }
            setIsMinor(age < 18);
        } else {
            setIsMinor(false);
        }
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

    const getStatusText = () => {
        if (isRejectedStatus) return "REJECTED";
        if (currentStatus === 'for-payment') return "FOR PAYMENT";
        if (currentStatus === 'downpayment') return "DOWNPAYMENT (50%)";
        if (currentStatus === 'paid') return "FULLY PAID";
        if (currentStatus === 'completed') return "COMPLETED";
        return "NEEDS REVIEW";
    };

    const getStatusColors = () => {
        if (isRejectedStatus) return { bg: Colors.ERROR_BG, text: Colors.ERROR };
        if (currentStatus === 'for-payment') return { bg: Colors.STATUS_WAITING_USER_BG, text: Colors.STATUS_WAITING_USER_TEXT };
        if (currentStatus === 'downpayment') return { bg: Colors.STATUS_DOWNPAYMENT_BG, text: Colors.STATUS_DOWNPAYMENT_TEXT };
        if (currentStatus === 'paid') return { bg: Colors.STATUS_FULLY_PAID_BG, text: Colors.STATUS_FULLY_PAID_TEXT };
        if (currentStatus === 'completed') return { bg: Colors.STATUS_APPROVED_BG, text: Colors.SUCCESS };
        return { bg: Colors.STATUS_NEEDS_REVIEW_BG, text: Colors.STATUS_NEEDS_REVIEW_TEXT };
    };

    const hasRejections = docStates.some(d => d.valid === 'rejected');
    const isDecisionIncomplete = docStates.length > 0 && docStates.some(d => d.valid === 'pending');
    
    const availableOffers = useMemo(() => {
        return offers 
            ? offers.filter(o => o.id !== booking?.offer?.id).map(o => ({ 
                id: o.id, 
                label: formatDate(o.date), 
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
        currentStatus, isApprovedStatus, isRejectedStatus, isReviewComplete,
        getStatusText, getStatusColors,
        hasRejections, isDecisionIncomplete,
        availableOffers
    };
}