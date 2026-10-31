/**
 * @file reviewTour.ts
 * @description Modular tutorial step configurations for the Post-Hike Review Screen (WriteReviewScreen).
 * Guides first-time hikers through the 2-step review wizard: Step 1 (Ratings & Difficulty) and Step 2 (Written Tips & Photos).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * Step configuration for Phase 1 (Ratings) on WriteReviewScreen.
 * Spotlights the overall 5-star rating bar and the Next footer button.
 */
export const reviewRatingsTourSteps: TutorialStep[] = [
    {
        id: 'review-ratings-step-1-stars',
        category: 'Trail Ratings • Step 1 of 2',
        targetSpotlight: 'review_star_rating',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
        title: 'Rate Your Hike',
        description:
            'Tap a star from 1 to 5 to rate your overall experience on this trail. Giving a rating unlocks difficulty and trail factor questions below.',
        actionTip: 'Tap 1 to 5 stars to share how much you enjoyed the climb.',
    },
    {
        id: 'review-ratings-step-2-next',
        category: 'Trail Ratings • Step 2 of 2',
        targetSpotlight: 'review_next_btn',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Continue to Details',
        description:
            'Once you choose your star rating and select whether the trail felt Easy or Difficult, tap Next to write tips and upload trail photos.',
        actionTip: 'Tap Next to proceed to written feedback and photos.',
    },
];

/**
 * Step configuration for Phase 2 (Details) on WriteReviewScreen.
 * Spotlights the thoughts & tips input, the photo upload card, and the Submit footer button.
 */
export const reviewDetailsTourSteps: TutorialStep[] = [
    {
        id: 'review-details-step-1-feedback',
        category: 'Trail Details • Step 1 of 3',
        targetSpotlight: 'review_feedback_input',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
        title: 'Share Tips & Advice',
        description:
            'Type helpful advice for fellow hikers! You can mention current trail conditions, muddy spots, water source availability, or gear suggestions.',
        actionTip: 'Type your thoughts and recommendations here.',
    },
    {
        id: 'review-details-step-2-photos',
        category: 'Trail Details • Step 2 of 3',
        targetSpotlight: 'review_photo_upload',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Add Trail Photos',
        description:
            'Add up to 5 photos from your adventure! Photos of trail markers, summits, or scenic spots help others know what to expect on the trail.',
        actionTip: 'Tap to select photos from your device gallery.',
    },
    {
        id: 'review-details-step-3-submit',
        category: 'Trail Details • Step 3 of 3',
        targetSpotlight: 'review_submit_btn',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Submit Your Review',
        description:
            'When you are satisfied with your review, tap Submit! Your review will be published to the community and help personalize future trail recommendations.',
        actionTip: 'Tap Submit to share your trail experience with the community.',
    },
];

