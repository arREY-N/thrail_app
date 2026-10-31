/**
 * @file recordingTour.ts
 * @description Modular tutorial step configurations for the Live Hike Recording screen (HikeRecordingScreen).
 * Provides friendly, beginner-oriented walkthrough sequences for Booked / Guided Hike Mode and DIY / Free Roam Mode.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * Step configuration for the Booked Hike walkthrough on HikeRecordingScreen.
 * Guides scheduled hikers through their route title, emergency protocol, trail briefing,
 * group communication, team radar, offline topo maps, GPS recentering, HUD metrics, and starting the live climb.
 */
export const recordingBookedTourSteps: TutorialStep[] = [
    {
        id: 'rec-booked-step-1-trail',
        category: 'Hike Recording • Step 1 of 10',
        targetSpotlight: 'recording_header_trail',
        spotlightShape: 'pill',
        tooltipPlacement: 'bottom',
        title: 'Your Scheduled Trail',
        description:
            'Here is your destination mountain and live hike status! Once your climb begins, this indicator updates in real time to show you are actively tracking.',
        actionTip: 'Check here anytime to verify your current tracking status.',
    },
    {
        id: 'rec-booked-step-2-sos',
        category: 'Hike Recording • Step 2 of 10',
        targetSpotlight: 'recording_header_sos',
        spotlightShape: 'circle',
        tooltipPlacement: 'bottom',
        title: 'Emergency SOS & Rescue',
        description:
            'If you ever get lost, injured, or need urgent help, tap this red button. It provides 3 immediate safety options:\n\n1. Alert Guide: Live in-app alert to your guide\n2. Emergency SMS: Sends GPS coordinates offline\n3. Call 911: Direct local emergency dispatch',
        actionTip: 'Tap anytime during distress — works offline too.',
    },
    {
        id: 'rec-booked-step-3-info',
        category: 'Hike Recording • Step 3 of 10',
        targetSpotlight: 'recording_trail_info_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Trail Guide & Itinerary',
        description:
            'Tap this info button anytime to view mountain rules, trail checkpoints, packing reminders, and itinerary schedules for your climb.',
        actionTip: 'Review your itinerary and checkpoints before hitting the trail.',
    },
    {
        id: 'rec-booked-step-4-chat',
        category: 'Hike Recording • Step 4 of 10',
        targetSpotlight: 'recording_group_chat_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Hike Group Room',
        description:
            'Open your hike group chat to message your tour guide, ask about pacing, or coordinate with fellow hikers during trail breaks.',
        actionTip: 'Keep in touch with your guide throughout the climb.',
    },
    {
        id: 'rec-booked-step-5-team',
        category: 'Hike Recording • Step 5 of 10',
        targetSpotlight: 'recording_team_status_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Live Team Radar',
        description:
            'See everyone in your tour group, monitor who is on the trail, and view the last known GPS location of any member if they fall behind.',
        actionTip: 'Tap any hiker name to fly the map camera directly to their pin.',
    },
    {
        id: 'rec-booked-step-6-map-options',
        category: 'Hike Recording • Step 6 of 10',
        targetSpotlight: 'recording_map_options_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Map & Team Privacy Options',
        description:
            'Tap this gear icon to customize your map view and privacy settings. You can toggle showing fellow group hikers on your map or choose whether to share your own live GPS position with the team.',
        actionTip: 'Adjust team pin visibility or manage your location sharing anytime.',
    },
    {
        id: 'rec-booked-step-7-map-style',
        category: 'Hike Recording • Step 7 of 10',
        targetSpotlight: 'recording_map_style_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Offline Mountain Maps',
        description:
            'Mountain trails often lack cellular signal. Tap this button to switch between live topo satellite tiles and locally stored offline maps.',
        actionTip: 'Enable offline mode to ensure your map never goes blank.',
    },
    {
        id: 'rec-booked-step-8-recenter',
        category: 'Hike Recording • Step 8 of 10',
        targetSpotlight: 'recording_recenter_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Recenter Your Location',
        description:
            'Panned away to scout the trail ahead? Tap this locate button anytime to snap the camera straight back to your live position.',
        actionTip: 'Instantly re-align the map with where you are standing.',
    },
    {
        id: 'rec-booked-step-9-metrics',
        category: 'Hike Recording • Step 9 of 10',
        targetSpotlight: 'recording_metrics_hud',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Live Hike Metrics',
        description:
            'Track your live progress on the trail: total distance walked, elapsed hike duration, and current elevation gain.',
        actionTip: 'Metrics update automatically as you move along the trail.',
    },
    {
        id: 'rec-booked-step-10-start',
        category: 'Hike Recording • Step 10 of 10',
        targetSpotlight: 'recording_start_btn',
        spotlightShape: 'pill',
        tooltipPlacement: 'top',
        title: 'Start Recording Your Climb',
        description:
            'When you are at the trailhead and ready to ascend, tap here! Thrail will record your GPS track, calculate elevation, and log your adventure.',
        actionTip: 'Tap Start Recording when your climb begins.',
    },
];

