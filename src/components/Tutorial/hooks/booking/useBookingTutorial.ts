/**
 * @file useBookingTutorial.ts
 * @description Modular walkthrough hooks orchestrating the in-app guides for the Booking Wizard flow.
 * Provides context-aware walkthroughs for:
 * 1. Wizard Controller: useBookingTutorial (BookingScreen.tsx)
 * 2. Step 1: useBookingOffersTutorial (OffersScreen.tsx)
 * 3. Step 2: useBookingDetailsTutorial (DetailsScreen.tsx)
 * 4. Step 3: useBookingStatusTutorial (StatusScreen.tsx)
 * Encapsulates element refs, layout registrations, on-demand measurements, and bidirectional auto-scrolling.
 */

import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, ScrollView, View } from 'react-native';

import { useTutorialGuide } from '@/src/components/Tutorial/hooks/useTutorialGuide';
import { type TutorialTourId } from '@/src/components/Tutorial/interfaces/Tutorial.types';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
} from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';

/* =========================================================================
   1. PARENT WIZARD CONTROLLER HOOK (BookingScreen.tsx)
   ========================================================================= */

/**
 * Configuration parameters for the parent BookingScreen wizard tutorial controller hook.
 */
export interface UseBookingTutorialParams {
    /** Current active wizard view step (1 = Offers, 2 = Details, 3 = Status) */
    currentView: number;
    /** Whether booking submission is currently in progress */
    isSubmitting: boolean;
    /** Optional submission outcome status */
    bookingStatusOutcome?: 'success' | 'error' | 'conflict';
}

/**
 * Controller hook managing the tutorial guide lifecycle and active tour selection for BookingScreen.
 *
 * @param params - Parameters containing current view step, loading flag, and outcome status
 * @returns Tutorial state, active tour spotlight, and visibility flags
 */
export const useBookingTutorial = ({
    currentView,
    isSubmitting,
    bookingStatusOutcome,
}: UseBookingTutorialParams) => {
    const isTourEnabled = !isSubmitting && (currentView !== 3 || bookingStatusOutcome === 'success');
    const currentTourId: TutorialTourId =
        currentView === 1 ? 'booking_offers' : currentView === 2 ? 'booking_details' : 'booking_status';

    const tutorial = useTutorialGuide(currentTourId, isTourEnabled);
    const activeSpotlight = tutorial.isVisible ? tutorial.currentStep?.targetSpotlight : undefined;

    return {
        tutorial,
        activeSpotlight,
        activeTutorialStep: activeSpotlight,
        isTutorialVisible: tutorial.isVisible,
    };
};

/* =========================================================================
   2. STEP 1 HOOK: OFFERS & CALENDAR (OffersScreen.tsx)
   ========================================================================= */

/**
 * Configuration parameters for the OffersScreen tutorial hook.
 */
export interface UseBookingOffersTutorialParams {
    /** Currently active spotlight target identifier */
    activeTutorialStep?: string;
    /** Whether the tutorial modal overlay is currently visible */
    isTutorialVisible?: boolean;
    /** Optional callback to reset selected offer when tutorial triggers */
    onResetSelection?: () => void;
}

/**
 * Hook to manage element measurement refs, layout callbacks, and auto-scrolling
 * for Step 1 (OffersScreen).
 *
 * @param params - Configuration containing active step key, visibility state, and selection reset callback
 * @returns Element refs, layout handlers, and container scroll ref
 */
