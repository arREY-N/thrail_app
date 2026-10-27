/**
 * @file CustomSegmentedTabs.tsx
 * @description Standardized segmented control tab bar component for 2-to-4 equal-width switches.
 * Replaces ad-hoc tabContainer implementations across ReviewScreen, TrailScreen, and TACScreen.
 */

import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

export interface SegmentedTabItem {
    id: string;
    label: string;
    icon?: string;
    iconLibrary?: IconLibrary;
    badgeCount?: number;
    hasAlert?: boolean;
}

export interface CustomSegmentedTabsProps {
    tabs: (string | SegmentedTabItem)[];
    activeTab: string;
    onTabSelect: (tabId: string) => void;
    style?: StyleProp<ViewStyle>;
    tabStyle?: StyleProp<ViewStyle>;
    activeTabStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    activeTextStyle?: StyleProp<TextStyle>;
    activeBackgroundColor?: string;
    activeTextColor?: string;
}

const CustomSegmentedTabs: React.FC<CustomSegmentedTabsProps> = ({
    tabs,
    activeTab,
    onTabSelect,
    style,
    tabStyle,
    activeTabStyle,
    textStyle,
    activeTextStyle,
    activeBackgroundColor = Colors.PRIMARY,
    activeTextColor = Colors.WHITE,
}) => {
    if (!tabs || tabs.length === 0) return null;

    return (
        <View style={[styles.container, style]}>
            {tabs.map((tab) => {
                const tabId = typeof tab === 'string' ? tab : tab.id;
                const tabLabel = typeof tab === 'string' ? tab : tab.label;
                const tabIcon = typeof tab === 'object' ? tab.icon : undefined;
                const tabIconLib = typeof tab === 'object' ? (tab.iconLibrary || 'Feather') : 'Feather';
                const badgeCount = typeof tab === 'object' ? tab.badgeCount : undefined;
                const hasAlert = typeof tab === 'object' ? tab.hasAlert : false;

                const isActive = activeTab === tabId;

                return (
                    <TouchableOpacity
                        key={tabId}
                        style={[
                            styles.tabBtn,
                            tabStyle,
                            isActive && [styles.tabBtnActive, { backgroundColor: activeBackgroundColor }, activeTabStyle],
                        ]}
                        onPress={() => onTabSelect(tabId)}
                        activeOpacity={0.7}
                    >
                        {tabIcon ? (
                            <CustomIcon
                                library={tabIconLib}
                                name={tabIcon}
                                size={16}
                                color={isActive ? activeTextColor : Colors.TEXT_SECONDARY}
                            />
                        ) : null}

                        <CustomText
                            style={[
                                styles.tabText,
                                textStyle,
                                isActive && [styles.tabTextActive, { color: activeTextColor }, activeTextStyle],
                            ]}
                            numberOfLines={1}
                        >
                            {tabLabel}
                        </CustomText>

                        {badgeCount !== undefined && badgeCount > 0 && (
                            <View
                                style={[
                                    styles.badgePill,
                                    isActive
                                        ? styles.badgePillActive
                                        : (hasAlert ? styles.badgePillAlert : styles.badgePillInactive),
                                ]}
                            >
                                <CustomText
                                    style={[
                                        styles.badgeText,
                                        isActive
                                            ? styles.badgeTextActive
                                            : (hasAlert ? styles.badgeTextAlert : styles.badgeTextInactive),
                                    ]}
                                >
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                </CustomText>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        width: '100%',
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    tabBtnActive: {
        backgroundColor: Colors.PRIMARY,
    },
    tabText: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
    },
    tabTextActive: {
        color: Colors.WHITE,
    },
    badgePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgePillActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    badgePillInactive: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    badgePillAlert: {
        backgroundColor: Colors.ERROR_BG,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    badgeTextActive: {
        color: Colors.WHITE,
    },
    badgeTextInactive: {
        color: Colors.TEXT_SECONDARY,
    },
    badgeTextAlert: {
        color: Colors.ERROR,
    },
});

export default CustomSegmentedTabs;
