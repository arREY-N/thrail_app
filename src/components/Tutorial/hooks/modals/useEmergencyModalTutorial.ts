/**
 * @file useEmergencyModalTutorial.ts
 * @description Hook managing layout measurement, spotlight registration, and tutorial guide for EmergencyModal.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import {
    emergencyModalOnlySteps,
    emergencyModalUnifiedSteps,
} from '../../constants';
import {
    registerMeasureCallback,
    registerTutorialLayout,
} from '../../utils/tutorialLayoutRegistry';
import { useTutorialGuide } from '../useTutorialGuide';

export interface UseEmergencyModalTutorialParams {
    /** Whether the modal is requested to be visible by parent prop */
    visible: boolean;
    /** Whether the modal is actively rendered in the React tree */
    renderModal: boolean;
    /** Operating mode ('unified' includes primary phone verification, 'emergency_only' excludes it) */
    mode?: 'emergency_only' | 'unified';
    /** Ref to modal inner scrollview to sync scroll position on first steps */
    scrollViewRef: React.RefObject<ScrollView | null>;
}

/**
 * Encapsulates tutorial state, element measurement, dynamic step definitions,
 * and spotlight coordinates for EmergencyModal.
 *
 * @param params - Modal state, display mode, and scrollview ref.
 * @returns Node refs for element attachment and tutorial controller.
 */
export const useEmergencyModalTutorial = ({
    visible,
    renderModal,
    mode,
    scrollViewRef,
}: UseEmergencyModalTutorialParams) => {
    const phoneInputRef = useRef<View>(null);
    const searchAccountRef = useRef<View>(null);
    const manualContactRef = useRef<View>(null);
    const saveBtnRef = useRef<View>(null);

    const dynamicTourSteps = useMemo(() => {
        const isUnified = mode === 'unified';
        return isUnified ? emergencyModalUnifiedSteps : emergencyModalOnlySteps;
    }, [mode]);

    const tutorial = useTutorialGuide('emergency_modal', visible && renderModal, dynamicTourSteps);

    const measurePhoneNow = useCallback(() => {
        phoneInputRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_user_phone', { x, y, width, height });
            }
        });
    }, []);

    const measureSearchAccountNow = useCallback(() => {
        searchAccountRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_search_account', { x, y, width, height });
            }
        });
    }, []);

    const measureManualContactNow = useCallback(() => {
        manualContactRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_manual_contact', { x, y, width, height });
            }
        });
    }, []);

    const measureSaveBtnNow = useCallback(() => {
        saveBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_save_btn', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const unsubPhone = registerMeasureCallback('emergency_user_phone', measurePhoneNow);
        const unsubSearch = registerMeasureCallback('emergency_search_account', measureSearchAccountNow);
        const unsubManual = registerMeasureCallback('emergency_manual_contact', measureManualContactNow);
        const unsubSave = registerMeasureCallback('emergency_save_btn', measureSaveBtnNow);
        return () => {
            unsubPhone();
            unsubSearch();
            unsubManual();
            unsubSave();
        };
    }, [measurePhoneNow, measureSearchAccountNow, measureManualContactNow, measureSaveBtnNow]);

    useEffect(() => {
        if (visible && renderModal && tutorial.isVisible) {
            const stepTarget = tutorial.currentStep?.targetSpotlight;
            if (stepTarget === 'emergency_user_phone' || stepTarget === 'emergency_search_account') {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
            const timer = setTimeout(() => {
                measurePhoneNow();
                measureSearchAccountNow();
                measureManualContactNow();
                measureSaveBtnNow();
            }, 260);
            return () => clearTimeout(timer);
        }
    }, [
        visible,
        renderModal,
        tutorial.isVisible,
        tutorial.currentStepIndex,
        tutorial.currentStep?.targetSpotlight,
        measurePhoneNow,
        measureSearchAccountNow,
        measureManualContactNow,
        measureSaveBtnNow,
        scrollViewRef,
    ]);

    return {
        phoneInputRef,
        searchAccountRef,
        manualContactRef,
        saveBtnRef,
        tutorial,
    };
};
