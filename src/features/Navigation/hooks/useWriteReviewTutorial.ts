/**
 * @file useWriteReviewTutorial.ts
 * @description Modular feature hook orchestrating the 2-phase tutorial guide for the Write Review Screen.
 * Provides separate, step-aware walkthroughs for Step 1 (Ratings & Difficulty) and Step 2 (Written Tips & Photos),
 * with context-aware replay support and strict mobile-only / creation-only gating.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';

interface UseWriteReviewTutorialParams {
    isEditMode: boolean;
    stepIndex: number;
    isLoading: boolean;
}

/**
 * Hook to manage post-hike review creation tutorial walkthrough lifecycle, measurement callbacks, and target refs.
 *
 * @param params - Configuration parameters containing edit mode flag, active wizard step index, and loading state
 * @returns Active tutorial state, target element refs, and onLayout event handlers
 */
export const useWriteReviewTutorial = ({
    isEditMode,
    stepIndex,
    isLoading,
}: UseWriteReviewTutorialParams) => {
    const isReady = Platform.OS !== 'web' && !isEditMode && !isLoading;

    // Phase 1 (Ratings): active when on step 0
    const ratingsTutorial = useTutorialGuide('review_ratings', isReady && stepIndex === 0);

    // Phase 2 (Details): active when on step 1
    const detailsTutorial = useTutorialGuide('review_details', isReady && stepIndex === 1);

    const activeTutorial = stepIndex === 0 ? ratingsTutorial : detailsTutorial;

    const starRatingRef = useRef<View>(null);
    const nextBtnRef = useRef<View>(null);
    const feedbackInputRef = useRef<View>(null);
    const photoUploadRef = useRef<View>(null);
    const submitBtnRef = useRef<View>(null);

    const measureStarRatingNow = useCallback(() => {
        starRatingRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_star_rating', { x, y, width, height });
            }
        });
    }, []);

    const measureNextBtnNow = useCallback(() => {
        nextBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_next_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureFeedbackInputNow = useCallback(() => {
        feedbackInputRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_feedback_input', { x, y, width, height });
            }
        });
    }, []);

    const measurePhotoUploadNow = useCallback(() => {
        photoUploadRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_photo_upload', { x, y, width, height });
            }
        });
    }, []);

    const measureSubmitBtnNow = useCallback(() => {
        submitBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_submit_btn', { x, y, width, height });
            }
        });
    }, []);

    // Register on-demand measurement callbacks with the layout registry
    useEffect(() => {
        if (Platform.OS === 'web' || isEditMode) return;

        registerMeasureCallback('review_star_rating', measureStarRatingNow);
        registerMeasureCallback('review_next_btn', measureNextBtnNow);
        registerMeasureCallback('review_feedback_input', measureFeedbackInputNow);
        registerMeasureCallback('review_photo_upload', measurePhotoUploadNow);
        registerMeasureCallback('review_submit_btn', measureSubmitBtnNow);
    }, [
        isEditMode,
        measureStarRatingNow,
        measureNextBtnNow,
        measureFeedbackInputNow,
        measurePhotoUploadNow,
        measureSubmitBtnNow,
    ]);

    // Fast layout pre-warming handlers
    const handleStarRatingLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureStarRatingNow();
        }
    }, [measureStarRatingNow]);

    const handleNextBtnLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureNextBtnNow();
        }
    }, [measureNextBtnNow]);

    const handleFeedbackInputLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureFeedbackInputNow();
        }
    }, [measureFeedbackInputNow]);

    const handlePhotoUploadLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measurePhotoUploadNow();
        }
    }, [measurePhotoUploadNow]);

    const handleSubmitBtnLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureSubmitBtnNow();
        }
    }, [measureSubmitBtnNow]);

    const handleReplayTour = useCallback(() => {
        if (stepIndex === 0) {
            ratingsTutorial.onReplayTour();
        } else {
            detailsTutorial.onReplayTour();
        }
    }, [stepIndex, ratingsTutorial, detailsTutorial]);

    return {
        tutorial: {
            isVisible: activeTutorial.isVisible,
            currentStep: activeTutorial.currentStep,
            currentStepIndex: activeTutorial.currentStepIndex,
            totalSteps: activeTutorial.totalSteps,
            tourConfig: activeTutorial.tourConfig,
            onNextStep: activeTutorial.onNextStep,
            onPrevStep: activeTutorial.onPrevStep,
            onSkipTour: activeTutorial.onSkipTour,
            onReplayTour: handleReplayTour,
            hasGuide: !isEditMode && Platform.OS !== 'web',
        },
        starRatingRef,
        nextBtnRef,
        feedbackInputRef,
        photoUploadRef,
        submitBtnRef,
        handlers: {
            handleStarRatingLayout,
            handleNextBtnLayout,
            handleFeedbackInputLayout,
            handlePhotoUploadLayout,
            handleSubmitBtnLayout,
        },
    };
};

