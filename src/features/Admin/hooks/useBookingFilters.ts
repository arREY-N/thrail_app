/**
 * @file useBookingFilters.ts
 * @description Custom hook to manage booking filters and sorting on the OfferView screen.
 */

import { useMemo, useState } from 'react';

import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';

export const FILTER_OPTIONS = ['All', 'Needs Review', 'For Payment', 'Paid', 'Completed', 'Cancelled'];

/**
 * useBookingFilters — Filters and sorts a list of bookings for an offer.
 * 
 * @param bookings - The array of booking objects to filter and sort.
 * @param cancellations - Optional array of business cancellation records.
 * @returns An object containing the active filter, sorting order state, setter functions, and filtered/sorted bookings.
 */
export default function useBookingFilters(bookings: Booking[], cancellations?: Cancellation[]) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const filteredBookings = useMemo(() => {
        if (!bookings) return [];

        const getBookingDetails = (b: Booking) => {
            const cancellation = cancellations?.find(c => c.bookingId === b.id && !c.isDeleted);
            
            const hasRefundedPayment = b.payment?.some((p: IPayment<Date>) => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
            const isVerifyingPayment = b.paymentVerificationStatus === 'pending_verification' ||
                Boolean(b.payment?.some((p: IPayment<Date>) => p.gateway === 'manual_qr' && p.status === 'pending'));

            const isNoRefund =
                cancellation?.refundDecision === 'no_refund' ||
                (cancellation?.status === 'approved' &&
                    b.status === 'cancelled' &&
                    cancellation?.refundAmount === 0 &&
                    cancellation?.handshakeStep !== 'awaiting_user_wallet' &&
                    cancellation?.handshakeStep !== 'awaiting_admin_payout' &&
                    !cancellation?.adminRefundReceiptUrl);

            const isRefundComplete =
                !isNoRefund &&
                (b.status === 'refunded' ||
                    cancellation?.status === 'refund_completed' ||
                    cancellation?.handshakeStep === 'completed' ||
                    Boolean(cancellation?.userConfirmedReceivedAt) ||
                    hasRefundedPayment);

            const isRefunding =
                !isRefundComplete &&
                (b.status === 'refund' ||
                    cancellation?.status === 'refund_pending' ||
                    cancellation?.status === 'refund_submitted' ||
                    cancellation?.status === 'refund_disputed' ||
                    (cancellation?.status === 'approved' &&
                        !isNoRefund &&
                        (Boolean(cancellation?.refundAmount && cancellation.refundAmount > 0) ||
                         Boolean(cancellation?.handshakeStep && cancellation.handshakeStep !== 'completed'))));

            const isHikerCancellationPending = cancellation && cancellation.status === 'pending' && cancellation.cancelledBy !== 'admin' && b.status !== 'cancelled';

            let status: string = b.status || '';
            if (isNoRefund) {
                status = 'cancelled';
            } else if (isRefundComplete) {
                status = 'refunded';
            } else if (isRefunding) {
                status = 'refund';
            } else if (isHikerCancellationPending) {
                status = 'for-cancellation';
            } else if (isVerifyingPayment && (b.status === 'for-payment' || b.status === 'downpayment')) {
                status = 'verifying-payment';
            }

            const isRefundActionNeeded = isRefunding && (
                cancellation?.handshakeStep === 'awaiting_admin_payout' ||
                cancellation?.handshakeStep === 'awaiting_admin_refund_decision' ||
                cancellation?.handshakeStep === 'refund_disputed' ||
                cancellation?.status === 'refund_disputed' ||
                (!cancellation?.adminRefundReceiptUrl && !cancellation?.handshakeStep)
            );

            const requiresAdminAction =
                status === 'for-reservation' ||
                status === 'verifying-payment' ||
                status === 'for-cancellation' ||
                status === 'for-reschedule' ||
                (status === 'refund' && isRefundActionNeeded);

            return { status, requiresAdminAction, cancellation };
        };

        let result = [...bookings];

        if (activeFilter !== 'All') {
            result = result.filter(b => {
                const { status, requiresAdminAction } = getBookingDetails(b);
                
                if (activeFilter === 'Needs Review') return requiresAdminAction;
                if (activeFilter === 'For Payment') return status === 'for-payment' || status === 'approved-docs' || status === 'payment-rejected';
                if (activeFilter === 'Paid') return status === 'paid' || status === 'downpayment' || status === 'rescheduled';
                if (activeFilter === 'Completed') return status === 'completed' || status === 'finished';
                if (activeFilter === 'Cancelled') return ['reservation-rejected', 'cancelled', 'refunded', 'expired', 'cancellation-rejected', 'reschedule-rejected'].includes(status);
                
                return true;
            });
        }

        const getMs = (val: unknown): number => {
            if (val instanceof Date) return val.getTime();
            if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
                return (val as { toDate: () => Date }).toDate().getTime();
            }
            if (typeof val === 'string' || typeof val === 'number') {
                return new Date(val).getTime() || 0;
            }
            return 0;
        };

        // If filtering on a specific status, sort purely by date based on sortOrder
        if (activeFilter !== 'All') {
            return result.sort((a, b) => {
                const timeA = getMs(a.updatedAt || a.createdAt);
                const timeB = getMs(b.updatedAt || b.createdAt);
                return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
            });
        }

        // 3-Tier Hierarchy for 'All' tab: Action Required -> Confirmed/In-Progress -> Dead/Closed
        const getPriorityTier = (b: Booking): number => {
            const { status, requiresAdminAction } = getBookingDetails(b);

            // Tier 1: Action Required by Admin (Top)
            if (requiresAdminAction) {
                return 1;
            }

            // Tier 2: Confirmed / Active Hiker (Middle)
            if (status === 'for-payment' || status === 'approved-docs' || status === 'downpayment' || status === 'paid' || status === 'rescheduled') {
                return 2;
            }

            // Tier 3: Closed / Finished Records (Bottom)
            if (['completed', 'finished', 'cancelled', 'reservation-rejected', 'refunded', 'expired', 'cancellation-rejected', 'reschedule-rejected'].includes(status)) {
                return 3;
            }

            return 4;
        };

        return result.sort((a, b) => {
            const tierA = getPriorityTier(a);
            const tierB = getPriorityTier(b);
            
            if (tierA !== tierB) {
                return tierA - tierB;
            }

            const timeA = getMs(a.updatedAt || a.createdAt);
            const timeB = getMs(b.updatedAt || b.createdAt);
            
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

    }, [bookings, cancellations, activeFilter, sortOrder]);

    return {
        activeFilter,
        setActiveFilter,
        sortOrder,
        setSortOrder,
        filteredBookings,
    };
}