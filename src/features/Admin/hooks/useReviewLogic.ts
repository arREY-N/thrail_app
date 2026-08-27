import { getStatusConfig } from '@/src/constants/statusConfig';
import { UserRepository } from '@/src/core/repositories/userRepository';
import { checkIfMinor, formatDateToStandard } from '@/src/utils/dateFormatter';
import { useEffect, useMemo, useState } from 'react';

export default function useReviewLogic(booking: any, offers: any[]) {
    const [activeTab, setActiveTab] = useState('documents'); 
    const [docStates, setDocStates] = useState<any[]>([]);
    const [viewedDocs, setViewedDocs] = useState<any>({});
    const [rejectionReason, setRejectionReason] = useState('');
    
    const [personalVerifiedAt, setPersonalVerifiedAt] = useState<Date | null>(() => {
        return booking?.user?.phoneVerifiedAt ? new Date(booking.user.phoneVerifiedAt) : null;
    });
    const [emergencyVerifiedAt, setEmergencyVerifiedAt] = useState<Date | null>(() => {
        return booking?.emergencyContact?.phoneVerifiedAt ? new Date(booking.emergencyContact.phoneVerifiedAt) : null;
    });

    useEffect(() => {
        const loadEmergencyVerification = async () => {
            if (booking?.emergencyContact) {
                // Use the booking's own verification date if it exists
                if (booking.emergencyContact.phoneVerifiedAt) {
                    setEmergencyVerifiedAt(new Date(booking.emergencyContact.phoneVerifiedAt));
                    return;
                }
                // Otherwise check if the emergency contact has a linked user account, and load their global verification
                if (booking.emergencyContact.userId) {
                    try {
                        const contactUser = await UserRepository.fetchById(booking.emergencyContact.userId);
                        if (contactUser?.phoneVerifiedAt) {
                            setEmergencyVerifiedAt(new Date(contactUser.phoneVerifiedAt));
                            return;
                        }
                    } catch (e) {
                        console.error('Error fetching emergency contact profile: ', e);
                    }
                }
                setEmergencyVerifiedAt(null);
            }
        };
        loadEmergencyVerification();
    }, [booking?.emergencyContact]);

    const offerDate = booking?.offer?.date ? new Date(booking.offer.date) : null;
    const isOfferExpired = offerDate ? offerDate.getTime() < new Date().setHours(0,0,0,0) : false;
    const isTerminalStatus = ['completed', 'cancelled', 'cancellation-rejected', 'refund', 'refunded', 'reschedule-rejected', 'rescheduled', 'expired'].includes(booking?.status);

    const hasRefundedPayment = booking?.payment?.some((p: any) => p.status === 'refunded');
    
    const currentStatus = hasRefundedPayment 
        ? 'refunded' 
        // : (isOfferExpired && !isTerminalStatus && booking?.status !== 'paid' && booking?.status !== 'downpayment'
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

    const adminStatusConfig = getStatusConfig(currentStatus, 'admin');

    const isMinor = checkIfMinor(booking?.user?.birthday);

    const mapDocument = (name: any, file: any, valid: any) => {
        let validState = 'pending';
        if (valid === 'approved' || valid === true) validState = 'approved';
        if (valid === 'rejected' || valid === false) validState = 'rejected';
        if (isApprovedStatus) validState = 'approved';
        if (isRejectedStatus && validState === 'pending') validState = 'rejected';
        return { name: name || 'Unnamed Document', file, valid: validState };
    };

    const [prevBooking, setPrevBooking] = useState(booking);
    if (booking !== prevBooking) {
        setPrevBooking(booking);
        if (booking?.user?.phoneVerifiedAt) {
            setPersonalVerifiedAt(new Date(booking.user.phoneVerifiedAt));
        }
        if (booking?.documents) {
            const docsArray = Array.isArray(booking.documents) 
                ? booking.documents.map((d: any, i: any) => mapDocument(d.name || `Req ${i+1}`, d.file, d.valid))
                : Object.entries(booking.documents).map(([k, v]: [string, any]) => mapDocument(v.name || k, v.file || '', v.valid));
            setDocStates(docsArray);
            const initialViewed: any = {};
            docsArray.forEach((d: any, i: any) => { 
                if (d.valid !== 'pending') initialViewed[i] = true; 
            });
            setViewedDocs(initialViewed);
        }
        if (isApprovedStatus) {
            setActiveTab('payment');
        }
    }

    const hasRejections = docStates.some((d: any) => d.valid === 'rejected');
    const isDecisionIncomplete = docStates.length > 0 && docStates.some((d: any) => d.valid === 'pending');
    
    const availableOffers = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return offers 
            ? offers
                .filter((o: any) => {
                    if (!o.date) return false;
                    const dateObj = new Date(o.date);
                    return o.id !== booking?.offer?.id && dateObj.getTime() >= today.getTime();
                })
                .map((o: any) => ({ 
                    id: o.id, 
                    label: formatDateToStandard(o.date),
                    subLabel: `₱${o.price}`, 
                    originalData: o 
                })) 
            : [];
    }, [offers, booking?.offer?.id]);

    const getVerificationStatus = (verifiedAt: Date | null): 'verified' | 'expired' | 'unverified' => {
        if (!verifiedAt) return 'unverified';
        const date = new Date(verifiedAt);
        if (isNaN(date.getTime())) return 'unverified';
        
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4375);
        
        if (diffMonths >= 6) {
            return 'expired';
        }
        return 'verified';
    };

    const getVerificationMonthsRemaining = (verifiedAt: Date | null) => {
        if (!verifiedAt) return 0;
        const date = new Date(verifiedAt);
        if (isNaN(date.getTime())) return 0;
        
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4375);
        const monthsRemaining = 6 - diffMonths;
        return monthsRemaining > 0 ? Math.ceil(monthsRemaining) : 0;
    };

    const personalStatus = getVerificationStatus(personalVerifiedAt);
    const emergencyStatus = getVerificationStatus(emergencyVerifiedAt);
    const personalMonthsRemaining = getVerificationMonthsRemaining(personalVerifiedAt);
    const emergencyMonthsRemaining = getVerificationMonthsRemaining(emergencyVerifiedAt);

    const togglePersonalVerify = () => {
        if (personalVerifiedAt) {
            setPersonalVerifiedAt(null);
        } else {
            setPersonalVerifiedAt(new Date());
        }
    };

    const toggleEmergencyVerify = () => {
        if (emergencyVerifiedAt) {
            setEmergencyVerifiedAt(null);
        } else {
            setEmergencyVerifiedAt(new Date());
        }
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