export const useBookingOffersTutorial = ({
    activeTutorialStep,
    isTutorialVisible = false,
    onResetSelection,
}: UseBookingOffersTutorialParams) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const firstOfferCardRef = useRef<View>(null);
    const offersSectionOffsetY = useRef<number>(0);

    const measureFirstOfferCardNow = useCallback(() => {
        firstOfferCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_offers_card', { x, y, width, height });
            }
        });
    }, []);

    const measureFirstOfferCard = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureFirstOfferCardNow();
    }, [measureFirstOfferCardNow]);

    useEffect(() => {
        return registerMeasureCallback('booking_offers_card', measureFirstOfferCardNow);
    }, [measureFirstOfferCardNow]);

    // Bidirectional auto-scroll for OffersScreen tour steps (active only when tutorial is visible)
    useEffect(() => {
        if (!isTutorialVisible) return;

        if (activeTutorialStep === 'booking_offers_card' || activeTutorialStep === 'booking_offers') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, offersSectionOffsetY.current - 16),
                animated: true,
            });
            const timer = setTimeout(measureFirstOfferCardNow, 250);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'booking_offers_calendar' || activeTutorialStep === 'booking_calendar') {
            scrollViewRef.current?.scrollTo({
                y: 0,
                animated: true,
            });
            requestTargetMeasurement('booking_offers_calendar');
        }
    }, [isTutorialVisible, activeTutorialStep, measureFirstOfferCardNow]);

    // Reset scroll to top and reset localSelectedId when tutorial is triggered or finished
    const prevTutorialVisible = useRef(isTutorialVisible);
    useEffect(() => {
        if (!prevTutorialVisible.current && isTutorialVisible) {
            onResetSelection?.();
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else if (prevTutorialVisible.current && !isTutorialVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = isTutorialVisible;
    }, [isTutorialVisible, onResetSelection]);

    const handleOffersContainerLayout = useCallback((e: LayoutChangeEvent) => {
        offersSectionOffsetY.current = e.nativeEvent.layout.y;
    }, []);

    return {
        scrollViewRef,
        firstOfferCardRef,
        measureFirstOfferCard,
        handleOffersContainerLayout,
    };
};

/* =========================================================================
   3. STEP 2 HOOK: DETAILS & DOCUMENTS (DetailsScreen.tsx)
   ========================================================================= */

/**
 * Configuration parameters for the DetailsScreen tutorial hook.
 */
export interface UseBookingDetailsTutorialParams {
    /** Currently active spotlight target identifier */
    activeTutorialStep?: string;
    /** Whether the tutorial modal overlay is currently visible */
    isTutorialVisible?: boolean;
}

/**
 * Hook to manage element measurement refs, layout callbacks, and auto-scrolling
 * for Step 2 (DetailsScreen).
 *
 * @param params - Configuration containing active step key and visibility state
 * @returns Element refs, layout handlers, and container scroll ref
 */
export const useBookingDetailsTutorial = ({
    activeTutorialStep,
    isTutorialVisible = false,
}: UseBookingDetailsTutorialParams) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const contactCardRef = useRef<View>(null);
    const firstDocCardRef = useRef<View>(null);
    const termsSectionRef = useRef<View>(null);
    const docsSectionOffsetY = useRef<number>(0);
    const termsSectionOffsetY = useRef<number>(0);

    const measureContactCardNow = useCallback(() => {
        contactCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_details_contact', { x, y, width, height });
            }
        });
    }, []);

    const measureFirstDocCardNow = useCallback(() => {
        firstDocCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_details_docs', { x, y, width, height });
            }
        });
    }, []);

    const measureTermsSectionNow = useCallback(() => {
        termsSectionRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_details_terms', { x, y, width, height });
            }
        });
    }, []);

    const measureContactCard = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureContactCardNow();
    }, [measureContactCardNow]);

    const measureFirstDocCard = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureFirstDocCardNow();
    }, [measureFirstDocCardNow]);

    const measureTermsSection = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureTermsSectionNow();
    }, [measureTermsSectionNow]);

    useEffect(() => {
        const unsubContact = registerMeasureCallback('booking_details_contact', measureContactCardNow);
        const unsubDocs = registerMeasureCallback('booking_details_docs', measureFirstDocCardNow);
        const unsubTerms = registerMeasureCallback('booking_details_terms', measureTermsSectionNow);
        return () => {
            unsubContact();
            unsubDocs();
            unsubTerms();
        };
    }, [measureContactCardNow, measureFirstDocCardNow, measureTermsSectionNow]);

    // Bidirectional auto-scroll for DetailsScreen tour steps (active only when tutorial is visible)
    useEffect(() => {
        if (!isTutorialVisible) return;

        if (activeTutorialStep === 'booking_details_contact') {
            scrollViewRef.current?.scrollTo({
                y: 0,
                animated: true,
            });
            const timer = setTimeout(measureContactCardNow, 250);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'booking_details_docs') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, docsSectionOffsetY.current - 16),
                animated: true,
            });
            const timer = setTimeout(measureFirstDocCardNow, 250);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'booking_details_terms') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, termsSectionOffsetY.current - 16),
                animated: true,
            });
            const timer = setTimeout(measureTermsSectionNow, 250);
            return () => clearTimeout(timer);
        }
    }, [isTutorialVisible, activeTutorialStep, measureContactCardNow, measureFirstDocCardNow, measureTermsSectionNow]);

    // Reset scroll to top when tutorial finishes / closes
    const prevTutorialVisible = useRef(isTutorialVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !isTutorialVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = isTutorialVisible;
    }, [isTutorialVisible]);

    const handleDocsSectionLayout = useCallback((e: LayoutChangeEvent) => {
        docsSectionOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureFirstDocCardNow();
        }
    }, [measureFirstDocCardNow]);

    const handleTermsSectionLayout = useCallback((e: LayoutChangeEvent) => {
        termsSectionOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureTermsSectionNow();
        }
    }, [measureTermsSectionNow]);

    return {
        scrollViewRef,
        contactCardRef,
        firstDocCardRef,
        termsSectionRef,
        measureContactCard,
        measureFirstDocCard,
        measureTermsSection,
        handleDocsSectionLayout,
        handleTermsSectionLayout,
    };
};

