/**
 * @file useLegalTermsTutorial.ts
 * @description Hook managing layout measurement, spotlight registration, and tutorial guide for LegalTermsModal.
 */

import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from '../../utils/tutorialLayoutRegistry';
import { useTutorialGuide } from '../useTutorialGuide';

export interface UseLegalTermsTutorialParams {
    /** Whether the modal is requested to be visible by parent prop */
    visible: boolean;
    /** Whether the modal is actively rendered in the React tree */
    renderModal: boolean;
}

/**
 * Encapsulates tutorial state, element measurement, and spotlight coordinates
 * for the LegalTermsModal bottom sheet.
 *
 * @param params - Visibility and render state flags.
 * @returns Ref objects, layout event handlers, and tutorial controller.
 */
export const useLegalTermsTutorial = ({
    visible,
    renderModal,
}: UseLegalTermsTutorialParams) => {
    const tabsContainerRef = useRef<View>(null);
    const actionButtonWrapperRef = useRef<View>(null);

    const tutorial = useTutorialGuide('legal_terms', visible && renderModal);

    const measureLegalTabsNow = useCallback(() => {
        tabsContainerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('legal_tabs', { x, y, width, height });
            }
        });
    }, []);

    const measureActionButtonNow = useCallback(() => {
        actionButtonWrapperRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('legal_scroll_bottom', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const unregTabs = registerMeasureCallback('legal_tabs', measureLegalTabsNow);
        const unregBtn = registerMeasureCallback('legal_scroll_bottom', measureActionButtonNow);
        return () => {
            unregTabs();
            unregBtn();
        };
    }, [measureLegalTabsNow, measureActionButtonNow]);

    const handleTabsLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureLegalTabsNow();
    }, [measureLegalTabsNow]);

    const handleActionButtonLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureActionButtonNow();
    }, [measureActionButtonNow]);

    useEffect(() => {
        if (visible && renderModal && tutorial.isVisible) {
            const timer = setTimeout(() => {
                measureLegalTabsNow();
                measureActionButtonNow();
            }, 260);
            return () => clearTimeout(timer);
        }
    }, [
        visible,
        renderModal,
        tutorial.isVisible,
        tutorial.currentStepIndex,
        measureLegalTabsNow,
        measureActionButtonNow,
    ]);

    return {
        tabsContainerRef,
        actionButtonWrapperRef,
        handleTabsLayout,
        handleActionButtonLayout,
        tutorial,
    };
};

