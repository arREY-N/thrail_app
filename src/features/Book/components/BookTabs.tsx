/**
 * @file BookTabs.tsx
 * @description Tab bar component for booking navigation, elevated with smooth web drag scrolling,
 * auto-centering of active tabs, and gradient fade indicators while preserving custom action-needed
 * badge indicators and pill typography.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

export interface TabItem {
    id: string;
    label: string;
    badgeCount?: number;
    hasActionNeeded?: boolean;
}

export interface BookTabsProps {
    tabs: (string | TabItem)[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    fadeBackgroundColor?: string;
}

const BookTabs: React.FC<BookTabsProps> = ({ 
    tabs,
    activeTab, 
    onTabChange,
    style,
    contentContainerStyle,
    fadeBackgroundColor = Colors.BACKGROUND,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

    const {
        showLeftFade,
        showRightFade,
        layoutWidth: viewportWidth,
        scrollProps,
    } = useScrollFades();

    // Enable drag-to-scroll functionality on Web platforms
    useWebDragScroll(scrollViewRef, tabs && tabs.length > 0);

    // Auto-center the selected tab in the ScrollView viewport
    useEffect(() => {
        if (!activeTab || !tabLayouts[activeTab] || viewportWidth <= 0) return;
        const { x, width: tabWidth } = tabLayouts[activeTab];
        const scrollXTarget = x - (viewportWidth / 2) + (tabWidth / 2);
        scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollXTarget), animated: true });
    }, [activeTab, tabLayouts, viewportWidth]);

    if (!tabs || tabs.length === 0) return null;

    return (
        <View style={[styles.tabContainer, style]}>
            <ScrollView 
                ref={scrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={[styles.tabScrollContent, contentContainerStyle]}
                {...scrollProps}
            >
                {tabs.map((tab) => {
                    const tabId = typeof tab === 'string' ? tab : tab.id;
                    const tabLabel = typeof tab === 'string' ? tab : tab.label;
                    const badgeCount = typeof tab === 'object' ? tab.badgeCount : undefined;
                    const hasActionNeeded = typeof tab === 'object' ? tab.hasActionNeeded : false;
                    
                    const isActive = activeTab === tabId;
                    const countDisplay = badgeCount && badgeCount > 0
                        ? (badgeCount > 99 ? '99+' : `${badgeCount}`)
                        : null;
                    
                    return (
                        <TouchableOpacity
                            key={tabId}
                            style={[
                                styles.tabPill, 
                                isActive ? styles.activePill : styles.inactivePill
                            ]}
                            onPress={() => onTabChange(tabId)}
                            activeOpacity={0.7}
                            onLayout={(e) => {
                                const { x, width: itemWidth } = e.nativeEvent.layout;
                                setTabLayouts((prev) => ({
                                    ...prev,
                                    [tabId]: { x, width: itemWidth },
                                    ...(tabLabel !== tabId ? { [tabLabel]: { x, width: itemWidth } } : {}),
                                }));
                            }}
                        >
                            <View style={styles.tabContentRow}>
                                <CustomText 
                                    variant="label" 
                                    style={[
                                        styles.tabText, 
                                        isActive ? styles.activeText : styles.inactiveText
                                    ]}
                                >
                                    {tabLabel}
                                </CustomText>

                                {countDisplay && (
                                    <View
                                        style={[
                                            styles.badgePill,
                                            isActive
                                                ? styles.badgePillActive
                                                : (hasActionNeeded ? styles.badgePillAlert : styles.badgePillInactive),
                                        ]}
                                    >
                                        <CustomText 
                                            style={[
                                                styles.badgeText,
                                                isActive
                                                    ? styles.badgeTextActive
                                                    : (hasActionNeeded ? styles.badgeTextAlert : styles.badgeTextInactive),
                                            ]}
                                        >
                                            {countDisplay}
                                        </CustomText>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {showLeftFade && (
                <LinearGradient
                    colors={[
                        fadeBackgroundColor,
                        Colors.BACKGROUND_FADE,
                        Colors.BACKGROUND_TRANSPARENT,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.leftFade}
                    pointerEvents="none"
                />
            )}

            {showRightFade && (
                <LinearGradient
                    colors={[
                        Colors.BACKGROUND_TRANSPARENT,
                        Colors.BACKGROUND_FADE,
                        fadeBackgroundColor,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.rightFade}
                    pointerEvents="none"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: { 
        position: 'relative',
        paddingVertical: 12, 
        backgroundColor: Colors.BACKGROUND,
    },
    tabScrollContent: { 
        paddingHorizontal: 16, 
        gap: 8,
    },
    tabPill: { 
        paddingHorizontal: 18, 
        paddingVertical: 8,
        minHeight: 38,
        borderRadius: 20, 
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activePill: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    inactivePill: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    tabContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    badgePill: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgePillActive: {
        backgroundColor: Colors.WHITE,
    },
    badgePillInactive: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    badgePillAlert: {
        backgroundColor: Colors.ERROR,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        includeFontPadding: false,
        lineHeight: 12,
        textAlignVertical: 'center',
    },
    badgeTextActive: {
        color: Colors.PRIMARY,
    },
    badgeTextInactive: {
        color: Colors.TEXT_SECONDARY,
    },
    badgeTextAlert: {
        color: Colors.WHITE,
    },
    tabText: { 
        fontSize: 14,
        fontWeight: 'bold',
        includeFontPadding: false,
        lineHeight: 18,
        textAlignVertical: 'center',
    },
    activeText: {
        color: Colors.WHITE,
    },
    inactiveText: {
        color: Colors.TEXT_SECONDARY,
    },
    leftFade: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 1,
    },
    rightFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 1,
    },
});

export default BookTabs;