/**
 * Step configuration for the DIY / Free Roam walkthrough on HikeRecordingScreen.
 * Guides independent hikers through their route title, emergency protocol, offline maps,
 * GPS recentering, HUD performance metrics, and starting independent tracking.
 */
export const recordingDiyTourSteps: TutorialStep[] = [
    {
        id: 'rec-diy-step-1-trail',
        category: 'Free Roam • Step 1 of 6',
        targetSpotlight: 'recording_header_trail',
        spotlightShape: 'pill',
        tooltipPlacement: 'bottom',
        title: 'Independent Hike Route',
        description:
            'You are on a free-roam climb! Thrail tracks your trail in real-time so you can always retrace your steps back to safety.',
        actionTip: 'Your path is recorded continuously on the map.',
    },
    {
        id: 'rec-diy-step-2-sos',
        category: 'Free Roam • Step 2 of 6',
        targetSpotlight: 'recording_header_sos',
        spotlightShape: 'circle',
        tooltipPlacement: 'bottom',
        title: 'Emergency SOS & Rescue',
        description:
            'If you ever get lost, injured, or encounter trail hazards, tap this red button. It gives you 3 immediate ways to get help:\n\n1. Alert Contact: Notify your designated contact\n2. Emergency SMS: Sends GPS coords offline\n3. Call 911: Direct local emergency dispatch',
        actionTip: 'Sends your exact coordinates even without cellular data.',
    },
    {
        id: 'rec-diy-step-3-map-style',
        category: 'Free Roam • Step 3 of 6',
        targetSpotlight: 'recording_map_style_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Offline Maps',
        description:
            'Cell service drops deep in nature. Tap this button to switch to offline maps so you can navigate without an active internet connection.',
        actionTip: 'Activate offline maps before entering deep trails.',
    },
    {
        id: 'rec-diy-step-4-recenter',
        category: 'Free Roam • Step 4 of 6',
        targetSpotlight: 'recording_recenter_btn',
        spotlightShape: 'circle',
        tooltipPlacement: 'top',
        title: 'Recenter Your Location',
        description:
            'If you pan around the map to preview the terrain, tap this button anytime to snap the camera right back to your current position.',
        actionTip: 'Quickly re-focus on your location.',
    },
    {
        id: 'rec-diy-step-5-metrics',
        category: 'Free Roam • Step 5 of 6',
        targetSpotlight: 'recording_metrics_hud',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
        title: 'Hike Performance Stats',
        description:
            'Monitor your trail distance in kilometers, total elapsed time, and total elevation gain as you explore.',
        actionTip: 'Helps you pace yourself and manage daylight.',
    },
    {
        id: 'rec-diy-step-6-start',
        category: 'Free Roam • Step 6 of 6',
        targetSpotlight: 'recording_start_btn',
        spotlightShape: 'pill',
        tooltipPlacement: 'top',
        title: 'Start Recording',
        description:
            'Ready to hit the trail? Tap here to start recording your live GPS track, elevation gain, and hiking stats!',
        actionTip: 'Tap Start Recording to begin your hike.',
    },
];


