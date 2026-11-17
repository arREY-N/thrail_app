/**
 * @file useWriteReviewTutorial.ts
 * @description Modular feature hook orchestrating the dynamic 2-phase or 3-phase tutorial guide for the Write Review Screen.
 * Provides step-aware walkthroughs for Step 1 (Ratings & Difficulty), Step 2 (Written Tips & Photos),
 * and optionally Step 3 (Organizer Review when reviewing a booked external tour organizer),
 * with context-aware replay support and strict mobile-only / creation-only gating.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';

import {
    getReviewDetailsTourSteps,
    getReviewRatingsTourSteps,
    reviewOrganizerTourSteps,
} from '@/src/components/Tutorial/constants';
import { useTutorialGuide } from '@/src/components/Tutorial/hooks/useTutorialGuide';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
} from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';

export interface UseWriteReviewTutorialParams {
    isEditMode: boolean;
    stepIndex: number;
    isLoading: boolean;
    hasOrganizerStep?: boolean;
}

/**
 * Hook to manage post-hike review creation tutorial walkthrough lifecycle, measurement callbacks, and target refs.
 *
 * @param params - Configuration parameters containing edit mode flag, active wizard step index, loading state, and organizer step availability
 * @returns Active tutorial state, target element refs, and onLayout event handlers
 */
export const useWriteReviewTutorial = ({
    isEditMode,
    stepIndex,
    isLoading,
    hasOrganizerStep = false,
}: UseWriteReviewTutorialParams) => {
    const isReady = Platform.OS !== 'web' && !isEditMode && !isLoading;

    const ratingsSteps = useMemo(
        () => getReviewRatingsTourSteps(hasOrganizerStep),
        [hasOrganizerStep]
    );
    const detailsSteps = useMemo(
        () => getReviewDetailsTourSteps(hasOrganizerStep),
        [hasOrganizerStep]
    );

    // Phase 1 (Ratings): active when on step 0
    const ratingsTutorial = useTutorialGuide(
        'review_ratings',
        isReady && stepIndex === 0,
        ratingsSteps
    );

    // Phase 2 (Details): active when on step 1
    const detailsTutorial = useTutorialGuide(
        'review_details',
        isReady && stepIndex === 1,
        detailsSteps
    );

    // Phase 3 (Organizer Review): active when on step 2 and organizer step is enabled
    const organizerTutorial = useTutorialGuide(
        'review_organizer',
        isReady && hasOrganizerStep && stepIndex === 2,
        reviewOrganizerTourSteps
    );

    const activeTutorial =
        stepIndex === 0
            ? ratingsTutorial
            : stepIndex === 1 || !hasOrganizerStep
                ? detailsTutorial
                : organizerTutorial;

    const starRatingRef = useRef<View>(null);
    const nextBtnRef = useRef<View>(null);
    const feedbackInputRef = useRef<View>(null);
    const photoUploadRef = useRef<View>(null);
    const submitBtnRef = useRef<View>(null);
    const organizerRatingRef = useRef<View>(null);
    const organizerFeedbackRef = useRef<View>(null);
    const organizerPhotoUploadRef = useRef<View>(null);

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

    const measureOrganizerRatingNow = useCallback(() => {
        organizerRatingRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_organizer_rating', { x, y, width, height });
            }
        });
    }, []);

    const measureOrganizerFeedbackNow = useCallback(() => {
        organizerFeedbackRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_organizer_feedback', { x, y, width, height });
            }
        });
    }, []);

    const measureOrganizerPhotoUploadNow = useCallback(() => {
        organizerPhotoUploadRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('review_organizer_photo_upload', { x, y, width, height });
            }
        });
    }, []);

    // Register on-demand measurement callbacks with the layout registry
    useEffect(() => {
        if (Platform.OS === 'web' || isEditMode) return;

        const cleanups = [
            registerMeasureCallback('review_star_rating', measureStarRatingNow),
            registerMeasureCallback('review_next_btn', measureNextBtnNow),
            registerMeasureCallback('review_feedback_input', measureFeedbackInputNow),
            registerMeasureCallback('review_photo_upload', measurePhotoUploadNow),
            registerMeasureCallback('review_submit_btn', measureSubmitBtnNow),
            registerMeasureCallback('review_organizer_rating', measureOrganizerRatingNow),
            registerMeasureCallback('review_organizer_feedback', measureOrganizerFeedbackNow),
            registerMeasureCallback('review_organizer_photo_upload', measureOrganizerPhotoUploadNow),
        ];

        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [
        isEditMode,
        measureStarRatingNow,
        measureNextBtnNow,
        measureFeedbackInputNow,
        measurePhotoUploadNow,
        measureSubmitBtnNow,
        measureOrganizerRatingNow,
        measureOrganizerFeedbackNow,
        measureOrganizerPhotoUploadNow,
    ]);

    // Re-measure footer button targets whenever the active step or step-3 availability changes
    useEffect(() => {
        if (Platform.OS === 'web' || isEditMode || !activeTutorial.isVisible) return;
        const activeSpotlight = activeTutorial.currentStep?.targetSpotlight;
        if (activeSpotlight) {
            requestTargetMeasurement(activeSpotlight);
        }
    }, [isEditMode, stepIndex, hasOrganizerStep, activeTutorial.isVisible, activeTutorial.currentStep?.targetSpotlight]);

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

    const handleOrganizerRatingLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureOrganizerRatingNow();
        }
    }, [measureOrganizerRatingNow]);

    const handleOrganizerFeedbackLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureOrganizerFeedbackNow();
        }
    }, [measureOrganizerFeedbackNow]);

    const handleOrganizerPhotoUploadLayout = useCallback(() => {
        if (isTutorialMeasurementActive()) {
            measureOrganizerPhotoUploadNow();
        }
    }, [measureOrganizerPhotoUploadNow]);

    const handleReplayTour = useCallback(() => {
        if (stepIndex === 0) {
            ratingsTutorial.onReplayTour();
        } else if (stepIndex === 1 || !hasOrganizerStep) {
            detailsTutorial.onReplayTour();
        } else {
            organizerTutorial.onReplayTour();
        }
    }, [stepIndex, hasOrganizerStep, ratingsTutorial, detailsTutorial, organizerTutorial]);

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
        organizerRatingRef,
        organizerFeedbackRef,
        organizerPhotoUploadRef,
        handlers: {
            handleStarRatingLayout,
            handleNextBtnLayout,
            handleFeedbackInputLayout,
            handlePhotoUploadLayout,
            handleSubmitBtnLayout,
            handleOrganizerRatingLayout,
            handleOrganizerFeedbackLayout,
            handleOrganizerPhotoUploadLayout,
        },
    };
};

