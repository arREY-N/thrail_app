/**
 * @file usePaymentTutorial.ts
 * @description Modular feature hooks orchestrating the in-app walkthrough guides for the Payment flow.
 * Provides context-aware walkthroughs for Step 1 (First-Time Payment vs Resubmission Flow)
 * and Step 2 (Payment Status & Verification), encapsulating element refs, layout registrations,
 * on-demand measurements, and bidirectional auto-scrolling with settle timers.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    View,
} from 'react-native';

import {
    paymentResubmitTourSteps,
    paymentStatusTourSteps,
    paymentTourSteps,
} from '@/src/components/Tutorial/constants/paymentTour';
import { useTutorialGuide } from '@/src/components/Tutorial/hooks/useTutorialGuide';
import { type TutorialTourId } from '@/src/components/Tutorial/interfaces/Tutorial.types';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';

/**
 * Configuration parameters for the parent PaymentScreen tutorial controller hook.
 */
export interface UsePaymentTutorialParams {
    /** Active payment flow step (1 = Method, 2 = Status) */
    currentStep: number;
    /** Whether payment submission is currently in progress */
    isSubmitting: boolean;
    /** Whether gateway/verification polling is active */
    isWaitingForVerification: boolean;
    /** Whether the booking is currently in rejected payment verification state */
    isRejected?: boolean;
}

/**
 * Controller hook managing the tutorial guide lifecycle and active tour selection for PaymentScreen.
 *
 * @param params - Parameters containing current step number, loading/verification flags, and rejection state
 * @returns Tutorial state, active tour config, and replay handlers
 */
export const usePaymentTutorial = ({
    currentStep,
    isSubmitting,
    isWaitingForVerification,
    isRejected = false,
}: UsePaymentTutorialParams) => {
    const activeTourId: TutorialTourId = currentStep === 2 ? 'payment_status' : 'payment';
    const isTourEnabled = !isSubmitting && !isWaitingForVerification;

    const dynamicSteps = useMemo(() => {
        if (currentStep === 1) {
            return isRejected ? paymentResubmitTourSteps : paymentTourSteps;
        }
        return paymentStatusTourSteps;
    }, [currentStep, isRejected]);

    const tutorial = useTutorialGuide(activeTourId, isTourEnabled, dynamicSteps);

    return {
        tutorial,
        activeTutorialStep: tutorial.isVisible ? tutorial.currentStep?.targetSpotlight : undefined,
        isTutorialVisible: tutorial.isVisible,
    };
};

/**
 * Configuration parameters for the Manual QR Method screen tutorial hook.
 */
export interface UseManualQRMethodTutorialParams {
    /** Currently active spotlight target identifier */
    activeTutorialStep?: string;
    /** Whether the tutorial modal overlay is currently visible */
    isTutorialVisible?: boolean;
    /** Whether the booking payment verification was rejected */
    isRejected?: boolean;
}

/**
 * Hook to manage element measurement refs, layout callbacks, and auto-scrolling
 * for Step 1 (ManualQRMethodScreen).
 *
 * @param params - Configuration containing active step key, visibility state, and rejection status
 * @returns Element refs, layout handlers, and container scroll ref
 */