/**
 * Returns dynamic DIY / Free Roam tutorial steps based on whether an in-app emergency contact chat is linked.
 * When hasEmergencyChat is true, injects the 1-to-1 chat step immediately after SOS (Step 3 of 7).
 *
 * @param hasEmergencyChat - Whether the hiker has linked an in-app emergency contact
 * @returns Array of configured tutorial steps
 */
export const getRecordingDiyTourSteps = (hasEmergencyChat: boolean = false): TutorialStep[] => {
    if (!hasEmergencyChat) {
        return recordingDiyTourSteps;
    }

    return [
        {
            id: 'rec-diy-step-1-trail',
            category: 'Free Roam • Step 1 of 7',
            targetSpotlight: 'recording_header_trail',
            spotlightShape: 'pill',
            tooltipPlacement: 'bottom',
            title: 'Independent Hike Route',
            description:
                'You are on a free-roam climb! Thrail tracks your trail in real-time so you can always retrace your steps back to safety.',
            actionTip: 'Your path is recorded continuously on the map.',
        },
        {
            id: 'rec-diy-step-2-sos',
            category: 'Free Roam • Step 2 of 7',
            targetSpotlight: 'recording_header_sos',
            spotlightShape: 'circle',
            tooltipPlacement: 'bottom',
            title: 'Emergency SOS & Rescue',
            description:
                'If you ever get lost, injured, or encounter trail hazards, tap this red button. It gives you 3 immediate ways to get help:\n\n1. Alert Contact: Notify your designated contact\n2. Emergency SMS: Sends GPS coords offline\n3. Call 911: Direct local emergency dispatch',
            actionTip: 'Sends your exact coordinates even without cellular data.',
        },
        {
            id: 'rec-diy-step-3-chat',
            category: 'Free Roam • Step 3 of 7',
            targetSpotlight: 'recording_group_chat_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'top',
            title: 'Emergency Contact Chat',
            description:
                'Quickly message your linked emergency contact directly within the app to check in, share updates, or ask for assistance during your hike.',
            actionTip: 'Tap the chat bubble to open your direct 1-to-1 chat room.',
        },
        {
            id: 'rec-diy-step-4-map-style',
            category: 'Free Roam • Step 4 of 7',
            targetSpotlight: 'recording_map_style_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'top',
            title: 'Offline Maps',
            description:
                'Cell service drops deep in nature. Tap this button to switch to offline maps so you can navigate without an active internet connection.',
            actionTip: 'Activate offline maps before entering deep trails.',
        },
        {
            id: 'rec-diy-step-5-recenter',
            category: 'Free Roam • Step 5 of 7',
            targetSpotlight: 'recording_recenter_btn',
            spotlightShape: 'circle',
            tooltipPlacement: 'top',
            title: 'Recenter Your Location',
            description:
                'If you pan around the map to preview the terrain, tap this button anytime to snap the camera right back to your current position.',
            actionTip: 'Quickly re-focus on your location.',
        },
        {
            id: 'rec-diy-step-6-metrics',
            category: 'Free Roam • Step 6 of 7',
            targetSpotlight: 'recording_metrics_hud',
            spotlightShape: 'rect',
            tooltipPlacement: 'top',
            title: 'Hike Performance Stats',
            description:
                'Monitor your trail distance in kilometers, total elapsed time, and total elevation gain as you explore.',
            actionTip: 'Helps you pace yourself and manage daylight.',
        },
        {
            id: 'rec-diy-step-7-start',
            category: 'Free Roam • Step 7 of 7',
            targetSpotlight: 'recording_start_btn',
            spotlightShape: 'pill',
            tooltipPlacement: 'top',
            title: 'Start Recording',
            description:
                'Ready to hit the trail? Tap here to start recording your live GPS track, elevation gain, and hiking stats!',
            actionTip: 'Tap Start Recording to begin your hike.',
        },
    ];
};
