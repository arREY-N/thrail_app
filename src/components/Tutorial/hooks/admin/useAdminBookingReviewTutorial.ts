/**
 * @file useAdminBookingReviewTutorial.ts
 * @description Hook managing tab-aware tour steps, layout measurement, autoscroll, and tutorial guide for Admin ReviewScreen.
 * Features 60fps mobile performance optimizations, coalesced settle timers, and dynamic 5-vs-6 step generation.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { getAdminBookingReviewSteps } from '../../constants/adminBookingReviewTour';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
} from '../../utils/tutorialLayoutRegistry';
import { useTutorialGuide } from '../useTutorialGuide';

export interface UseAdminBookingReviewTutorialParams {
    /** Flag indicating the screen finished loading and a booking is available */
    isReady: boolean;
    /** Currently active review tab id (e.g. 'documents' | 'payment' | 'cancellation' | 'reschedule') */
    activeTab: string;
    /** Whether the screen is rendered in the wide (split-column) layout */
    isWide: boolean;
    /** Whether actionable decision buttons currently exist on the screen for this tab */
    hasActiveActions?: boolean;
}

/**
 * Encapsulates tab-aware tutorial state, element measurement,
 * and mobile autoscroll for the Admin Booking Review screen.
 *
 * @param params - Readiness flag, active tab, layout mode, and action presence.
 * @returns Ref objects, layout event handlers, and tutorial controller.
 */
