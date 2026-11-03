/**
 * @file useAdminOfferWriteTutorial.ts
 * @description Hook managing layout measurement, spotlight registration, autoscroll, and tutorial guide for Admin OfferWriteScreen.
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

export interface UseAdminOfferWriteTutorialParams {
    /** Flag indicating whether the OfferWriteScreen has finished loading */
    isReady: boolean;
}

/**
 * Encapsulates tutorial state, element measurement, and dynamic autoscroll
 * for the Admin Offer Write form (trail, pricing/pax, schedule, checklists, save footer).
 *
 * @param params - Configuration parameters including data readiness flag.
 * @returns Ref objects, layout event handlers, and tutorial controller.
 */
export const useAdminOfferWriteTutorial = ({
    isReady,
}: UseAdminOfferWriteTutorialParams) => {
    const tutorial = useTutorialGuide('admin_offer_write', isReady);

    const scrollViewRef = useRef<ScrollView>(null);
    const trailRef = useRef<View>(null);
    const pricingRef = useRef<View>(null);
    const scheduleRef = useRef<View>(null);
    const checklistsRef = useRef<View>(null);

    const pricingOffsetY = useRef<number>(240);
    const scheduleOffsetY = useRef<number>(540);
    const checklistsOffsetY = useRef<number>(800);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const measureTrailNow = useCallback(() => {
        trailRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_write_trail_dates', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measurePricingNow = useCallback(() => {
        pricingRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_write_pricing_pax', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureScheduleNow = useCallback(() => {
        scheduleRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_write_schedule', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureChecklistsNow = useCallback(() => {
        checklistsRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_write_checklists', { x, y, width: w, height: h });
            }
        });
    }, []);

    useEffect(() => {
        const u1 = registerMeasureCallback('admin_write_trail_dates', measureTrailNow);
        const u2 = registerMeasureCallback('admin_write_pricing_pax', measurePricingNow);
        const u3 = registerMeasureCallback('admin_write_schedule', measureScheduleNow);
        const u4 = registerMeasureCallback('admin_write_checklists', measureChecklistsNow);
        return () => {
            u1();
            u2();
            u3();
            u4();
        };
    }, [measureTrailNow, measurePricingNow, measureScheduleNow, measureChecklistsNow]);

    useEffect(() => {
        if (!tutorial.isVisible) return;
        const step = tutorial.currentStep?.targetSpotlight;
        if (!step) return;

        if (settleTimerRef.current) {
            clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
        }

        // Measure immediately for in-viewport targets
        requestTargetMeasurement(step);

        if (step === 'admin_write_trail_dates' || step === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else if (step === 'admin_write_pricing_pax') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, pricingOffsetY.current - 16),
                animated: true,
            });
        } else if (step === 'admin_write_schedule') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, scheduleOffsetY.current - 16),
                animated: true,
            });
        } else if (step === 'admin_write_checklists') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, checklistsOffsetY.current - 16),
                animated: true,
            });
        } else if (step === 'booking_footer') {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }

        // Single settled measurement lock at 250ms (once smooth scroll completes)
        settleTimerRef.current = setTimeout(() => {
            requestTargetMeasurement(step);
        }, 250);

        return () => {
            if (settleTimerRef.current) {
                clearTimeout(settleTimerRef.current);
                settleTimerRef.current = null;
            }
        };
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight]);

    const handleTrailLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureTrailNow();
    }, [measureTrailNow]);

    const handlePricingLayout = useCallback((y: number) => {
        pricingOffsetY.current = y;
        if (isTutorialMeasurementActive()) measurePricingNow();
    }, [measurePricingNow]);

    const handleScheduleLayout = useCallback((y: number) => {
        scheduleOffsetY.current = y;
        if (isTutorialMeasurementActive()) measureScheduleNow();
    }, [measureScheduleNow]);

    const handleChecklistsLayout = useCallback((y: number) => {
        checklistsOffsetY.current = y;
        if (isTutorialMeasurementActive()) measureChecklistsNow();
    }, [measureChecklistsNow]);

    return {
        scrollViewRef,
        trailRef,
        pricingRef,
        scheduleRef,
        checklistsRef,
        handleTrailLayout,
        handlePricingLayout,
        handleScheduleLayout,
        handleChecklistsLayout,
        tutorial,
    };
};
