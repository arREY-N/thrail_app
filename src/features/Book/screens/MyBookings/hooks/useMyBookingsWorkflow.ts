/**
 * @file useMyBookingsWorkflow.ts
 * @description Workflow state and coordination hook for MyBookingsScreen.
 * Encapsulates view navigation, selected booking state, toast notifications, and async action handlers.
 */

import { useCallback, useMemo, useState } from 'react';

import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { IOffer } from '@/src/core/models/Offer/Offer';

export type MyBookingsView = 'list' | 'overview' | 'payment' | 'receipt';

export interface UseMyBookingsWorkflowParams {
    userBookings?: Booking[];
    userCancellations?: Cancellation[];
    initialBookingId?: string | null;
    initialView?: MyBookingsView;
    onBackPress: () => void;
    onCancelBookingPress: (booking: Booking, reason: string) => Promise<void> | void;
    onRescheduleBooking?: (booking: Booking, newOffer: IOffer) => Promise<void> | void;
    onRefundBookingPress?: (booking: Booking, reason: string) => Promise<void> | void;
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
    const initialKey = `${initialView || 'list'}_${initialBookingId || ''}`;
    const [prevInitialKey, setPrevInitialKey] = useState<string>(initialKey);
    const [currentView, setCurrentView] = useState<MyBookingsView>(initialView || 'list');
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(initialBookingId || null);

    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error';
        message: string;
    }>({
        visible: false,
        type: 'success',
        message: '',
    });

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

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToastConfig({
            visible: true,
            type,
            message,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToastConfig(prev => ({ ...prev, visible: false }));
    }, []);

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

    const handleCancelConfirm = useCallback(async (booking: Booking, reason: string) => {
        const isDraft = booking.status === 'for-reservation';
        try {
            await onCancelBookingPress(booking, reason);
            if (isDraft) {
                setCurrentView('list');
                showToast('success', 'Reservation cancelled successfully.');
            }
        } catch (err: unknown) {
            if (isDraft) {
                setCurrentView('list');
                showToast(
                    'error',
                    err instanceof Error ? err.message : 'Failed to cancel reservation.'
                );
            }
            throw err;
        }
    }, [onCancelBookingPress, showToast]);

    const handleRescheduleConfirm = useCallback(async (booking: Booking, newOffer: IOffer) => {
        if (!onRescheduleBooking) return;
        try {
            await onRescheduleBooking(booking, newOffer);
            setCurrentView('list');
            showToast('success', 'Booking rescheduled successfully.');
        } catch (err: unknown) {
            setCurrentView('list');
            showToast(
                'error',
                err instanceof Error ? err.message : 'Failed to reschedule booking.'
            );
        }
    }, [onRescheduleBooking, showToast]);

    const handleRefundConfirm = useCallback(async (booking: Booking, reason: string) => {
        if (onRefundBookingPress) {
            await onRefundBookingPress(booking, reason);
        }
    }, [onRefundBookingPress]);

    return {
        currentView, setCurrentView,
        selectedBookingId, setSelectedBookingId,
        selectedBooking,
        selectedBookingCancellation,
        toastConfig,
        showToast,
        hideToast,
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