export const useAdminBookingReviewTutorial = ({
    isReady,
    activeTab,
    isWide,
    hasActiveActions = false,
}: UseAdminBookingReviewTutorialParams) => {
    const dynamicTourSteps = useMemo(() => {
        return getAdminBookingReviewSteps(activeTab, hasActiveActions, isWide);
    }, [activeTab, hasActiveActions, isWide]);

    const tutorial = useTutorialGuide('admin_booking_review', isReady, dynamicTourSteps);

    const scrollViewRef = useRef<ScrollView>(null);
    const leftColRef = useRef<View>(null);
    const hikerCardRef = useRef<View>(null);
    const contactsCardRef = useRef<View>(null);
    const activityLogRef = useRef<View>(null);
    const tabBarRef = useRef<View>(null);
    const contentRef = useRef<View>(null);
    const firstCardRef = useRef<View>(null);
    const decisionRef = useRef<View>(null);

    // Dynamic vertical layout offsets for smooth mobile scrolling
    const contactsOffsetY = useRef<number>(200);
    const activityLogOffsetY = useRef<number>(600);
    const tabBarOffsetY = useRef<number>(360);
    const decisionOffsetY = useRef<number>(800);

    const measureHikerCardNow = useCallback(() => {
        const targetRef = hikerCardRef.current ? hikerCardRef : leftColRef;
        targetRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_hiker_card', { x, y, width: w, height: h });
                registerTutorialLayout('admin_review_profile', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureContactsCardNow = useCallback(() => {
        contactsCardRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_contacts_card', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureActivityLogNow = useCallback(() => {
        activityLogRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_activity_log', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureTabsNow = useCallback(() => {
        tabBarRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_tabs', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureContentNow = useCallback(() => {
        const targetRef = (activeTab === 'documents' && firstCardRef.current) ? firstCardRef : contentRef;
        targetRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_tab_content', { x, y, width: w, height: h });
                registerTutorialLayout('admin_review_content', { x, y, width: w, height: h });
            }
        });
    }, [activeTab]);

    const measureDecisionNow = useCallback(() => {
        if (!decisionRef.current) return;
        decisionRef.current.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_decision', { x, y, width: w, height: h });
                registerTutorialLayout('booking_footer', { x, y, width: w, height: h });
            }
        });
    }, []);

    useEffect(() => {
        const u1 = registerMeasureCallback('admin_review_hiker_card', measureHikerCardNow);
        const u2 = registerMeasureCallback('admin_review_profile', measureHikerCardNow);
        const u3 = registerMeasureCallback('admin_review_contacts_card', measureContactsCardNow);
        const u4 = registerMeasureCallback('admin_review_activity_log', measureActivityLogNow);
        const u5 = registerMeasureCallback('admin_review_tabs', measureTabsNow);
        const u6 = registerMeasureCallback('admin_review_tab_content', measureContentNow);
        const u7 = registerMeasureCallback('admin_review_content', measureContentNow);
        const u8 = registerMeasureCallback('admin_review_decision', measureDecisionNow);
        const u9 = registerMeasureCallback('booking_footer', measureDecisionNow);

        return () => {
            u1();
            u2();
            u3();
            u4();
            u5();
            u6();
            u7();
            u8();
            u9();
        };
    }, [
        measureHikerCardNow,
        measureContactsCardNow,
        measureActivityLogNow,
        measureTabsNow,
        measureContentNow,
        measureDecisionNow,
    ]);

    // Synchronized autoscroll & settle timing (responsive to Web 2-column vs. Mobile 1-column layouts)
    useEffect(() => {
        if (!tutorial.isVisible) return;
        const step = tutorial.currentStep?.targetSpotlight;
        if (!step) return;

        // Perform immediate measurement for already-visible elements
        requestTargetMeasurement(step);

        if (step === 'admin_review_hiker_card' || step === 'admin_review_profile' || step === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else if (step === 'admin_review_contacts_card') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, contactsOffsetY.current - 16),
                animated: true,
            });
        } else if (step === 'admin_review_tabs') {
            // On wide Web screens, the tabs are at the top of the right column (y: 0).
            // On mobile, the tabs sit below the hiker profile and contacts card.
            const targetY = isWide ? 0 : Math.max(0, tabBarOffsetY.current - 16);
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        } else if (step === 'admin_review_tab_content' || step === 'admin_review_content') {
            const targetY = isWide ? 0 : Math.max(0, tabBarOffsetY.current - 16);
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        } else if (step === 'admin_review_activity_log') {
            // On wide Web screens, ActivityLog is in the left column under Contacts.
            // On mobile screens, ActivityLog is at the bottom of the page below Tab Content.
            if (isWide) {
                scrollViewRef.current?.scrollTo({
                    y: Math.max(0, activityLogOffsetY.current - 16),
                    animated: true,
                });
            } else {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }
        } else if (step === 'admin_review_decision' || step === 'booking_footer') {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }

        // Single settled measurement lock at 250ms (once smooth scroll completes)
        const settleTimer = setTimeout(() => {
            requestTargetMeasurement(step);
        }, 250);

        return () => {
            clearTimeout(settleTimer);
        };
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight, isWide]);

    const handleHikerCardLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureHikerCardNow();
    }, [measureHikerCardNow]);

    const handleContactsCardLayout = useCallback((y: number) => {
        contactsOffsetY.current = y;
        if (isTutorialMeasurementActive()) measureContactsCardNow();
    }, [measureContactsCardNow]);

    const handleActivityLogLayout = useCallback((y: number) => {
        activityLogOffsetY.current = y;
        if (isTutorialMeasurementActive()) measureActivityLogNow();
    }, [measureActivityLogNow]);

    const handleProfileLayout = useCallback((height: number) => {
        if (!isWide) {
            tabBarOffsetY.current = height + 16;
        }
        if (isTutorialMeasurementActive()) measureHikerCardNow();
    }, [isWide, measureHikerCardNow]);

    const handleTabsLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureTabsNow();
    }, [measureTabsNow]);

    const handleContentLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureContentNow();
    }, [measureContentNow]);

    const handleDecisionLayout = useCallback((y?: number) => {
        if (typeof y === 'number') decisionOffsetY.current = y;
        if (isTutorialMeasurementActive()) measureDecisionNow();
    }, [measureDecisionNow]);

    return {
        scrollViewRef,
        leftColRef,
        hikerCardRef,
        contactsCardRef,
        activityLogRef,
        tabBarRef,
        contentRef,
        firstCardRef,
        decisionRef,
        handleHikerCardLayout,
        handleContactsCardLayout,
        handleActivityLogLayout,
        handleProfileLayout,
        handleTabsLayout,
        handleContentLayout,
        handleDecisionLayout,
        tutorial,
    };
};