export const useManualQRMethodTutorial = ({
    activeTutorialStep,
    isTutorialVisible = false,
    isRejected = false,
}: UseManualQRMethodTutorialParams) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const rejectionBannerRef = useRef<View>(null);
    const qrCardRef = useRef<View>(null);
    const instructionsRef = useRef<View>(null);
    const receiptUploadRef = useRef<View>(null);
    const termsRef = useRef<View>(null);

    const currentScrollY = useRef<number>(0);
    const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const scrollDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const qrSectionOffsetY = useRef<number>(0);
    const instructionsSectionOffsetY = useRef<number>(0);
    const receiptSectionOffsetY = useRef<number>(0);
    const termsSectionOffsetY = useRef<number>(0);

    const measureRejectionBannerNow = useCallback(() => {
        rejectionBannerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_rejection_banner', { x, y, width, height });
            }
        });
    }, []);

    const measureQRCardNow = useCallback(() => {
        qrCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_qr_card', { x, y, width, height });
            }
        });
    }, []);

    const measureInstructionsNow = useCallback(() => {
        instructionsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_instructions', { x, y, width, height });
            }
        });
    }, []);

    const measureReceiptUploadNow = useCallback(() => {
        receiptUploadRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_receipt_upload', { x, y, width, height });
            }
        });
    }, []);

    const measureTermsNow = useCallback(() => {
        termsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_terms', { x, y, width, height });
            }
        });
    }, []);

    const measureActiveStepNow = useCallback((stepKey?: string) => {
        if (!stepKey) return;
        switch (stepKey) {
            case 'payment_rejection_banner':
                measureRejectionBannerNow();
                break;
            case 'payment_qr_card':
                measureQRCardNow();
                break;
            case 'payment_instructions':
                measureInstructionsNow();
                break;
            case 'payment_receipt_upload':
                measureReceiptUploadNow();
                break;
            case 'payment_terms':
                measureTermsNow();
                break;
            default:
                break;
        }
    }, [
        measureRejectionBannerNow,
        measureQRCardNow,
        measureInstructionsNow,
        measureReceiptUploadNow,
        measureTermsNow,
    ]);

    const clearAllTimers = useCallback(() => {
        activeTimersRef.current.forEach((timer) => clearTimeout(timer));
        activeTimersRef.current = [];
    }, []);

    const scheduleMeasurements = useCallback((stepKey?: string) => {
        clearAllTimers();
        if (!stepKey) return;
        const t1 = setTimeout(() => measureActiveStepNow(stepKey), 150);
        const t2 = setTimeout(() => measureActiveStepNow(stepKey), 350);
        const t3 = setTimeout(() => measureActiveStepNow(stepKey), 500);
        activeTimersRef.current = [t1, t2, t3];
    }, [clearAllTimers, measureActiveStepNow]);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        currentScrollY.current = e.nativeEvent.contentOffset.y;
        if (!isTutorialVisible || !activeTutorialStep) return;

        if (scrollDebounceTimerRef.current) {
            clearTimeout(scrollDebounceTimerRef.current);
        }
        scrollDebounceTimerRef.current = setTimeout(() => {
            measureActiveStepNow(activeTutorialStep);
        }, 80);
    }, [isTutorialVisible, activeTutorialStep, measureActiveStepNow]);

    const handleMomentumScrollEnd = useCallback(() => {
        if (!isTutorialVisible || !activeTutorialStep) return;
        measureActiveStepNow(activeTutorialStep);
    }, [isTutorialVisible, activeTutorialStep, measureActiveStepNow]);

    const handleScrollEndDrag = useCallback(() => {
        if (!isTutorialVisible || !activeTutorialStep) return;
        measureActiveStepNow(activeTutorialStep);
    }, [isTutorialVisible, activeTutorialStep, measureActiveStepNow]);

    // Register on-demand measurement callbacks with the global tutorial layout registry
    useEffect(() => {
        const cleanups = [
            registerMeasureCallback('payment_rejection_banner', measureRejectionBannerNow),
            registerMeasureCallback('payment_qr_card', measureQRCardNow),
            registerMeasureCallback('payment_instructions', measureInstructionsNow),
            registerMeasureCallback('payment_receipt_upload', measureReceiptUploadNow),
            registerMeasureCallback('payment_terms', measureTermsNow),
        ];

        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [
        measureRejectionBannerNow,
        measureQRCardNow,
        measureInstructionsNow,
        measureReceiptUploadNow,
        measureTermsNow,
    ]);

    // Bidirectional section auto-scroll with multi-stage settling measurements
    useEffect(() => {
        if (!isTutorialVisible || !activeTutorialStep) return;

        if (activeTutorialStep === 'payment_rejection_banner') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            scheduleMeasurements('payment_rejection_banner');
        } else if (activeTutorialStep === 'payment_qr_card') {
            const targetY = isRejected ? Math.max(0, qrSectionOffsetY.current - 16) : 0;
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
            scheduleMeasurements('payment_qr_card');
        } else if (activeTutorialStep === 'payment_instructions') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, instructionsSectionOffsetY.current - 16),
                animated: true,
            });
            scheduleMeasurements('payment_instructions');
        } else if (activeTutorialStep === 'payment_receipt_upload') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, receiptSectionOffsetY.current - 16),
                animated: true,
            });
            scheduleMeasurements('payment_receipt_upload');
        } else if (activeTutorialStep === 'payment_terms') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, termsSectionOffsetY.current - 16),
                animated: true,
            });
            scheduleMeasurements('payment_terms');
        }

        return () => {
            clearAllTimers();
        };
    }, [
        isTutorialVisible,
        activeTutorialStep,
        isRejected,
        scheduleMeasurements,
        clearAllTimers,
    ]);

    // Reset scroll position to top when tutorial finishes or is dismissed
    const prevTutorialVisible = useRef(isTutorialVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !isTutorialVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            currentScrollY.current = 0;
        }
        prevTutorialVisible.current = isTutorialVisible;
    }, [isTutorialVisible]);

    // Layout event handlers
    const handleRejectionBannerLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureRejectionBannerNow();
        }
    }, [measureRejectionBannerNow]);

    const handleQRSectionLayout = useCallback((e: LayoutChangeEvent) => {
        qrSectionOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureQRCardNow();
        }
    }, [measureQRCardNow]);

    const handleQRCardLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureQRCardNow();
        }
    }, [measureQRCardNow]);

    const handleInstructionsSectionLayout = useCallback((e: LayoutChangeEvent) => {
        instructionsSectionOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureInstructionsNow();
        }
    }, [measureInstructionsNow]);

    const handleInstructionsLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureInstructionsNow();
        }
    }, [measureInstructionsNow]);

    const handleReceiptSectionLayout = useCallback((e: LayoutChangeEvent) => {
        receiptSectionOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureReceiptUploadNow();
        }
    }, [measureReceiptUploadNow]);

    const handleTermsSectionLayout = useCallback((e: LayoutChangeEvent) => {
        termsSectionOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureTermsNow();
        }
    }, [measureTermsNow]);

    return {
        scrollViewRef,
        rejectionBannerRef,
        qrCardRef,
        instructionsRef,
        receiptUploadRef,
        termsRef,
        handleScroll,
        handleMomentumScrollEnd,
        handleScrollEndDrag,
        handlers: {
            handleRejectionBannerLayout,
            handleQRSectionLayout,
            handleQRCardLayout,
            handleInstructionsSectionLayout,
            handleInstructionsLayout,
            handleReceiptSectionLayout,
            handleTermsSectionLayout,
        },
    };
};

