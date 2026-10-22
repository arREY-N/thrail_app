/**
 * @file adminDashboardTour.ts
 * @description Step configuration for the Admin Dashboard walkthrough (Overview Cards + 3 Quick Action buttons).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const adminDashboardSteps: TutorialStep[] = [
    {
        id: 'admin-dash-overview',
        category: 'Admin Dashboard • Overview',
        targetSpotlight: 'admin_dash_overview',
        title: 'Organization & Profile Overview',
        description:
            'Welcome to the Admin Dashboard! The top cards display your Business Profile status (Active/Archived), serviced locations, and your logged-in Admin credentials.',
        actionTip: 'Use the Quick Actions bar below to manage your trails, offers, and staff.',
    },
    {
        id: 'admin-dash-trails-btn',
        category: 'Quick Action 1 of 3 • Trails',
        targetSpotlight: 'admin_action_0',
        title: '"Trails" Button — View Serviced Trails',
        description:
            'The first Quick Action button ("Trails") opens the directory of hiking trails available in your serviced locations so you can inspect trail specifications before creating an offer.',
        actionTip: 'Tap "Trails" to browse trail difficulty, length, and elevation details.',
    },
    {
        id: 'admin-dash-offers-btn',
        category: 'Quick Action 2 of 3 • Offers',
        targetSpotlight: 'admin_action_1',
        title: '"Offers" Button — Manage Hike Packages',
        description:
            'The center primary button ("Offers") is your main workspace. Go here to publish new hike offers, manage existing schedules, and review hiker bookings & documents.',
        actionTip: 'Tap "Offers" to create hike packages or review incoming hiker reservations.',
    },
    {
        id: 'admin-dash-personnel-btn',
        category: 'Quick Action 3 of 3 • Personnel',
        targetSpotlight: 'admin_action_2',
        title: '"Personnel" Button — Manage Admin Staff',
        description:
            'The third Quick Action button ("Personnel") lets you view your organization’s admin team and add or manage staff members who help coordinate hikes and review bookings.',
        actionTip: 'Tap "Personnel" to view or add staff accounts for your organization.',
    },
];
