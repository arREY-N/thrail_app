/**
 * @file useAdminOfferListTutorial.ts
 * @description Hook managing layout measurement, spotlight registration, autoscroll, and tutorial guide for Admin OfferListScreen.
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

export interface UseAdminOfferListTutorialParams {
    /** Flag indicating whether the OfferListScreen has finished loading */
    isReady: boolean;
}

/**
 * Encapsulates tutorial state, element measurement, and autoscroll
 * for the Admin Offer List (search/filters header, first offer card, add-offer footer).
 *
 * @param params - Configuration parameters including data readiness flag.
 * @returns Ref objects, layout event handler, and tutorial controller.
 */
export const useAdminOfferListTutorial = ({
    isReady,
}: UseAdminOfferListTutorialParams) => {
    const tutorial = useTutorialGuide('admin_offer_list', isReady);

    const scrollViewRef = useRef<ScrollView>(null);
    const searchFiltersRef = useRef<View>(null);
    const firstOfferRef = useRef<View>(null);

    const measureFiltersNow = useCallback(() => {
        searchFiltersRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_offer_filters', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureFirstOfferNow = useCallback(() => {
        firstOfferRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_offer_card', { x, y, width: w, height: h });
            }
        });
    }, []);

    useEffect(() => {
        const u2 = registerMeasureCallback('admin_offer_filters', measureFiltersNow);
        const u3 = registerMeasureCallback('admin_offer_card', measureFirstOfferNow);
        return () => {
            u2();
            u3();
        };
    }, [measureFiltersNow, measureFirstOfferNow]);

    useEffect(() => {
        if (!tutorial.isVisible) return;
        const stepTarget = tutorial.currentStep?.targetSpotlight;
        if (stepTarget) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            requestTargetMeasurement(stepTarget);
        }
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight]);

    const handleFirstOfferLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) measureFirstOfferNow();
    }, [measureFirstOfferNow]);

    return {
        scrollViewRef,
        searchFiltersRef,
        firstOfferRef,
        handleFirstOfferLayout,
        tutorial,
    };
};

