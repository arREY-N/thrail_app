import { getStatusConfig } from '@/src/constants/statusConfig';
import { checkIfMinor, formatDateToStandard } from '@/src/utils/dateFormatter';
import { useEffect, useMemo, useState } from 'react';

export default function useReviewLogic(booking: any, offers: any[]) {
    const [activeTab, setActiveTab] = useState('documents'); 
    const [docStates, setDocStates] = useState<any[]>([]);
    const [viewedDocs, setViewedDocs] = useState<any>({});
    const [rejectionReason, setRejectionReason] = useState('');
    
    const [personalVerified, setPersonalVerified] = useState(false);
    const [emergencyVerified, setEmergencyVerified] = useState(false);
    const [isMinor, setIsMinor] = useState(false);

    const hasRefundedPayment = booking?.payment?.some((p: any) => p.status === 'refunded');
    const currentStatus = hasRefundedPayment ? 'refunded' : (booking?.status || 'for-reservation');
    const displayCancellationReason = hasRefundedPayment 
        ? 'Refund processed securely via PayMongo.' 
        : booking?.cancellationReason;

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

        const mapDocument = (name: any, file: any, valid: any) => {
            let validState = 'pending';
            if (valid === 'approved' || valid === true) validState = 'approved';
            if (valid === 'rejected' || valid === false) validState = 'rejected';
            if (isApprovedStatus) validState = 'approved';
            if (isRejectedStatus && validState === 'pending') validState = 'rejected';
            return { name: name || 'Unnamed Document', file, valid: validState };
        };

        const docsArray = Array.isArray(booking.documents) 
            ? booking.documents.map((d: any, i: any) => mapDocument(d.name || `Req ${i+1}`, d.file, d.valid))
            : Object.entries(booking.documents).map(([k, v]: [string, any]) => mapDocument(v.name || k, v.file || '', v.valid));
        
        setDocStates(docsArray);
        
        const initialViewed: any = {};
        docsArray.forEach((d: any, i: any) => { 
            if (d.valid !== 'pending') initialViewed[i] = true; 
        });
        setViewedDocs(initialViewed);
        
        if (isApprovedStatus) {
            setActiveTab('payment');
        }

    }, [booking, booking?.documents, isApprovedStatus, isRejectedStatus]);

    const hasRejections = docStates.some((d: any) => d.valid === 'rejected');
    const isDecisionIncomplete = docStates.length > 0 && docStates.some((d: any) => d.valid === 'pending');
    
    const availableOffers = useMemo(() => {
        return offers 
            ? offers.filter((o: any) => o.id !== booking?.offer?.id).map((o: any) => ({ 
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
        currentStatus, 
        isApprovedStatus, 
        isRejectedStatus, 
        isCancelledStatus, 
        isReviewComplete,
        adminStatusConfig,
        hasRejections, 
        isDecisionIncomplete,
        availableOffers,
        displayCancellationReason
    };
}