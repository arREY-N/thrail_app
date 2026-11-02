/**
 * @file Tutorial.ts
 * @description Public domain facade for the global In-App Tutorial architecture.
 * Mirrors Toast.ts and backend entity facade standards.
 */

// TYPES
export * from '@/src/components/Tutorial/interfaces/Tutorial.types';

// CORE HOOKS
export { useTutorialGuide } from '@/src/components/Tutorial/hooks/useTutorialGuide';

// FEATURE-SPECIFIC SCREEN WALKTHROUGH HOOKS
// Navigation Domain
export { useNavigationTutorial } from '@/src/components/Tutorial/hooks/navigation/useNavigationTutorial';
export { useHikeRecordingTutorial } from '@/src/components/Tutorial/hooks/navigation/useHikeRecordingTutorial';
export { useWriteReviewTutorial } from '@/src/components/Tutorial/hooks/navigation/useWriteReviewTutorial';

// Payment Domain
export {
    usePaymentTutorial,
    useManualQRMethodTutorial,
    usePaymentStatusTutorial,
} from '@/src/components/Tutorial/hooks/payment/usePaymentTutorial';
export type {
    UsePaymentTutorialParams,
    UseManualQRMethodTutorialParams,
    UsePaymentStatusTutorialParams,
} from '@/src/components/Tutorial/hooks/payment/usePaymentTutorial';

// Booking Domain
export {
    useBookingTutorial,
    useBookingOffersTutorial,
    useBookingDetailsTutorial,
    useBookingStatusTutorial,
} from '@/src/components/Tutorial/hooks/booking/useBookingTutorial';
export type {
    UseBookingTutorialParams,
    UseBookingOffersTutorialParams,
    UseBookingDetailsTutorialParams,
    UseBookingStatusTutorialParams,
} from '@/src/components/Tutorial/hooks/booking/useBookingTutorial';
export { useMyBookingDetailsTutorial } from '@/src/components/Tutorial/hooks/booking/useMyBookingDetailsTutorial';
export type { UseMyBookingDetailsTutorialParams } from '@/src/components/Tutorial/hooks/booking/useMyBookingDetailsTutorial';

// Home Domain
export { useHomeTutorial } from '@/src/components/Tutorial/hooks/home/useHomeTutorial';
export type { UseHomeTutorialParams } from '@/src/components/Tutorial/hooks/home/useHomeTutorial';

// Shared Modals Domain
export { useLegalTermsTutorial } from '@/src/components/Tutorial/hooks/modals/useLegalTermsTutorial';
export type { UseLegalTermsTutorialParams } from '@/src/components/Tutorial/hooks/modals/useLegalTermsTutorial';
export { useEmergencyModalTutorial } from '@/src/components/Tutorial/hooks/modals/useEmergencyModalTutorial';
export type { UseEmergencyModalTutorialParams } from '@/src/components/Tutorial/hooks/modals/useEmergencyModalTutorial';

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
