/**
 * @file tabsTour.ts
 * @description Step configuration for the User 5 Main Tabs walkthrough (Home, Explore, Hike, Community, Profile).
 */

import { Platform } from 'react-native';

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const mobileTabsTourSteps: TutorialStep[] = [
    {
        id: 'tab-home',
        category: 'Bottom Tab 1 of 5 â€¢ Home',
        targetSpotlight: 'tab_0',
        title: 'Home Tab • Your Trail Hub',
        description:
            'Your starting dashboard! Check live mountain weather safety alerts, personalized trail recommendations based on your preferences, and trails with upcoming organizer offers.',
        actionTip: 'Tap any mountain card to inspect trail stats, or use the top icons to check Notifications and My Bookings.',
        highlightTabIndex: 0,
    },
    {
        id: 'tab-explore',
        category: 'Bottom Tab 2 of 5 â€¢ Explore',
        targetSpotlight: 'tab_1',
        title: 'Explore Tab • Search & Filter Trails',
        description:
            'Browse all mountains and hiking trails across Region IV-A (CALABARZON). Filter trails by province, difficulty level, or hiking duration to find your next climb.',
        actionTip: 'Use the search bar or filter chips at the top of Explore to narrow down mountains.',
        highlightTabIndex: 1,
    },
    {
        id: 'tab-hike',
        category: 'Bottom Tab 3 of 5 â€¢ Hike',
        targetSpotlight: 'tab_2',
        title: 'Hike Tab • Live GPS Trail Navigation',
        description:
            'Used on hike day for offline-ready trail maps, GPS route recording, and Emergency SOS alerts. Note: Live hike navigation unlocks after your booking reservation and payment are completed.',
        actionTip: 'Once you have a confirmed & paid booking, open this tab on hike day to start tracking.',
        highlightTabIndex: 2,
    },
    {
        id: 'tab-community',
        category: 'Bottom Tab 4 of 5 â€¢ Community',
        targetSpotlight: 'tab_3',
        title: 'Community Tab • Reviews & Groups',
        description:
            'Read authentic trail reviews and photos from fellow hikers, check the monthly top hiker leaderboards, and access your hike group chat rooms.',
        actionTip: 'Tap the trophy icon for Leaderboards or the chat icon to open your Group Rooms.',
        highlightTabIndex: 3,
    },
    {
        id: 'tab-profile',
        category: 'Bottom Tab 5 of 5 â€¢ Profile',
        targetSpotlight: 'tab_4',
        title: 'Profile Tab • Milestones & Settings',
        description:
            'Track your personal hiking statistics, completed hike logs, and achievement milestones. You can also update your medical profile, emergency contact, or apply as a Tour Organizer in Settings.',
        actionTip: 'Open Profile anytime to manage your account details or apply to become a verified Admin/Organizer.',
        highlightTabIndex: 4,
    },
    {
        id: 'fab-messages',
        category: 'Floating Action Button â€¢ Messages',
        targetSpotlight: 'fab_messages',
        spotlightShape: 'circle',
        title: 'Messages • Quick Group Chats',
        description:
            'Notice this green floating chat button! It floats conveniently across Home, Explore, Community, and Profile (except Navigation) so you can quickly jump into your hike group chats and message your guides anytime.',
        actionTip: 'Tap this floating chat bubble anytime to open your active hike conversations and group rooms.',
    },
];

