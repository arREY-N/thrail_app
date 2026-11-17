/**
 * @file reviewTour.ts
 * @description Modular tutorial step configurations for the Post-Hike Review Screen (WriteReviewScreen).
 * Dynamically adapts between the 2-step trail review wizard (DIY / own-business hikes) and the
 * 3-step wizard (booked hikes with an external tour organizer): Ratings -> Details -> Organizer Review.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * Builds Phase 1 (Ratings) tutorial steps dynamically based on whether Step 3 (Organizer Review) is included.
 *
 * @param hasOrganizerStep - Whether the active review flow includes the Step 3 Organizer Review page
 * @returns {TutorialStep[]} Ordered tutorial steps for Step 1 (Ratings & Difficulty)
 */
export const getReviewRatingsTourSteps = (hasOrganizerStep: boolean): TutorialStep[] => [
    {
        id: 'review-ratings-step-1-stars',
        category: hasOrganizerStep
            ? 'Trail Ratings • 1 of 3 Steps'
            : 'Trail Ratings • 1 of 2 Steps',
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
        category: 'Trail Ratings • Next Step',
        targetSpotlight: 'review_next_btn',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Continue to Details',
        description: hasOrganizerStep
            ? 'Once you choose your star rating and select whether the trail felt Easy or Difficult, tap Next to write tips, upload trail photos, and rate your organizer in the final step.'
            : 'Once you choose your star rating and select whether the trail felt Easy or Difficult, tap Next to write tips and upload trail photos.',
        actionTip: 'Tap Next to proceed to written feedback and photos.',
    },
];

/**
 * Static fallback for Phase 1 (Ratings) registered in TUTORIAL_TOURS.
 */
export const reviewRatingsTourSteps: TutorialStep[] = getReviewRatingsTourSteps(false);

/**
 * Builds Phase 2 (Details) tutorial steps dynamically based on whether Step 3 (Organizer Review) follows.
 *
 * @param hasOrganizerStep - Whether tapping Next advances to Step 3 Organizer Review (true) or submits immediately (false)
 * @returns {TutorialStep[]} Ordered tutorial steps for Step 2 (Tips & Photos)
 */
export const getReviewDetailsTourSteps = (hasOrganizerStep: boolean): TutorialStep[] => [
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
    hasOrganizerStep
        ? {
              id: 'review-details-step-3-next',
              category: 'Trail Details • Step 3 of 3',
              targetSpotlight: 'review_next_btn',
              spotlightShape: 'rect',
              tooltipPlacement: 'top',
              title: 'Continue to Organizer Review',
              description:
                  'When your trail tips and photos are ready, tap Next to proceed to the final step where you can rate your tour organizer.',
              actionTip: 'Tap Next to review your trip organizer (optional).',
          }
        : {
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

/**
 * Static fallback for Phase 2 (Details) registered in TUTORIAL_TOURS.
 */
export const reviewDetailsTourSteps: TutorialStep[] = getReviewDetailsTourSteps(false);

/**
 * Step configuration for Phase 3 (Organizer Review) on WriteReviewScreen when reviewing a booked organizer.
 * Spotlights the 5-star organizer rating, organizer feedback + suggestion chips, and the Skip & Submit / Submit button.
 */
export const reviewOrganizerTourSteps: TutorialStep[] = [
    {
        id: 'review-organizer-step-1-rating',
        category: 'Organizer Review • Step 1 of 4',
        targetSpotlight: 'review_organizer_rating',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
        title: 'Rate Your Organizer',
        description:
            'Tap 1 to 5 stars to rate your experience with the tour organizer. This step is optional — you can leave it blank to skip or tap a selected star again to clear it.',
        actionTip: 'Select 1 to 5 stars if you want to rate the organizer.',
    },
    {
        id: 'review-organizer-step-2-feedback',
        category: 'Organizer Review • Step 2 of 4',
        targetSpotlight: 'review_organizer_feedback',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Share Organizer Feedback',
        description:
            'Write a short review about pacing, guide support, and pre-hike communication — or tap any quick suggestion chip below to pre-fill your feedback.',
        actionTip: 'Tap suggestion chips or type your experience.',
    },
    {
        id: 'review-organizer-step-3-photo',
        category: 'Organizer Review • Step 3 of 4',
        targetSpotlight: 'review_organizer_photo_upload',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Add Organizer Photos (Optional)',
        description:
            'Upload up to 5 photos showing the group meetup, logistics, or guiding experience with this tour partner. These stay separate from your trail photos.',
        actionTip: 'Tap to optionally add photos for your organizer review.',
    },
    {
        id: 'review-organizer-step-4-submit',
        category: 'Organizer Review • Step 4 of 4',
        targetSpotlight: 'review_submit_btn',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Submit or Skip & Submit',
        description:
            'Tap Skip & Submit if you left the organizer review blank and only want to publish your trail review, or fill in rating and feedback and tap Submit to save both.',
        actionTip: 'Tap Skip & Submit or Submit when you are ready to finish.',
    },
];

