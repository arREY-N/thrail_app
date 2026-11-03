/**
 * @file useAdminOfferViewTutorial.ts
 * @description Hook managing layout measurement, spotlight registration, autoscroll, and tutorial guide for Admin OfferViewScreen.
 */

import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
} from '../../utils/tutorialLayoutRegistry';
import { useTutorialGuide } from '../useTutorialGuide';

export interface UseAdminOfferViewTutorialParams {
    /** Flag indicating whether the offer data is available */
    isReady: boolean;
    /** Callback to reset active filter tab to 'All' so all bookings are visible for the walkthrough */
    onResetFilterToAll?: () => void;
}

/**
 * Encapsulates tutorial state, element measurement, autoscroll, and filter reset
 * for the Admin Offer View (summary card, bookings header/filters, first booking card).
 *
 * @param params - Configuration parameters including data readiness flag and filter reset callback.
 * @returns Ref objects, layout event handlers, and tutorial controller.
 */
export const useAdminOfferViewTutorial = ({
    isReady,
    onResetFilterToAll,
}: UseAdminOfferViewTutorialParams) => {
    const tutorial = useTutorialGuide('admin_offer_view', isReady);

    const scrollViewRef = useRef<ScrollView>(null);
    const summaryRef = useRef<View>(null);
    const filtersRef = useRef<View>(null);
    const firstBookingRef = useRef<View>(null);
    const emptyStateRef = useRef<View>(null);
    const bookingsOffsetY = useRef<number>(240);
    const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const measureSummaryNow = useCallback(() => {
        summaryRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_view_summary', { x, y, width, height });
            }
        });
    }, []);

    const measureFiltersNow = useCallback(() => {
        filtersRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_view_filters', { x, y, width, height });
            }
        });
    }, []);

    const measureBookingCardNow = useCallback(() => {
        const target = firstBookingRef.current || emptyStateRef.current;
        target?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_view_booking_card', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const u1 = registerMeasureCallback('admin_view_summary', measureSummaryNow);
        const u2 = registerMeasureCallback('admin_view_filters', measureFiltersNow);
        const u3 = registerMeasureCallback('admin_view_booking_card', measureBookingCardNow);
        return () => {
            u1();
            u2();
            u3();
        };
    }, [measureSummaryNow, measureFiltersNow, measureBookingCardNow]);

    const clearTimers = useCallback(() => {
        activeTimersRef.current.forEach((t) => clearTimeout(t));
        activeTimersRef.current = [];
    }, []);

    const scheduleMeasurements = useCallback((stepKey: string) => {
        clearTimers();
        requestTargetMeasurement(stepKey);
        const t1 = setTimeout(() => requestTargetMeasurement(stepKey), 60);
        const t2 = setTimeout(() => requestTargetMeasurement(stepKey), 160);
        const t3 = setTimeout(() => requestTargetMeasurement(stepKey), 300);
        const t4 = setTimeout(() => requestTargetMeasurement(stepKey), 450);
        activeTimersRef.current = [t1, t2, t3, t4];
    }, [clearTimers]);

    useEffect(() => {
        if (!tutorial.isVisible) return;
        const step = tutorial.currentStep?.targetSpotlight;
        if (!step) return;

        // Automatically reset filter to 'All' on step 2 (Filters) or step 3 (Booking Card)
        // so all bookings are visible and the first booking card is guaranteed to render
        if (step === 'admin_view_filters' || step === 'admin_view_booking_card') {
            onResetFilterToAll?.();
        }

        if (step === 'admin_view_summary' || step === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else if (step === 'admin_view_filters') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, bookingsOffsetY.current - 80),
                animated: true,
            });
        } else if (step === 'admin_view_booking_card') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, bookingsOffsetY.current - 16),
                animated: true,
            });
        }

        scheduleMeasurements(step);
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight, onResetFilterToAll, scheduleMeasurements]);

    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, [clearTimers]);

    const handleSummaryLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureSummaryNow();
    }, [measureSummaryNow]);

    const handleFiltersLayout = useCallback((offsetY: number) => {
        bookingsOffsetY.current = offsetY;
        if (isTutorialMeasurementActive()) measureFiltersNow();
    }, [measureFiltersNow]);

    const handleBookingCardLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureBookingCardNow();
    }, [measureBookingCardNow]);

    return {
        scrollViewRef,
        summaryRef,
        filtersRef,
        firstBookingRef,
        emptyStateRef,
        handleSummaryLayout,
        handleFiltersLayout,
        handleBookingCardLayout,
        tutorial,
    };
};
