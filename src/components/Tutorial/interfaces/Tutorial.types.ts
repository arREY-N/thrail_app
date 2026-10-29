/**
 * @file Tutorial.types.ts
 * @description Type definitions for the global In-App Tutorial architecture in Thrail.
 */

import { IconLibrary } from '@/src/types/ui.types';

/**
 * Unique identifiers for each screen/workflow tutorial module.
 */
export type TutorialTourId =
    | 'tabs'
    | 'booking'
    | 'booking_offers'
    | 'booking_details'
    | 'booking_status'
    | 'my_booking_details'
    | 'legal_terms'
    | 'payment'
    | 'payment_status'
    | 'emergency_modal'
    | 'admin_dashboard'
    | 'admin_offer_list'
    | 'admin_offer_write'
    | 'admin_offer_write_step2'
    | 'admin_offer_view'
    | 'admin_booking_review'
    | 'navigation_booked'
    | 'navigation_diy'
    | 'recording_booked'
    | 'recording_diy';

/**
 * Visual style variant for the simulated UI target inside the coded callout preview banner.
 */
export type CalloutTargetVariant =
    | 'primary_button'
    | 'secondary_button'
    | 'tab_pill'
    | 'status_chip'
    | 'card_row'
    | 'replay_help_badge';

/**
 * Configuration for the coded visual callout banner displayed at the top of each tutorial step card.
 *
 * @param badgeText - Short category or location label (e.g., "Bottom Navigation â€¢ Tab 1 of 5")
 * @param targetLabel - Text inside the simulated button/element being highlighted
 * @param targetIcon - Icon name from @expo/vector-icons
 * @param targetIconLibrary - Icon family library name
 * @param targetVariant - Visual style of the simulated interactive target
 * @param helperChips - Optional 2-3 mini feature pills showing what is inside that screen/section
 */
export interface TutorialCalloutPreview {
    badgeText: string;
    targetLabel: string;
    targetIcon: string;
    targetIconLibrary: IconLibrary;
    targetVariant: CalloutTargetVariant;
    helperChips?: string[];
}

export type TargetSpotlightType =
    | 'tab_0'
    | 'tab_1'
    | 'tab_2'
    | 'tab_3'
    | 'tab_4'
    | 'header_help'
    | 'header_back'
    | 'admin_action_0'
    | 'admin_action_1'
    | 'admin_action_2'
    | 'content_top'
    | 'content_center'
    | 'content_bottom'
    | 'booking_calendar'
    | 'booking_offers'
    | 'booking_footer'
    | 'booking_offers_calendar'
    | 'booking_offers_card'
    | 'booking_offers_footer'
    | 'booking_details_contact'
    | 'booking_details_docs'
    | 'booking_details_terms'
    | 'booking_details_waiver'
    | 'booking_status_card'
    | 'booking_status_timeline'
    | 'booking_status_summary'
    | 'booking_status_primary'
    | 'booking_status_secondary'
    | 'my_booking_quick_info'
    | 'my_booking_status_tracker'
    | 'my_booking_documents'
    | 'my_booking_accordions'
    | 'my_booking_payment_summary'
    | 'legal_tabs'
    | 'legal_scroll_bottom'
    | 'payment_options'
    | 'payment_wallet'
    | 'payment_terms'
    | 'payment_status_banner'
    | 'payment_receipt_card'
    | 'admin_dash_overview'
    | 'admin_offer_add_btn'
    | 'admin_offer_filters'
    | 'admin_offer_card'
    | 'admin_write_trail_dates'
    | 'admin_write_schedule'
    | 'admin_write_pricing_pax'
    | 'admin_write_checklists'
    | 'admin_view_summary'
    | 'admin_view_filters'
    | 'admin_view_booking_card'
    | 'admin_review_profile'
    | 'admin_review_tabs'
    | 'admin_review_content'
    | 'admin_review_payment_content'
    | 'emergency_user_phone'
    | 'emergency_contact_person'
    | 'emergency_search_account'
    | 'emergency_manual_contact'
    | 'emergency_save_btn'
    | 'web_nav_menu'
    | 'web_drawer_0'
    | 'web_drawer_1'
    | 'web_drawer_2'
    | 'web_drawer_3'
    | 'web_drawer_home'
    | 'web_drawer_explore'
    | 'web_drawer_navigate'
    | 'web_drawer_community'
    | 'web_drawer_profile'
    | 'web_drawer_messages'
    | 'web_drawer_settings'
    | 'web_drawer_dashboard'
    | 'web_drawer_offers'
    | 'web_drawer_trails'
    | 'web_drawer_personnel'
    | 'web_drawer_application'
    | 'web_drawer_business'
    | 'web_drawer_mountain'
    | 'web_drawer_user'
    | 'web_drawer_recommendation'
    | 'fab_messages'
    | 'navigation_search_bar'
    | 'navigation_booked_card'
    | 'navigation_diy_card'
    | 'navigation_fullscreen_btn'
    | 'navigation_upcoming_tickets_btn'
    | 'navigation_card_chat_btn'
    | 'navigation_column_chat_btn'
    | 'navigation_map_style_btn'
    | 'navigation_recenter_btn'
    | 'navigation_start_hike_btn'
    | 'recording_header_trail'
    | 'recording_header_sos'
    | 'recording_trail_info_btn'
    | 'recording_group_chat_btn'
    | 'recording_team_status_btn'
    | 'recording_map_options_btn'
    | 'recording_map_style_btn'
    | 'recording_recenter_btn'
    | 'recording_metrics_hud'
    | 'recording_start_btn'
    | 'recording_help_btn';

