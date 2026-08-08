/**
 * @file SuperadminShell.tsx
 * @description Persistent layout shell wrapper component where BOTH Header Bar and Content Canvas are enclosed inside ONE unified card container on web/desktop, while stripping double card borders on mobile.
 */

import React, { useState } from 'react';
import {
    RefreshControlProps,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import Drawer from '@/src/features/SuperAdmin/components/Drawer';
import CustomHeader from '@/src/components/CustomHeader';
import Sidebar, { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';

/**
 * Interface representing the properties of the SuperadminShell component.
 * 
 * @param activeTab - The identifier of the currently active tab.
 * @param pendingCount - Count of pending applications.
 * @param onTabPress - Callback handler when navigating to a tab.
 * @param onBackToSettings - Callback handler to navigate back to Settings/Profile screen.
 * @param children - The active tab body content to render inside the main card container canvas.
 * @param searchValue - Active search text input value.
 * @param onSearchChange - Callback handler fired when search text changes.
 * @param searchPlaceholder - Custom placeholder text for search input.
 * @param enableSearch - Flag to enable top header search input bar.
 */
interface Props {
    activeTab: SuperadminTab;
    pendingCount: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
    children: React.ReactNode;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    searchPlaceholder?: string;
    enableSearch?: boolean;
    rightActions?: React.ReactNode;
    leftActionOverride?: React.ReactNode;
    titleOverride?: string;
    refreshControl?: React.ReactElement<RefreshControlProps>;
}

const TAB_TITLES: Record<SuperadminTab, string> = {
    dashboard: 'Dashboard',
    application: 'Applications',
    business: 'Tour Businesses',
    trail: 'Trails & Routes',
    mountain: 'Mountains Database',
    user: 'User Accounts',
};

/**
 * SuperadminShell component.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered shell wrapper.
 */
const SuperadminShell = ({
    activeTab,
    pendingCount,
    onTabPress,
    onBackToSettings,
    children,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    enableSearch,
    rightActions,
    leftActionOverride,
    titleOverride,
    refreshControl,
}: Props): React.JSX.Element => {
    const { isTablet, isMobile } = useBreakpoints();
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

    const handleTabSelect = (tab: SuperadminTab) => {
        setIsDrawerOpen(false);
        onTabPress(tab);
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.shellOuter}>
                {/* Desktop / Tablet Persistent Left Sidebar */}
                {!isMobile && (
                    <Sidebar
                        activeTab={activeTab}
                        pendingCount={pendingCount}
                        onTabPress={handleTabSelect}
                        onBackToSettings={onBackToSettings}
                    />
                )}

                {/* Mobile Left-Slide Drawer */}
                {isMobile && (
                    <Drawer
                        visible={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                    >
                        <Sidebar
                            activeTab={activeTab}
                            pendingCount={pendingCount}
                            onTabPress={handleTabSelect}
                            onBackToSettings={() => {
                                setIsDrawerOpen(false);
                                onBackToSettings();
                            }}
                            isMobileDrawer={true}
                            onCloseMobileDrawer={() => setIsDrawerOpen(false)}
                        />
                    </Drawer>
                )}

                {/* Main Content Area Wrapper */}
                <View style={[styles.mainCanvasWrapper, isMobile && styles.mainCanvasWrapperMobile]}>
                    {/* Unified Outer Container */}
                    <View style={[
                        styles.unifiedCardContainer,
                        isMobile && styles.unifiedCardContainerMobile
                    ]}>
                        {/* Header Bar */}
                        <CustomHeader
                            variant="dashboard"
                            title={titleOverride || TAB_TITLES[activeTab] || 'Dashboard'}
                            isMobile={isMobile || isTablet}
                            onToggleDrawer={() => setIsDrawerOpen(true)}
                            searchValue={searchValue}
                            onSearchChange={onSearchChange}
                            searchPlaceholder={searchPlaceholder}
                            enableSearch={enableSearch}
                            rightActions={rightActions}
                            leftAction={leftActionOverride}
                        />

                        {/* Scrollable Body Content */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[
                                styles.scrollContent,
                                isMobile && styles.scrollContentMobile
                            ]}
                            keyboardShouldPersistTaps="handled"
                            refreshControl={refreshControl}
                        >
                            {children}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    shellOuter: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.BACKGROUND,
    },
    mainCanvasWrapper: {
        flex: 1,
        padding: 16,
        width: '100%',
    },
    mainCanvasWrapperMobile: {
        padding: 0,
    },
    unifiedCardContainer: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        width: '100%',
        ...GlobalStyles.dropShadow(2),
    },
    unifiedCardContainerMobile: {
        borderRadius: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
        elevation: 0,
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    scrollContentMobile: {
        padding: 16,
    },
});

export default SuperadminShell;
