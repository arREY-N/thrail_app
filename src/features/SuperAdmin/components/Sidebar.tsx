/**
 * @file Sidebar.tsx
 * @description Unified collapsible left sidebar navigation component for Superadmin and Admin dashboard screens.
 */

import React from 'react';
import { HomeSidebar, HomeSidebarProps } from '@/src/features/Web/Home/HomePageNavBar';

export type SuperadminTab = 'dashboard' | 'application' | 'business' | 'trail' | 'mountain' | 'user';
export type AdminTab = SuperadminTab;

export interface SidebarProps extends Partial<HomeSidebarProps> {
    activeTab?: SuperadminTab;
    pendingCount?: number;
    onTabPress?: (tab: SuperadminTab) => void;
    onBackToSettings?: () => void;
    isMobileDrawer?: boolean;
    onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    pendingCount = 0,
    onTabPress,
    isMobileDrawer = false,
    onCloseMobileDrawer,
}) => {
    return (
        <HomeSidebar
            activeTab={activeTab}
            pendingCount={pendingCount}
            onTabPress={onTabPress as any}
            isMobileDrawer={isMobileDrawer}
            onCloseMobileDrawer={onCloseMobileDrawer}
        />
    );
};

export default Sidebar;