export type TooltipPlacement = 'auto' | 'top' | 'bottom' | 'center' | 'right';

export type SpotlightShape = 'circle' | 'rect' | 'pill';

/**
 * Represents a single step within a tutorial tour.
 *
 * @param id - Unique step identifier
 * @param title - Concise headline for the step
 * @param description - Clear explanation of what the element is and how to use it
 * @param actionTip - Actionable micro-instruction
 * @param category - Optional category or location badge (e.g., "Home Tab", "Quick Action", "Payment")
 * @param targetSpotlight - Semantic target on the real screen to illuminate with the transparent cutout
 * @param spotlightShape - Shape of the transparent cutout hole ('circle' | 'rect' | 'pill')
 * @param tooltipPlacement - Placement of the speech bubble relative to the target ('top' | 'bottom' | 'center' | 'auto')
 * @param callout - Optional legacy callout preview configuration
 * @param highlightTabIndex - Optional 0-based tab index (0=Home, 1=Explore, 2=Hike, 3=Community, 4=Profile) to point at on mobile
 * @param highlightHeaderHelp - When true (used on the Final Step of every tour), illuminates the top-right '?' Replay button in CustomHeader
 * @param secondaryTargetSpotlight - Optional secondary target to simultaneously illuminate with an additional cutout hole and stroke
 */
export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    actionTip?: string;
    category?: string;
    targetSpotlight?: TargetSpotlightType;
    spotlightShape?: SpotlightShape;
    tooltipPlacement?: TooltipPlacement;
    callout?: TutorialCalloutPreview;
    highlightTabIndex?: number;
    highlightHeaderHelp?: boolean;
    secondaryTargetSpotlight?: TargetSpotlightType;
}

/**
 * Complete configuration for a specific tutorial tour.
 *
 * @param tourId - Unique tour key stored in AsyncStorage
 * @param tourTitle - Header label shown in the tutorial modal
 * @param roleScope - Which role this tour belongs to ('user' | 'admin' | 'all')
 * @param steps - Ordered list of tutorial steps (including the auto-appended Final '?' Replay Spotlight step)
 */
export interface TutorialTourConfig {
    tourId: TutorialTourId;
    tourTitle: string;
    roleScope: 'user' | 'admin' | 'all';
    steps: TutorialStep[];
}

export type TutorialCompletionMap = Partial<Record<TutorialTourId, boolean>>;

/**
 * Return contract of the useTutorialGuide hook.
 *
 * @param isVisible - Whether the tutorial overlay modal is currently open
 * @param currentStepIndex - Current 0-based step index
 * @param currentStep - Active step object
 * @param totalSteps - Total number of steps in this tour
 * @param tourConfig - Full tour metadata
 * @param hasCompletedTour - Whether this user has already completed this tour
 * @param hasGuide - Whether an active guide is configured with at least one step for this screen
 * @param onNextStep - Advance to the next step (or complete tour if on the final step)
 * @param onPrevStep - Return to the previous step
 * @param onSkipTour - Exits and completes the tour immediately
 * @param onReplayTour - Manually open/replay the tour from Step 0 (bound to the '?' header button)
 */
export interface UseTutorialGuideReturn {
    isVisible: boolean;
    currentStepIndex: number;
    currentStep: TutorialStep;
    totalSteps: number;
    hasGuide: boolean;
    tourConfig: TutorialTourConfig;
    hasCompletedTour: boolean;
    onNextStep: () => Promise<void>;
    onPrevStep: () => void;
    onSkipTour: () => Promise<void>;
    onReplayTour: () => void;
}
