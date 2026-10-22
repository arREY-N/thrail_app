/**
 * @file Tutorial.ts
 * @description Public domain facade for the global In-App Tutorial architecture.
 * Mirrors Toast.ts and backend entity facade standards.
 */

// TYPES
export * from '@/src/components/Tutorial/interfaces/Tutorial.types';

// HOOKS
export { useTutorialGuide } from '@/src/components/Tutorial/hooks/useTutorialGuide';

// CONFIG REGISTRY
export { createReplayHelpStep, TUTORIAL_TOURS } from '@/src/components/Tutorial/constants';

// LAYOUT REGISTRY
export {
    getTutorialLayout,
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
    subscribeTutorialLayouts,
} from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';
export type { TargetElementLayout } from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';

// PRESENTATION COMPONENTS
export {
    default as CustomTutorialModal,
    TutorialHelpButton,
    default as TutorialOverlayModal,
} from '@/src/components/CustomTutorialModal';
export type {
    CustomTutorialModalProps,
    TutorialHelpButtonProps,
} from '@/src/components/CustomTutorialModal';
