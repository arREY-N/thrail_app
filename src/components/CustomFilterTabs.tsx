/**
 * @file CustomFilterTabs.tsx
 * @description A reusable horizontal filter tab bar component encapsulating drag-to-scroll, fade overlays, active tab auto-centering, count badges, sort indicators, and visual style variants.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
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
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Structured tab item representation.
 */
export interface FilterTabItem {
    id: string;
    label: string;
    count?: number;
    icon?: string;
    iconLibrary?: IconLibrary;
    disabled?: boolean;
}

/**
 * Visual variant options for CustomFilterTabs.
 * - 'default': Standard rectangular chip with subtle rounded corners (borderRadius: 12).
 * - 'pill': Fully rounded capsule chip with border outline (borderRadius: 20).
 */
export type FilterTabVariant = 'default' | 'pill';

/**
 * Props for the CustomFilterTabs component.
 * 
 * @param tabs - Array of category tab names or structured FilterTabItem objects.
 * @param activeTab - The currently active tab identifier or name.
 * @param onTabSelect - Callback fired when a filter tab is selected.
 * @param variant - Visual style variant ('default' | 'pill'). Default is 'default'.
 * @param sortOrder - Sort direction indicator ('asc' | 'desc') for sortable tabs.
 * @param sortTabName - Tab name that triggers the sort direction icon display. Default is 'Rating'.
 * @param getTabCount - Optional function to dynamically retrieve item count for a given tab.
 * @param fadeBackgroundColor - Background color for the left and right gradient fade overlays.
 * @param containerStyle - Custom style override for the outer wrapper.
 * @param chipScrollStyle - Custom content container style override for the scroll view.
 * @param chipStyle - Custom style override for individual inactive chips.
 * @param activeChipStyle - Custom style override for the active chip.
 * @param textStyle - Custom text style override for inactive chip labels.
 * @param activeTextStyle - Custom text style override for active chip labels.
 */
export interface CustomFilterTabsProps {
    tabs?: (string | FilterTabItem)[];
    activeTab?: string;
    onTabSelect?: (tab: string) => void;
    variant?: FilterTabVariant;
    sortOrder?: 'asc' | 'desc';
    sortTabName?: string;
    getTabCount?: (tab: string) => number | undefined;
    fadeBackgroundColor?: string;
    containerStyle?: StyleProp<ViewStyle>;
    chipScrollStyle?: StyleProp<ViewStyle>;
    chipStyle?: StyleProp<ViewStyle>;
    activeChipStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    activeTextStyle?: StyleProp<TextStyle>;
}

/**
 * CustomFilterTabs — A unified, highly customizable horizontal filter tab bar component.
 * Encapsulates drag-to-scroll on web, gradient fade overlays on overflow, auto-centering, and visual variants.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement | null} Rendered horizontal filter tabs component.
 */
const CustomFilterTabs: React.FC<CustomFilterTabsProps> = ({
    tabs = [],
    activeTab,
    onTabSelect,
    variant = 'default',
    sortOrder,
    sortTabName = 'Rating',
    getTabCount,
    fadeBackgroundColor = Colors.BACKGROUND,
    containerStyle,
    chipScrollStyle,
    chipStyle,
    activeChipStyle,
    textStyle,
    activeTextStyle,
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
    useWebDragScroll(scrollViewRef, tabs.length > 0);

    // Auto-center the selected tab in the ScrollView viewport
    useEffect(() => {
        if (!activeTab || !tabLayouts[activeTab] || viewportWidth <= 0) return;
        const { x, width: tabWidth } = tabLayouts[activeTab];
        const scrollXTarget = x - (viewportWidth / 2) + (tabWidth / 2);
        scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollXTarget), animated: true });
    }, [activeTab, tabLayouts, viewportWidth]);

    if (!tabs || tabs.length === 0) return null;

    const isPill = variant === 'pill';

    return (
        <View style={[styles.chipContainer, containerStyle]}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipScroll, chipScrollStyle]}
                {...scrollProps}
            >
                {tabs.map((tabItem) => {
                    const tabKey = typeof tabItem === 'string' ? tabItem : tabItem.id || tabItem.label;
                    const tabLabel = typeof tabItem === 'string' ? tabItem : tabItem.label;
                    const isActive = activeTab === tabKey || activeTab === tabLabel;
                    const isSortTab = tabLabel === sortTabName;

                    // Determine count badge if provided
                    const directCount = typeof tabItem === 'object' ? tabItem.count : undefined;
                    const dynamicCount = getTabCount ? getTabCount(tabKey) : undefined;
                    const count = directCount ?? dynamicCount;

                    // Icon if defined in item object
                    const tabIcon = typeof tabItem === 'object' ? tabItem.icon : undefined;
                    const tabIconLibrary = typeof tabItem === 'object' ? tabItem.iconLibrary : undefined;

                    // Base style selections according to variant
                    const baseChipStyle = isPill ? styles.pillChip : styles.chip;
                    const baseActiveChipStyle = isPill ? styles.pillActiveChip : styles.activeChip;
                    const baseTextStyle = isPill ? styles.pillChipText : styles.chipText;
                    const baseActiveTextStyle = isPill ? styles.pillActiveChipText : styles.activeChipText;

                    return (
                        <TouchableOpacity
                            key={tabKey}
                            onPress={() => onTabSelect?.(tabKey)}
                            style={[
                                baseChipStyle,
                                chipStyle,
                                isActive && baseActiveChipStyle,
                                isActive && activeChipStyle,
                            ]}
                            activeOpacity={0.8}
                            onLayout={(e) => {
                                const { x, width: itemWidth } = e.nativeEvent.layout;
                                setTabLayouts((prev) => ({
                                    ...prev,
                                    [tabKey]: { x, width: itemWidth },
                                    ...(tabLabel !== tabKey ? { [tabLabel]: { x, width: itemWidth } } : {}),
                                }));
                            }}
                        >
                            <View style={styles.chipContent}>
                                {tabIcon ? (
                                    <CustomIcon
                                        library={tabIconLibrary || 'Feather'}
                                        name={tabIcon}
                                        size={14}
                                        color={isActive ? Colors.WHITE : Colors.TEXT_PRIMARY}
                                        style={styles.tabIcon}
                                    />
                                ) : null}

                                <CustomText
                                    style={[
                                        baseTextStyle,
                                        textStyle,
                                        isActive && baseActiveTextStyle,
                                        isActive && activeTextStyle,
                                    ]}
                                >
                                    {tabLabel}
                                    {count !== undefined ? ` (${count})` : ''}
                                </CustomText>

                                {isSortTab && isActive && sortOrder ? (
                                    <CustomIcon
                                        library="Feather"
                                        name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
                                        size={14}
                                        color={isActive ? Colors.WHITE : Colors.TEXT_PRIMARY}
                                        style={styles.ratingIcon}
                                    />
                                ) : null}
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
    chipContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                isolation: 'isolate',
            },
        }),
    },
    chipScroll: {
        gap: 10,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.CHIP_INACTIVE,
    },
    activeChip: {
        backgroundColor: Colors.CHIP_ACTIVE,
    },
    chipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    chipText: {
        fontWeight: '500',
        color: Colors.TEXT_PRIMARY,
    },
    activeChipText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
    },
    pillChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    pillActiveChip: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    pillChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    pillActiveChipText: {
        color: Colors.WHITE,
        fontWeight: '600',
    },
    tabIcon: {
        marginRight: 2,
    },
    ratingIcon: {
        marginLeft: 2,
    },
    leftFade: {
        position: 'absolute',
        left: -2,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: -2,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
});

export default CustomFilterTabs;
