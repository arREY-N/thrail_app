/**
 * @file navigationTour.ts
 * @description Modular tutorial step configurations for the Navigation Lobby (NavigationScreen).
 * Provides friendly, beginner-oriented walkthrough sequences for Booked Hike Mode and DIY / Free Roam Hike Mode.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * Step configuration for the Booked Hike walkthrough on NavigationScreen.
 * Guides users who have scheduled reservations through trail discovery, their reservation card,
 * fullscreen map scouting, upcoming ticket switching, dual chat shortcuts, offline maps, recenter GPS, and the date-locked start button.
 */
export const navigationBookedTourSteps: TutorialStep[] = [
    {
        id: 'nav-booked-step-1-search',
        category: 'Navigation • Step 1 of 8',
        targetSpotlight: 'navigation_search_bar',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
        title: 'Find Trails & Mountains',
        description:
            'Looking for another adventure? Type the name of any mountain or trail to see how far it is, how hard it is to climb, and photos of the trail.',
        actionTip: 'Type a mountain name to explore trails anytime.',
    },
    {
        id: 'nav-booked-step-2-card',
        category: 'Navigation • Step 2 of 8',
        targetSpotlight: 'navigation_booked_card',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Your Booked Hike',
        description:
            'Here is your scheduled climb! You can see your trail destination, your hike date, and how many days are left until you hit the trail.',
        actionTip: 'Check this card to see your countdown to hike day.',
    },
    {
        id: 'nav-booked-step-3-fullscreen',
        category: 'Navigation • Step 3 of 8',
        targetSpotlight: 'navigation_fullscreen_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'bottom',
        title: 'Fullscreen Map Scout',
        description:
            'Want to see more of the mountain terrain? Tap this expand button to hide all cards and buttons for an unobstructed, full-screen map view.',
        actionTip: 'Tap expand anytime for a clutter-free view of the terrain.',
    },
    {
        id: 'nav-booked-step-4-tickets',
        category: 'Navigation • Step 4 of 8',
        targetSpotlight: 'navigation_upcoming_tickets_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'bottom',
        title: 'Your Bookings List',
        description:
            'Have more than one climb booked? Tap this ticket button to view all your reservations and choose which one to display on the map.',
        actionTip: 'Tap the ticket icon to switch between your hikes.',
    },
    {
        id: 'nav-booked-step-5-chat',
        category: 'Navigation • Step 5 of 8',
        targetSpotlight: 'navigation_card_chat_btn',
        secondaryTargetSpotlight: 'navigation_column_chat_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Chat with Your Guide',
        description:
            'You can open your hike chat using either green button — the one inside your card or the floating bubble on the right. Ask your guide questions and meet your group before the climb!',
        actionTip: 'Tap either chat icon to message your tour guide and fellow hikers.',
    },
    {
        id: 'nav-booked-step-6-map-style',
        category: 'Navigation • Step 6 of 8',
        targetSpotlight: 'navigation_map_style_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Offline Maps',
        description:
            'Cell phone service often drops in the mountains. Tap this button to turn on offline maps so your trail map still works without internet.',
        actionTip: 'Turn on offline mode before heading into areas with no signal.',
    },
    {
        id: 'nav-booked-step-7-recenter',
        category: 'Navigation • Step 7 of 8',
        targetSpotlight: 'navigation_recenter_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Recenter Your Location',
        description:
            'Panned away or exploring other areas of the map? Tap this locate button anytime to instantly center the map back onto your current live GPS position.',
        actionTip: 'Tap the crosshair button to jump right back to where you are.',
    },
    {
        id: 'nav-booked-step-8-start',
        category: 'Navigation • Step 8 of 8',
        targetSpotlight: 'navigation_start_hike_btn',
        spotlightShape: 'pill',
        tooltipPlacement: 'top',
        title: 'Start Your Hike',
        description:
            'This button unlocks on the day of your climb so you can record your hike and track your path. It stays locked until your hike date arrives.',
        actionTip: 'This unlocks on hike day when you arrive at the mountain.',
    },
];

/**
 * Returns dynamic DIY / Free Roam walkthrough steps tailored to whether the user currently has upcoming bookings.
 *
 * @param hasBookings - Whether upcoming bookings exist (showing the ticket button on the right column)
 * @returns Array of configured tutorial steps
 */
