import { getStatusConfig } from '@/src/constants/statusConfig';
import {
    calculateVerificationValidity,
    evaluateApprovalGuard,
    PhoneVerificationFlow,
    PhoneVerificationGuardResult
} from '@/src/core/flows/PhoneVerificationFlow';
import { Booking, Requirements } from '@/src/core/models/Booking/Booking';
import { Offer } from '@/src/core/models/Offer/Offer';
import { UserRepo } from '@/src/core/models/User/User';
import { toDateOrNull } from '@/src/core/utility/date';
import { checkIfMinor, formatDateToStandard } from '@/src/utils/dateFormatter';
import { useEffect, useMemo, useState } from 'react';

const mapDocument = (
    name: string, 
    file: string, 
    valid: string | boolean | undefined, 
    isApproved: boolean, 
    isRejected: boolean
): Requirements => {
    let validState: 'pending' | 'approved' | 'rejected' = 'pending';
    if (valid === 'approved' || valid === true) validState = 'approved';
    if (valid === 'rejected' || valid === false) validState = 'rejected';
    if (isApproved) validState = 'approved';
    if (isRejected && validState === 'pending') validState = 'rejected';
    return { name: name || 'Unnamed Document', file: file || '', valid: validState };
};

const extractDocs = (
    b: Booking | null | undefined, 
    isApproved: boolean, 
    isRejected: boolean
): Requirements[] => {
    if (!b?.documents) return [];
    return Array.isArray(b.documents) 
        ? b.documents.map((d, i) => mapDocument(d.name || `Req ${i + 1}`, d.file, d.valid, isApproved, isRejected))
        : Object.entries(b.documents as unknown as Record<string, Requirements>).map(([k, v]) => 
            mapDocument(v?.name || k, v?.file || '', v?.valid, isApproved, isRejected)
        );
};

