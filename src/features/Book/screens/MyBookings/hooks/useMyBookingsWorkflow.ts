/**
 * @file useMyBookingsWorkflow.ts
 * @description Workflow state and coordination hook for MyBookingsScreen.
 * Encapsulates view navigation, selected booking state, toast notifications, and async action handlers.
 */

import { useCallback, useMemo, useState } from 'react';

import { useToast } from '@/src/components/Toast/Toast';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation, IUserWalletDetails } from '@/src/core/models/Cancellation/Cancellation';
import { IOffer } from '@/src/core/models/Offer/Offer';

export type MyBookingsView = 'list' | 'overview' | 'payment' | 'receipt';

export interface UseMyBookingsWorkflowParams {
    userBookings?: Booking[];
    userCancellations?: Cancellation[];
    initialBookingId?: string | null;
    initialView?: MyBookingsView;
    onBackPress: () => void;
    onCancelBookingPress: (booking: Booking, reason: string, userWallet?: IUserWalletDetails<Date>) => Promise<void> | void;
    onRescheduleBooking?: (booking: Booking, newOffer: IOffer, reason?: string) => Promise<void> | void;
    onRefundBookingPress?: (booking: Booking, reason: string, userWallet?: IUserWalletDetails<Date>) => Promise<void> | void;
}

export function useMyBookingsWorkflow({
    userBookings = [],
    userCancellations = [],
    initialBookingId,
    initialView,
    onBackPress,
    onCancelBookingPress,
    onRescheduleBooking,
    onRefundBookingPress,
}: UseMyBookingsWorkflowParams) {
    const { showToast } = useToast();

    const initialKey = `${initialView || 'list'}_${initialBookingId || ''}`;
    const [prevInitialKey, setPrevInitialKey] = useState<string>(initialKey);
    const [currentView, setCurrentView] = useState<MyBookingsView>(initialView || 'list');
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(initialBookingId || null);

    // Sync external navigation search params during render
    if (initialKey !== prevInitialKey) {
        setPrevInitialKey(initialKey);
        if (initialView) {
            setCurrentView(initialView);
        }
        if (initialBookingId !== undefined) {
            setSelectedBookingId(initialBookingId);
        }
    }

    // Memoize selected booking instances
    const selectedBooking = useMemo(() => {
        if (!selectedBookingId || !userBookings) return null;
        return userBookings.find(b => b.id === selectedBookingId) || null;
    }, [userBookings, selectedBookingId]);

    const selectedBookingCancellation = useMemo(() => {
        if (!selectedBookingId || !userCancellations) return null;
        return userCancellations.find(c => c.bookingId === selectedBookingId) || null;
    }, [userCancellations, selectedBookingId]);

    const handleHeaderBackPress = useCallback(() => {
        if (currentView === 'overview') {
            setCurrentView('list');
            return;
        }
        if (currentView === 'payment') {
            setCurrentView('overview');
            return;
        }
        if (currentView === 'receipt') {
            setCurrentView('overview');
            return;
        }
        onBackPress();
    }, [currentView, onBackPress]);

    const handleBookingSelectPress = useCallback((booking: Booking) => {
        setSelectedBookingId(booking.id);
        setCurrentView('overview');
    }, []);

    const handleProceedToPaymentPress = useCallback(() => {
        setCurrentView('payment');
    }, []);

    const handleViewReceiptPress = useCallback(() => {
        setCurrentView('receipt');
    }, []);

    const handleCancelConfirm = useCallback(async (booking: Booking, reason: string, userWallet?: IUserWalletDetails<Date>) => {
        const isDraft = booking.status === 'for-reservation';
        try {
            await onCancelBookingPress(booking, reason, userWallet);
            if (isDraft) {
                setCurrentView('list');
                showToast.success('Reservation cancelled successfully.');
            }
        } catch (err: unknown) {
            if (isDraft) {
                setCurrentView('list');
                showToast.error(
                    err instanceof Error ? err.message : 'Failed to cancel reservation.'
                );
            }
            throw err;
        }
    }, [onCancelBookingPress, showToast]);

    const handleRescheduleConfirm = useCallback(async (booking: Booking, newOffer: IOffer, reason?: string) => {
        if (!onRescheduleBooking) return;
        try {
            await onRescheduleBooking(booking, newOffer, reason);
            setCurrentView('list');
            showToast.success('Reschedule request submitted successfully.');
        } catch (err: unknown) {
            setCurrentView('list');
            showToast.error(
                err instanceof Error ? err.message : 'Failed to submit reschedule request.'
            );
        }
    }, [onRescheduleBooking, showToast]);

    const handleRefundConfirm = useCallback(async (booking: Booking, reason: string, userWallet?: IUserWalletDetails<Date>) => {
        if (onRefundBookingPress) {
            await onRefundBookingPress(booking, reason, userWallet);
        }
    }, [onRefundBookingPress]);

    return {
        currentView, setCurrentView,
        selectedBookingId, setSelectedBookingId,
        selectedBooking,
        selectedBookingCancellation,
        showToast,
        handleHeaderBackPress,
        handleBookingSelectPress,
        handleProceedToPaymentPress,
        handleViewReceiptPress,
        handleCancelConfirm,
        handleRescheduleConfirm,
        handleRefundConfirm,
    };
}

export default useMyBookingsWorkflow;