export const getNavigationDiyTourSteps = (hasBookings: boolean): TutorialStep[] => {
    const totalSteps = hasBookings ? 8 : 7;

    const steps: TutorialStep[] = [
        {
            id: 'nav-diy-step-1-search',
            category: `Free Roam • Step 1 of ${totalSteps}`,
            targetSpotlight: 'navigation_search_bar',
            spotlightShape: 'rect',
            tooltipPlacement: 'bottom',
            title: 'Find Trails & Mountains',
            description:
                'Planning a hike on your own? Type the name of any mountain or trail to view its route map, distance, and difficulty level.',
            actionTip: 'Search for a mountain to see its trail on the map.',
        },
        {
            id: 'nav-diy-step-2-card',
            category: `Free Roam • Step 2 of ${totalSteps}`,
            targetSpotlight: 'navigation_diy_card',
            spotlightShape: 'rect',
            tooltipPlacement: 'top',
            title: 'Hike Your Own Way',
            description:
                'You can pick a mountain from search to follow its marked trail, or simply explore anywhere you like starting from where you are right now.',
            actionTip: 'Choose a trail from search, or start exploring from your current location.',
        },
        {
            id: 'nav-diy-step-3-fullscreen',
            category: `Free Roam • Step 3 of ${totalSteps}`,
            targetSpotlight: 'navigation_fullscreen_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'bottom',
            title: 'Fullscreen Map Scout',
            description:
                'Scouting trail topography? Tap this expand button to view your map in full-screen mode without any cards or controls blocking your view.',
            actionTip: 'Tap expand anytime for an unobstructed view of the map.',
        },
    ];

    if (hasBookings) {
        steps.push({
            id: 'nav-diy-step-4-tickets',
            category: `Free Roam • Step 4 of ${totalSteps}`,
            targetSpotlight: 'navigation_upcoming_tickets_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'bottom',
            title: 'Your Bookings List',
            description:
                'Have upcoming guided climbs scheduled? Tap this ticket button anytime to switch between your reservations or view booking details.',
            actionTip: 'Tap the ticket icon to view your scheduled hikes.',
        });
    }

    const stepOffset = hasBookings ? 5 : 4;

    steps.push(
        {
            id: 'nav-diy-step-group-list',
            category: `Free Roam • Step ${stepOffset} of ${totalSteps}`,
            targetSpotlight: 'navigation_column_chat_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'top',
            title: 'Hiking Group Chats',
            description:
                'Tap this chat bubble to view your group chats, talk with hiking friends, and ask about current weather or trail conditions.',
            actionTip: 'Tap here to chat with your hiking groups and buddies.',
        },
        {
            id: 'nav-diy-step-map-style',
            category: `Free Roam • Step ${stepOffset + 1} of ${totalSteps}`,
            targetSpotlight: 'navigation_map_style_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'top',
            title: 'Offline Maps',
            description:
                'No internet in the mountains? No problem. Tap this button to switch to offline maps so you can always see where you are, even with no signal.',
            actionTip: 'Turn on offline maps before you enter trails with poor cellular reception.',
        },
        {
            id: 'nav-diy-step-recenter',
            category: `Free Roam • Step ${stepOffset + 2} of ${totalSteps}`,
            targetSpotlight: 'navigation_recenter_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'top',
            title: 'Recenter Your Location',
            description:
                'If you scroll or zoom around the map to scout terrain, tap this button anytime to snap the camera straight back to your live GPS position.',
            actionTip: 'Keep track of your spot on the trail with a single tap.',
        },
        {
            id: 'nav-diy-step-start',
            category: `Free Roam • Step ${stepOffset + 3} of ${totalSteps}`,
            targetSpotlight: 'navigation_start_hike_btn',
            spotlightShape: 'pill',
            tooltipPlacement: 'top',
            title: 'Start Recording',
            description:
                'Tap this button when you\'re ready to start walking! The app will record your hike, track your steps, and guide your trail live.',
            actionTip: 'Tap Start Live Session to begin tracking your hike.',
        }
    );

    return steps;
};

/**
 * Default static DIY / Free Roam walkthrough steps (assumes bookings exist for full tour coverage).
 */
export const navigationDiyTourSteps: TutorialStep[] = getNavigationDiyTourSteps(true);