/**
 * Configuration parameters for the Payment Status screen tutorial hook.
 */
export interface UsePaymentStatusTutorialParams {
    /** Currently active spotlight target identifier */
    activeTutorialStep?: string;
    /** Whether the tutorial modal overlay is currently visible */
    isTutorialVisible?: boolean;
}

/**
 * Hook to manage element measurement refs, layout callbacks, and auto-scrolling
 * for Step 2 (StatusScreen).
 *
 * @param params - Configuration containing active step key and visibility state
 * @returns Element refs, layout handlers, and container scroll ref
 */
export const usePaymentStatusTutorial = ({
    activeTutorialStep,
    isTutorialVisible = false,
}: UsePaymentStatusTutorialParams) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const bannerRef = useRef<View>(null);
    const timelineRef = useRef<View>(null);
    const receiptRef = useRef<View>(null);

    const timelineOffsetY = useRef<number>(0);
    const receiptOffsetY = useRef<number>(0);

    const measureBannerNow = useCallback(() => {
        bannerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_status_banner', { x, y, width, height });
            }
        });
    }, []);

    const measureTimelineNow = useCallback(() => {
        timelineRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_status_timeline', { x, y, width, height });
            }
        });
    }, []);

    const measureReceiptNow = useCallback(() => {
        receiptRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_receipt_card', { x, y, width, height });
            }
        });
    }, []);

    // Register on-demand measurement callbacks with the global tutorial layout registry
    useEffect(() => {
        const cleanups = [
            registerMeasureCallback('payment_status_banner', measureBannerNow),
            registerMeasureCallback('payment_status_timeline', measureTimelineNow),
            registerMeasureCallback('payment_receipt_card', measureReceiptNow),
        ];

        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [measureBannerNow, measureTimelineNow, measureReceiptNow]);

    // Bidirectional auto-scroll with settling delay re-measurement
    useEffect(() => {
        if (!isTutorialVisible) return;

        if (activeTutorialStep === 'payment_status_banner' || activeTutorialStep === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            const timer = setTimeout(measureBannerNow, 250);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'payment_status_timeline') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, timelineOffsetY.current - 16),
                animated: true,
            });
            const timer = setTimeout(measureTimelineNow, 250);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'payment_receipt_card') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, receiptOffsetY.current - 16),
                animated: true,
            });
            const timer = setTimeout(measureReceiptNow, 250);
            return () => clearTimeout(timer);
        }
    }, [
        isTutorialVisible,
        activeTutorialStep,
        measureBannerNow,
        measureTimelineNow,
        measureReceiptNow,
    ]);

    // Reset scroll position to top when tutorial finishes or is dismissed
    const prevTutorialVisible = useRef(isTutorialVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !isTutorialVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = isTutorialVisible;
    }, [isTutorialVisible]);

    // Pre-warming layout event handlers guarded by isTutorialMeasurementActive()
    const handleBannerLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureBannerNow();
        }
    }, [measureBannerNow]);

    const handleTimelineLayout = useCallback((e: LayoutChangeEvent) => {
        timelineOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureTimelineNow();
        }
    }, [measureTimelineNow]);

    const handleReceiptLayout = useCallback((e: LayoutChangeEvent) => {
        receiptOffsetY.current = e.nativeEvent.layout.y;
        if (isTutorialMeasurementActive()) {
            measureReceiptNow();
        }
    }, [measureReceiptNow]);

    return {
        scrollViewRef,
        bannerRef,
        timelineRef,
        receiptRef,
        handlers: {
            handleBannerLayout,
            handleTimelineLayout,
            handleReceiptLayout,
        },
    };
};