/* =========================================================================
   4. STEP 3 HOOK: STATUS OUTCOME (StatusScreen.tsx)
   ========================================================================= */

/**
 * Configuration parameters for the StatusScreen tutorial hook.
 */
export interface UseBookingStatusTutorialParams {
    /** Currently active spotlight target identifier */
    activeTutorialStep?: string;
    /** Whether the tutorial modal overlay is currently visible */
    isTutorialVisible?: boolean;
}

/**
 * Hook to manage element measurement refs, layout callbacks, and auto-scrolling
 * for Step 3 (StatusScreen).
 *
 * @param params - Configuration containing active step key and visibility state
 * @returns Element refs, layout handlers, and container scroll ref
 */
export const useBookingStatusTutorial = ({
    activeTutorialStep,
    isTutorialVisible = false,
}: UseBookingStatusTutorialParams) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const timelineCardRef = useRef<View>(null);
    const summaryCardRef = useRef<View>(null);
    const summarySectionOffsetY = useRef<number>(0);

    const measureTimelineCardNow = useCallback(() => {
        timelineCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_status_timeline', { x, y, width, height });
            }
        });
    }, []);

    const measureSummaryCardNow = useCallback(() => {
        summaryCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_status_summary', { x, y, width, height });
            }
        });
    }, []);

    const measureTimelineCard = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureTimelineCardNow();
    }, [measureTimelineCardNow]);

    const measureSummaryCard = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureSummaryCardNow();
    }, [measureSummaryCardNow]);

    useEffect(() => {
        const unsubTimeline = registerMeasureCallback('booking_status_timeline', measureTimelineCardNow);
        const unsubSummary = registerMeasureCallback('booking_status_summary', measureSummaryCardNow);
        return () => {
            unsubTimeline();
            unsubSummary();
        };
    }, [measureTimelineCardNow, measureSummaryCardNow]);

    // Bidirectional auto-scroll for StatusScreen tour steps (active only when tutorial is visible)
    useEffect(() => {
        if (!isTutorialVisible) return;

        if (
            activeTutorialStep === 'booking_status_card' ||
            activeTutorialStep === 'booking_status_timeline'
        ) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            const timer = setTimeout(measureTimelineCardNow, 250);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'booking_status_summary') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, summarySectionOffsetY.current - 16),
                animated: true,
            });
            const timer = setTimeout(measureSummaryCardNow, 250);
            return () => clearTimeout(timer);
        }
    }, [isTutorialVisible, activeTutorialStep, measureTimelineCardNow, measureSummaryCardNow]);

    // Reset scroll on tutorial finish
    const prevTutorialVisible = useRef(isTutorialVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !isTutorialVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = isTutorialVisible;
    }, [isTutorialVisible]);

    const handleSummarySectionLayout = useCallback((e: LayoutChangeEvent) => {
        summarySectionOffsetY.current = e.nativeEvent.layout.y;
    }, []);

    return {
        scrollViewRef,
        timelineCardRef,
        summaryCardRef,
        measureTimelineCard,
        measureSummaryCard,
        handleSummarySectionLayout,
    };
};
