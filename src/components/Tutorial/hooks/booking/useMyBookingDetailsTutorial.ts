/**
 * @file useMyBookingDetailsTutorial.ts
 * @description Custom hook encapsulating tutorial tour state, element measurement refs,
 * registration callbacks, bidirectional auto-scrolling, and layout handlers for the Booking Details screen
 * (MyBookings BookingDetailsScreen).
 */

import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, ScrollView, View } from 'react-native';

import { useTutorialGuide } from '@/src/components/Tutorial/hooks/useTutorialGuide';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';

/**
 * Configuration parameters for the Booking Details tutorial hook.
 */
export interface UseMyBookingDetailsTutorialParams {
    /** Whether the offer details are still loading */
    isLoadingOffer: boolean;
}

/**
 * Hook to manage booking details walkthrough lifecycle, element measurements,
 * bidirectional auto-scrolling, and target refs.
 *
 * @param params - Configuration parameters containing loading state
 * @returns Tutorial state, target element refs, container scroll ref, and onLayout event handlers
 */
export const useMyBookingDetailsTutorial = ({
    isLoadingOffer,
}: UseMyBookingDetailsTutorialParams) => {
    const tutorial = useTutorialGuide('my_booking_details', !isLoadingOffer);
    const activeTutorialStep = tutorial.isVisible ? tutorial.currentStep?.targetSpotlight : undefined;

    const scrollViewRef = useRef<ScrollView>(null);
    const quickInfoRef = useRef<View>(null);
    const statusTrackerRef = useRef<View>(null);
    const documentsRef = useRef<View>(null);
    const accordionsRef = useRef<View>(null);
    const paymentSummaryRef = useRef<View>(null);

    const statusOffsetY = useRef<number>(0);
    const documentsOffsetY = useRef<number>(0);
    const accordionsOffsetY = useRef<number>(0);
    const paymentSummaryOffsetY = useRef<number>(0);

    const measureQuickInfoNow = useCallback(() => {
        quickInfoRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 16) {
                registerTutorialLayout('my_booking_quick_info', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 16,
                });
            }
        });
    }, []);

    const measureStatusTrackerNow = useCallback(() => {
        statusTrackerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 16) {
                registerTutorialLayout('my_booking_status_tracker', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 16,
                });
            }
        });
    }, []);

    const measureDocumentsNow = useCallback(() => {
        documentsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 12) {
                registerTutorialLayout('my_booking_documents', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 12,
                });
            }
        });
    }, []);

    const measureAccordionsNow = useCallback(() => {
        accordionsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 12) {
                registerTutorialLayout('my_booking_accordions', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 12,
                });
            }
        });
    }, []);

    const measurePaymentSummaryNow = useCallback(() => {
        paymentSummaryRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 16) {
                registerTutorialLayout('my_booking_payment_summary', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 16,
                });
            }
        });
    }, []);

    // Register on-demand measurement callbacks with global layout registry
    useEffect(() => {
        const unsubQuick = registerMeasureCallback('my_booking_quick_info', measureQuickInfoNow);
        const unsubStatus = registerMeasureCallback('my_booking_status_tracker', measureStatusTrackerNow);
        const unsubDocs = registerMeasureCallback('my_booking_documents', measureDocumentsNow);
        const unsubAcc = registerMeasureCallback('my_booking_accordions', measureAccordionsNow);
        const unsubPay = registerMeasureCallback('my_booking_payment_summary', measurePaymentSummaryNow);

        return () => {
            unsubQuick();
            unsubStatus();
            unsubDocs();
            unsubAcc();
            unsubPay();
        };
    }, [
        measureQuickInfoNow,
        measureStatusTrackerNow,
        measureDocumentsNow,
        measureAccordionsNow,
        measurePaymentSummaryNow,
    ]);

    // Bidirectional auto-scroll with 260ms settling delay re-measurement
    useEffect(() => {
        if (!tutorial.isVisible) return;

        if (activeTutorialStep === 'my_booking_quick_info' || activeTutorialStep === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            const timer = setTimeout(measureQuickInfoNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_status_tracker') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, statusOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measureStatusTrackerNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_documents') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, documentsOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measureDocumentsNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_accordions') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, accordionsOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measureAccordionsNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_payment_summary') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, paymentSummaryOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measurePaymentSummaryNow, 260);
            return () => clearTimeout(timer);
        }
    }, [
        tutorial.isVisible,
        activeTutorialStep,
        measureQuickInfoNow,
        measureStatusTrackerNow,
        measureDocumentsNow,
        measureAccordionsNow,
        measurePaymentSummaryNow,
    ]);

    // Reset scroll position to top when tutorial finishes or is dismissed
    const prevTutorialVisible = useRef(tutorial.isVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !tutorial.isVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = tutorial.isVisible;
    }, [tutorial.isVisible]);

    // Pre-warming layout event handlers guarded by isTutorialMeasurementActive()
    const handleQuickInfoLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureQuickInfoNow();
        }
    }, [measureQuickInfoNow]);

    const handleStatusTrackerLayout = useCallback((e: LayoutChangeEvent) => {
        statusOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureStatusTrackerNow();
        }
    }, [measureStatusTrackerNow]);

    const handleDocumentsLayout = useCallback((e: LayoutChangeEvent) => {
        documentsOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureDocumentsNow();
        }
    }, [measureDocumentsNow]);

    const handleAccordionsLayout = useCallback((e: LayoutChangeEvent) => {
        accordionsOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureAccordionsNow();
        }
    }, [measureAccordionsNow]);

    const handlePaymentSummaryLayout = useCallback((e: LayoutChangeEvent) => {
        paymentSummaryOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measurePaymentSummaryNow();
        }
    }, [measurePaymentSummaryNow]);

    return {
        tutorial,
        activeTutorialStep,
        scrollViewRef,
        quickInfoRef,
        statusTrackerRef,
        documentsRef,
        accordionsRef,
        paymentSummaryRef,
        handlers: {
            handleQuickInfoLayout,
            handleStatusTrackerLayout,
            handleDocumentsLayout,
            handleAccordionsLayout,
            handlePaymentSummaryLayout,
        },
    };
};