export default function useReviewLogic(booking: Booking | null | undefined, offers: Offer[]) {
    const offerDate = booking?.offer?.date ? new Date(booking.offer.date) : null;
    const isOfferExpired = offerDate ? offerDate.getTime() < new Date().setHours(0, 0, 0, 0) : false;
    const isTerminalStatus = ['completed', 'cancelled', 'cancellation-rejected', 'refund', 'refunded', 'reschedule-rejected', 'rescheduled', 'expired'].includes(booking?.status ?? '');

    const hasRefundedPayment = booking?.payment?.some((p) => p.status === 'refunded');
    
    const currentStatus = hasRefundedPayment 
        ? 'refunded' 
        : (isOfferExpired && !isTerminalStatus
            ? 'expired'
            : (booking?.status || 'for-reservation'));
            
    const displayCancellationReason = hasRefundedPayment 
        ? 'Refund processed securely via PayMongo.' 
        : booking?.cancellationReason;

    const isApprovedStatus = ['for-payment', 'paid', 'downpayment', 'completed'].includes(currentStatus);
    const isRejectedStatus = currentStatus === 'reservation-rejected';
    const isCancelledStatus = ['cancelled', 'cancellation-rejected', 'refund', 'refunded', 'reschedule-rejected', 'rescheduled', 'expired'].includes(currentStatus);
    const isReviewComplete = isApprovedStatus || isRejectedStatus || isCancelledStatus;

    const [activeTab, setActiveTab] = useState<'documents' | 'payment'>(() => isApprovedStatus ? 'payment' : 'documents'); 
    const [docStates, setDocStates] = useState<Requirements[]>(() => extractDocs(booking, isApprovedStatus, isRejectedStatus));
    const [viewedDocs, setViewedDocs] = useState<Record<number, boolean>>(() => {
        const initialDocs = extractDocs(booking, isApprovedStatus, isRejectedStatus);
        const initialViewed: Record<number, boolean> = {};
        initialDocs.forEach((d, i) => { 
            if (d.valid !== 'pending') initialViewed[i] = true; 
        });
        return initialViewed;
    });
    const [rejectionReason, setRejectionReason] = useState('');
    
    const [personalVerifiedAt, setPersonalVerifiedAt] = useState<Date | null>(() => {
        return toDateOrNull(booking?.user?.phoneVerifiedAt);
    });
    const [emergencyVerifiedAt, setEmergencyVerifiedAt] = useState<Date | null>(() => {
        return toDateOrNull(booking?.emergencyContact?.phoneVerifiedAt);
    });

    useEffect(() => {
        const loadEmergencyVerification = async () => {
            if (booking?.emergencyContact) {
                // Use the booking's own verification date if it exists
                const directVerifiedAt = toDateOrNull(booking.emergencyContact.phoneVerifiedAt);
                if (directVerifiedAt) {
                    setEmergencyVerifiedAt(directVerifiedAt);
                    return;
                }
                // Otherwise check if the emergency contact has a linked user account, and load their global verification
                if (booking.emergencyContact.userId) {
                    try {
                        const contactUser = await UserRepo.fetchById(booking.emergencyContact.userId);
                        const linkedVerifiedAt = toDateOrNull(contactUser?.phoneVerifiedAt ?? contactUser?.emergencyContact?.phoneVerifiedAt);
                        if (linkedVerifiedAt) {
                            setEmergencyVerifiedAt(linkedVerifiedAt);
                            return;
                        }
                    } catch (e) {
                        console.error('Error fetching emergency contact profile: ', e);
                    }
                }
                setEmergencyVerifiedAt(null);
            } else {
                setEmergencyVerifiedAt(null);
            }
        };
        loadEmergencyVerification();
    }, [booking?.emergencyContact]);

    const adminStatusConfig = getStatusConfig(currentStatus, 'admin');
    const isMinor = checkIfMinor(booking?.user?.birthday);

    const currentSyncKey = `${booking?.id || ''}_${booking?.status || ''}_${booking?.user?.phoneNumber || ''}_${booking?.emergencyContact?.contactNumber || ''}_${booking?.updatedAt ? new Date(booking.updatedAt).getTime() : 0}`;
    const [prevSyncKey, setPrevSyncKey] = useState(currentSyncKey);
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setPersonalVerifiedAt(toDateOrNull(booking?.user?.phoneVerifiedAt));
        setEmergencyVerifiedAt(toDateOrNull(booking?.emergencyContact?.phoneVerifiedAt));
        const updatedDocs = extractDocs(booking, isApprovedStatus, isRejectedStatus);
        setDocStates(updatedDocs);
        const initialViewed: Record<number, boolean> = {};
        updatedDocs.forEach((d, i) => { 
            if (d.valid !== 'pending') initialViewed[i] = true; 
        });
        setViewedDocs(initialViewed);
        if (isApprovedStatus) {
            setActiveTab('payment');
        }
    }

    const hasRejections = docStates.some((d) => d.valid === 'rejected');
    const isDecisionIncomplete = docStates.length > 0 && docStates.some((d) => d.valid === 'pending');
    
    const availableOffers = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return offers 
            ? offers
                .filter((o) => {
                    if (!o.date) return false;
                    const dateObj = new Date(o.date);
                    return o.id !== booking?.offer?.id && dateObj.getTime() >= today.getTime();
                })
                .map((o) => ({ 
                    id: o.id, 
                    label: formatDateToStandard(o.date),
                    subLabel: `₱${o.price}`, 
                    originalData: o 
                })) 
            : [];
    }, [offers, booking?.offer?.id]);

    const { 
        syncGlobalVerification, 
    } = PhoneVerificationFlow();

    const personalValidity = calculateVerificationValidity(personalVerifiedAt);
    const emergencyValidity = calculateVerificationValidity(emergencyVerifiedAt);

    const personalStatus = personalValidity.status;
    const emergencyStatus = emergencyValidity.status;
    const personalMonthsRemaining = personalValidity.remainingMonths;
    const emergencyMonthsRemaining = emergencyValidity.remainingMonths;

    const approvalGuard: PhoneVerificationGuardResult = evaluateApprovalGuard(personalStatus, emergencyStatus);

    const togglePersonalVerify = () => {
        const isCurrentlyValid = personalValidity.isValid;
        const newDate = isCurrentlyValid ? null : new Date();
        setPersonalVerifiedAt(newDate);
    };

    const toggleEmergencyVerify = () => {
        const isCurrentlyValid = emergencyValidity.isValid;
        const newDate = isCurrentlyValid ? null : new Date();
        setEmergencyVerifiedAt(newDate);
    };

    return {
        activeTab, setActiveTab,
        docStates, setDocStates,
        viewedDocs, setViewedDocs,
        rejectionReason, setRejectionReason,
        personalVerifiedAt, setPersonalVerifiedAt,
        emergencyVerifiedAt, setEmergencyVerifiedAt,
        personalStatus, emergencyStatus,
        personalMonthsRemaining, emergencyMonthsRemaining,
        togglePersonalVerify, toggleEmergencyVerify,
        approvalGuard,
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
        displayCancellationReason,
        syncGlobalVerification,
    };
}