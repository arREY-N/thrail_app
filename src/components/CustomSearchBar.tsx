/**
 * @file CustomSearchBar.tsx
 * @description A customizable search bar component with trailing actions and scroll-centered category tabs.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for the CustomSearchBar component.
 * 
 * @param searchPlaceholder - The placeholder text for the search input.
 * @param searchValue - The current search query value.
 * @param onSearchChange - Callback fired when the search text changes.
 * @param rightIconLibrary - The icon library for the right action button.
 * @param rightIconName - The icon name for the right action button.
 * @param onRightButtonPress - Callback fired when the right action button is pressed.
 * @param tabs - Array of category tab names to display.
 * @param activeTab - The currently active category tab.
 * @param onTabSelect - Callback fired when a tab is selected.
 * @param sortOrder - The sort order for the rating/lists.
 */
interface CustomSearchBarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    rightIconLibrary?: IconLibrary;
    rightIconName?: string;
    onRightButtonPress?: () => void;
    tabs?: string[];
    activeTab?: string;
    onTabSelect?: (tab: string) => void;
    sortOrder?: 'asc' | 'desc';
}

/**
 * CustomSearchBar — A highly customizable search input bar that integrates
 * horizontal category tabs with linear-fade transitions and scroll centering.
 */
const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ 
    searchPlaceholder = "Search...",
    searchValue,
    onSearchChange,
    rightIconLibrary = "Feather",
    rightIconName,
    onRightButtonPress,
    tabs = [],
    activeTab,
    onTabSelect,
    sortOrder
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [viewportWidth, setViewportWidth] = useState<number>(0);
    const [contentWidth, setContentWidth] = useState<number>(0);
    const [scrollX, setScrollX] = useState<number>(0);
    const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

    // Auto-center the selected tab in the ScrollView viewport
    useEffect(() => {
        if (!activeTab || !tabLayouts[activeTab] || viewportWidth <= 0) return;
        const { x, width: tabWidth } = tabLayouts[activeTab];
        const scrollXTarget = x - (viewportWidth / 2) + (tabWidth / 2);
        scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollXTarget), animated: true });
    }, [activeTab, tabLayouts, viewportWidth]);

    // Determine when edge fades are needed based on active scrolling
    const showLeftFade = scrollX > 5;
    const showRightFade = scrollX < contentWidth - viewportWidth - 5 && contentWidth > viewportWidth;

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <View style={styles.inputWrapper}>
                    <CustomTextInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChangeText={onSearchChange as any}
                        icon="search"
                        iconLibrary="Feather"
                        style={styles.searchInputContainer}
                        inputStyle={styles.searchInput}
                    />
                    
                    {(searchValue?.length ?? 0) > 0 && (
                        <TouchableOpacity 
                            style={styles.clearButton} 
                            onPress={() => onSearchChange?.('')}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="x-circle" size={18} color={Colors.GRAY_MEDIUM} />
                        </TouchableOpacity>
                    )}
                </View>
                {rightIconName ? (
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={onRightButtonPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library={rightIconLibrary} 
                            name={rightIconName} 
                            size={24} 
                            color={Colors.PRIMARY} 
                        />
                    </TouchableOpacity>
                ) : null}
            </View>

            {tabs && tabs.length > 0 && (
                <View style={styles.chipContainer}>
                    {showLeftFade && (
                        <LinearGradient 
                            colors={[Colors.WHITE, 'rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0)']} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }} 
                            style={styles.leftFade} 
                            pointerEvents="none" 
                        />
                    )}
                    <ScrollView 
                        ref={scrollViewRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScroll}
                        onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
                        onContentSizeChange={(w) => setContentWidth(w)}
                        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                        scrollEventThrottle={16}
                    >
                        {tabs.map((tab: string) => {
                            const isActive = activeTab === tab;
                            const isRatingTab = tab === 'Rating';
                            return (
                                <TouchableOpacity 
                                    key={tab} 
                                    onPress={() => onTabSelect?.(tab)}
                                    style={[
                                        styles.chip,
                                        isActive && styles.activeChip
                                    ]}
                                    activeOpacity={0.8}
                                    onLayout={(e) => {
                                        const { x, width: itemWidth } = e.nativeEvent.layout;
                                        setTabLayouts(prev => ({ ...prev, [tab]: { x, width: itemWidth } }));
                                    }}
                                >
                                    <View style={styles.chipContent}>
                                        <CustomText 
                                            style={[
                                                styles.chipText,
                                                isActive && styles.activeChipText
                                            ]}
                                        >
                                            {tab}
                                        </CustomText>
                                        {isRatingTab && isActive && sortOrder && (
                                            <CustomIcon 
                                                library="Feather" 
                                                name={sortOrder === 'desc' ? "arrow-up" : "arrow-down"} 
                                                size={14} 
                                                color={isActive ? Colors.TEXT_INVERSE : Colors.TEXT_PRIMARY} 
                                                style={styles.ratingIcon}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    {showRightFade && (
                        <LinearGradient 
                            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.75)', Colors.WHITE]} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }} 
                            style={styles.rightFade} 
                            pointerEvents="none" 
                        />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    searchInputContainer: {
        marginBottom: 0,
    },
    searchInput: {
        paddingRight: 16,
    },
    clearButton: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    iconButton: {
        width: 54,
        height: 54,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
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
    chipText: {
        fontWeight: '500',
        color: Colors.TEXT_PRIMARY,
    },
    activeChipText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
    },
    chipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingIcon: {
        marginLeft: 2,
    },
    leftFade: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
});

export default CustomSearchBar;