export const getWebNavTourSteps = (role?: string | null): TutorialStep[] => {
    const isAdmin = role === 'admin';
    const isSuperadmin = role === 'superadmin';

    const baseSteps: TutorialStep[] = [
        {
            id: 'web-nav-menu',
            category: 'Navigation Menu',
            targetSpotlight: 'web_nav_menu',
            title: 'Menu Drawer — Quick Navigation',
            description:
                'Click the menu icon (☰) anytime to open your navigation sidebar drawer and switch between your dashboard, explore trails, community, and account settings.',
            actionTip: 'Click Next to open the sidebar and preview the navigation links.',
        },
        {
            id: 'web-drawer-home',
            category: 'Sidebar • Home',
            targetSpotlight: 'web_drawer_home',
            title: 'Home — Your Trail Hub',
            description:
                'Your starting dashboard! Check live mountain weather safety alerts, personalized trail recommendations based on your preferences, and trails with upcoming organizer offers.',
            actionTip: 'Click any mountain card to inspect trail stats, or check Notifications and Bookings in the top header.',
        },
        {
            id: 'web-drawer-explore',
            category: 'Sidebar • Explore Trails',
            targetSpotlight: 'web_drawer_explore',
            title: 'Explore Trails — Search & Filter',
            description:
                'Browse all mountains and hiking trails across Region IV-A (CALABARZON). Filter trails by province, difficulty level, or hiking duration to find your next climb.',
            actionTip: 'Use search and filter chips to find trails tailored to your hiking level.',
        },
        {
            id: 'web-drawer-navigate',
            category: 'Sidebar • Navigate',
            targetSpotlight: 'web_drawer_navigate',
            title: 'Navigate — Trail Navigation & Maps',
            description:
                'Access GPS trail route navigation, topographic trail maps, and emergency coordinates. Note: Active live navigation is primarily used on mobile devices during trail day.',
            actionTip: 'View trail routes and GPS tracking tools for your scheduled mountain climbs.',
        },
        {
            id: 'web-drawer-community',
            category: 'Sidebar • Community',
            targetSpotlight: 'web_drawer_community',
            title: 'Community — Reviews & Leaderboards',
            description:
                'Read authentic trail reviews and photos from fellow hikers, check monthly top hiker leaderboards, and access your hike group chat rooms.',
            actionTip: 'Discover reviews from real hikers and connect with group members.',
        },
        {
            id: 'web-drawer-profile',
            category: 'Sidebar • Profile',
            targetSpotlight: 'web_drawer_profile',
            title: 'Profile — Stats & Account',
            description:
                'Track your personal hiking statistics, completed hike logs, and achievement milestones. You can also manage your account details and settings.',
            actionTip: 'Keep your hiking milestones and emergency contacts up to date.',
        },
        {
            id: 'web-drawer-messages',
            category: 'Sidebar • Messages',
            targetSpotlight: 'web_drawer_messages',
            title: 'Messages — Hike Group Chats',
            description:
                'Coordinate with your hike organizer and fellow group members in real-time chat rooms for each of your joined trail climbs.',
            actionTip: 'Check your active group conversations before and during hike day.',
        },
        {
            id: 'web-drawer-settings',
            category: 'Sidebar • Settings',
            targetSpotlight: 'web_drawer_settings',
            title: 'Settings — Preferences & App Config',
            description:
                'Customize your app experience, notification preferences, account credentials, and system options.',
            actionTip: 'Adjust your preferences anytime from Settings.',
        },
    ];

    if (isAdmin) {
        const adminManagementSteps: TutorialStep[] = [
            {
                id: 'web-drawer-dashboard',
                category: 'Admin • Dashboard',
                targetSpotlight: 'web_drawer_dashboard',
                title: 'Dashboard — Organizer Overview',
                description:
                    'Access your high-level business analytics, monthly revenue breakdown, active booking volumes, and recent customer activities.',
                actionTip: 'Monitor your tour business operations at a glance from Dashboard.',
            },
            {
                id: 'web-drawer-offers',
                category: 'Management • Offers',
                targetSpotlight: 'web_drawer_offers',
                title: 'Offers — Manage Hike Packages',
                description:
                    'Your primary organizer workspace! Publish and schedule hike packages, manage participant capacities, set package pricing, and review incoming hiker reservations.',
                actionTip: 'Create new hike offers and monitor booking payment statuses.',
            },
            {
                id: 'web-drawer-trails',
                category: 'Management • Trails & Routes',
                targetSpotlight: 'web_drawer_trails',
                title: 'Trails & Routes — Serviced Locations',
                description:
                    'Inspect the hiking mountains and trails available in your serviced provinces, verify trail difficulty ratings, and review routes before scheduling offers.',
                actionTip: 'Check trail specs and route maps for your authorized areas.',
            },
            {
                id: 'web-drawer-personnel',
                category: 'Management • Personnel',
                targetSpotlight: 'web_drawer_personnel',
                title: 'Personnel — Staff & Guides',
                description:
                    'Manage your organization’s admin team, tour coordinators, and mountain guides who accompany hikers and manage event logistics.',
                actionTip: 'Assign coordinators and keep staff contacts organized.',
            },
        ];

        return [...baseSteps, ...adminManagementSteps];
    }

    if (isSuperadmin) {
        const superadminSteps: TutorialStep[] = [
            {
                id: 'web-drawer-dashboard',
                category: 'Superadmin • Dashboard',
                targetSpotlight: 'web_drawer_dashboard',
                title: 'Dashboard — Platform Analytics',
                description:
                    'Monitor platform-wide hiking activity, user growth metrics, organizer performance, and system health statistics across Region IV-A.',
                actionTip: 'Inspect system-wide KPIs and key platform operations.',
            },
            {
                id: 'web-drawer-application',
                category: 'Superadmin • Applications',
                targetSpotlight: 'web_drawer_application',
                title: 'Applications — Organizer Approvals',
                description:
                    'Review and verify incoming tour organizer business registrations, evaluate government permits and BIR documents, and approve or reject organizer accounts.',
                actionTip: 'Evaluate new partner applications and inspect legal documents.',
            },
            {
                id: 'web-drawer-business',
                category: 'Management • Tour Businesses',
                targetSpotlight: 'web_drawer_business',
                title: 'Tour Businesses — Registered Organizers',
                description:
                    'Manage verified organizer accounts, inspect company profiles, monitor active tour operations, and configure business permissions.',
                actionTip: 'Audit registered business accounts and manage partner statuses.',
            },
            {
                id: 'web-drawer-trails',
                category: 'Management • Trails & Routes',
                targetSpotlight: 'web_drawer_trails',
                title: 'Trails & Routes — Master Directory',
                description:
                    'Maintain the master Calabarzon trail directory, configure trail coordinates and waypoints in the interactive map editor, and update technical metrics.',
                actionTip: 'Create new trails, update route waypoints, and manage difficulties.',
            },
            {
                id: 'web-drawer-mountain',
                category: 'Management • Mountains Database',
                targetSpotlight: 'web_drawer_mountain',
                title: 'Mountains Database — Summits & Peaks',
                description:
                    'Curate the regional mountain database across Cavite, Laguna, Batangas, Rizal, and Quezon with elevation, difficulty, and environmental policies.',
                actionTip: 'Manage regional mountain profiles and geographic specifications.',
            },
            {
                id: 'web-drawer-user',
                category: 'Management • User Accounts',
                targetSpotlight: 'web_drawer_user',
                title: 'User Accounts — User Directory',
                description:
                    'Inspect the platform user base, audit role permissions (Hikers, Admins, Superadmins), verify account status, and manage security restrictions.',
                actionTip: 'Search and manage all user accounts registered across Thrail.',
            },
            {
                id: 'web-drawer-recommendation',
                category: 'Management • Recommendations',
                targetSpotlight: 'web_drawer_recommendation',
                title: 'Recommendations — Engine & Weights',
                description:
                    'Tune the hybrid recommendation engine parameters, adjust feature weights (difficulty, distance, elevation), and test algorithmic matching.',
                actionTip: 'Fine-tune personalized trail recommendation formulas.',
            },
        ];

        return [...baseSteps, ...superadminSteps];
    }

    return baseSteps;
};

export const webNavTourSteps: TutorialStep[] = getWebNavTourSteps();

export const tabsTourSteps: TutorialStep[] =
    Platform.OS === 'web' ? webNavTourSteps : mobileTabsTourSteps;
