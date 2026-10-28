import { useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/core/config/Firebase';
import { useRescheduleStore } from '@/src/core/models/Reschedule/stores/rescheduleStore';
import { RescheduleRepo } from '@/src/core/models/Reschedule/repositories/RescheduleRepository';
import { Reschedule } from '@/src/core/models/Reschedule/interfaces/Reschedule.types';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Offer } from '@/src/core/models/Offer/Offer';
import { useBookingsStore } from '@/src/core/models/Booking/stores/bookingStore';
import { useOfferStore } from '@/src/core/models/Offer/Offer';
import { useAuthHook } from '@/src/core/models/User/User';

export const useRescheduleAdmin = (bookingId?: string, businessId?: string, rescheduleRequestId?: string) => {
    const { businessId: authBusinessId } = useAuthHook();
    const effectiveBusinessId = businessId || authBusinessId;

    const businessReschedules = useRescheduleStore(s => s.businessReschedules);
    const isWriting = useRescheduleStore(s => s.isWriting);
    const [fetchedReschedule, setFetchedReschedule] = useState<Reschedule | null>(null);
    const [isFetchingLocal, setIsFetchingLocal] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // 1. Locate reschedule from store
    const storeReschedule = useMemo(() => {
        if (!bookingId && !rescheduleRequestId) return null;
        return businessReschedules.find(r => 
            (rescheduleRequestId && r.id === rescheduleRequestId) ||
            (bookingId && r.bookingId === bookingId && r.status === 'pending') ||
            (bookingId && r.bookingId === bookingId)
        ) || null;
    }, [businessReschedules, bookingId, rescheduleRequestId]);

    // 2. Real-time snapshot listener on the reschedule document
    useEffect(() => {
        const targetId = rescheduleRequestId || storeReschedule?.id;
        if (!effectiveBusinessId || !targetId) return;

        setIsFetchingLocal(true);
        const unsubscribe = RescheduleRepo.listenToRescheduleById(
            effectiveBusinessId,
            targetId,
            (rescheduleDoc) => {
                setIsFetchingLocal(false);
                if (rescheduleDoc) {
                    setFetchedReschedule(rescheduleDoc);
                }
            },
            (err) => {
                setIsFetchingLocal(false);
                console.warn('[useRescheduleAdmin] Failed to listen to reschedule request:', err);
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [effectiveBusinessId, rescheduleRequestId, storeReschedule?.id]);

    const activeReschedule = fetchedReschedule || storeReschedule;

    const onApproveReschedule = async (newOffer: Offer, booking: Booking, adminNote?: string) => {
        try {
            setLocalError(null);
            if (!booking) throw new Error('Booking is required to approve reschedule');
            if (!newOffer) throw new Error('A target offer is required to approve reschedule');

            const approveRescheduleFn = httpsCallable(functions, 'approveReschedule');
            const result = await approveRescheduleFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                newOfferId: newOffer.id,
                businessId: booking.business?.id || effectiveBusinessId,
                rescheduleRequestId: activeReschedule?.id || booking.rescheduleRequestId,
                adminNote,
            });

            const resolvedBizId = booking.business?.id || effectiveBusinessId;
            if (resolvedBizId) {
                await Promise.all([
                    useOfferStore.getState().fetchOfferByBusiness(resolvedBizId),
                    useRescheduleStore.getState().fetchAllByBusinessId(resolvedBizId),
                ]).catch(console.warn);
            }

            if (booking.offer?.id) {
                await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer.id).catch(console.warn);
            }

            return result.data;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to approve reschedule request';
            setLocalError(msg);
            throw err;
        }
    };

    const onDeclineReschedule = async (
        reason: string,
        reschedule?: Reschedule | null,
        booking?: Booking
    ) => {
        try {
            setLocalError(null);
            const req = reschedule || activeReschedule;
            if (!req) throw new Error('Reschedule request not found');

            const targetBusinessId = req.businessId || effectiveBusinessId;
            if (!targetBusinessId) throw new Error('Business ID missing');

            const targetUserId = req.userId || booking?.user?.id;
            if (!targetUserId) throw new Error('User ID missing');

            const targetBookingId = req.bookingId || booking?.id;
            if (!targetBookingId) throw new Error('Booking ID missing');

            // Determine revert status: if booking had remaining balance > 0 -> 'downpayment', else 'completed'
            const hasRemainingBalance = (booking?.paymentRemainingBalance && booking.paymentRemainingBalance > 0) ||
                (booking?.remainingBalance && booking.remainingBalance > 0);
            const revertStatus = hasRemainingBalance ? 'downpayment' : 'completed';

            await useRescheduleStore.getState().rejectRescheduleRequest(
                targetBusinessId,
                req.id,
                targetUserId,
                targetBookingId,
                reason,
                revertStatus
            );

            if (booking?.offer?.id) {
                await useBookingsStore.getState().refreshBookingItem(targetBookingId, booking.offer.id).catch(console.warn);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to decline reschedule request';
            setLocalError(msg);
            throw err;
        }
    };

    return {
        rescheduleRequest: activeReschedule,
        isFetching: isFetchingLocal,
        isWriting,
        error: localError,
        onApproveReschedule,
        onDeclineReschedule,
    };
};
