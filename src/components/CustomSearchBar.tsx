/**
 * @file CustomSearchBar.tsx
 * @description A customizable search bar component with two visual variants:
 * - `standard` (default): Full search bar with CustomTextInput, trailing action button, and integrated filter tabs.
 * - `compact`: Minimal header-embedded search input with focus-state green border (desktop) and borderless mobile mode.
 */

import React, { useEffect, useState } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomTextInput from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for the CustomSearchBar component.
 * 
 * @param searchPlaceholder - The placeholder text for the search input.
 * @param searchValue - The current search query value.
 * @param onSearchChange - Callback fired when the search text changes.
 * @param rightIconLibrary - The icon library for the right action button (standard variant).
 * @param rightIconName - The icon name for the right action button (standard variant).
 * @param onRightButtonPress - Callback fired when the right action button is pressed (standard variant).
 * @param tabs - Array of category tab names to display (standard variant).
 * @param activeTab - The currently active category tab (standard variant).
 * @param onTabSelect - Callback fired when a tab is selected (standard variant).
 * @param sortOrder - The sort order for the rating/lists (standard variant).
 * @param variant - Visual variant: 'standard' (full bar with tabs) or 'compact' (minimal header-embedded input).
 * @param autoFocus - Flag to auto-focus input on mount (compact variant).
 * @param isMobile - Flag for borderless mobile mode (compact variant).
 */
export interface CustomSearchBarProps {
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
    variant?: 'standard' | 'compact';
    autoFocus?: boolean;
    isMobile?: boolean;
}

/**
 * CustomSearchBar — A customizable search bar supporting two visual variants.
 * 
 * - `standard` (default): Full search input with optional right action button and horizontal filter tabs.
 * - `compact`: Minimal header-embedded input with green focus border (desktop) and borderless mode (mobile).
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} Rendered search bar component.
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
    sortOrder,
    variant = 'standard',
    autoFocus = false,
    isMobile = false,
}) => {
    const [localQuery, setLocalQuery] = useState(searchValue || "");
    const [isFocused, setIsFocused] = useState<boolean>(false);

    // Keep local query in sync with incoming search value
    useEffect(() => {
        setLocalQuery(searchValue || "");
    }, [searchValue]);

    // Debounce query propagation to parent to optimize list updates
    useEffect(() => {
        const handler = setTimeout(() => {
            if (onSearchChange && localQuery !== (searchValue || "")) {
                onSearchChange(localQuery);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [localQuery, searchValue, onSearchChange]);

    const handleClear = () => {
        setLocalQuery('');
        onSearchChange?.('');
    };

    const hasText = localQuery.length > 0;

    // ── Compact Variant (header-embedded minimal input) ──
    if (variant === 'compact') {
        return (
            <View
                style={[
                    compactStyles.inputWrapper,
                    isMobile ? compactStyles.inputWrapperMobile : compactStyles.inputWrapperDesktop,
                    isFocused && !isMobile && compactStyles.inputWrapperFocused,
                ]}
            >
                {!isMobile && (
                    <CustomIcon
                        library="Feather"
                        name="search"
                        size={16}
                        color={isFocused ? Colors.PRIMARY : Colors.GRAY_MEDIUM}
                        style={compactStyles.searchIcon}
                    />
                )}
                <TextInput
                    style={[compactStyles.input, isMobile ? compactStyles.inputMobile : compactStyles.inputDesktop]}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                    value={localQuery}
                    onChangeText={setLocalQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus={autoFocus}
                />
                {hasText ? (
                    <TouchableOpacity
                        style={compactStyles.clearButton}
                        onPress={handleClear}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <CustomIcon library="Feather" name="x-circle" size={20} color={Colors.GRAY_MEDIUM} />
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    }

    // ── Standard Variant (full search bar with tabs) ──
    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <View style={styles.inputWrapper}>
                    <CustomTextInput
                        placeholder={searchPlaceholder}
                        value={localQuery}
                        onChangeText={setLocalQuery}
                        icon="search"
                        iconLibrary="Feather"
                        style={styles.searchInputContainer}
                        inputStyle={styles.searchInput}
                    />
                    
                    {(localQuery.length ?? 0) > 0 && (
                        <TouchableOpacity 
                            style={styles.clearButton} 
                            onPress={handleClear}
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
                <CustomFilterTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabSelect={onTabSelect}
                    sortOrder={sortOrder}
                    sortTabName="Rating"
                />
            )}
        </View>
    );
};

// ── Standard Variant Styles ──
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
});

// ── Compact Variant Styles ──
const compactStyles = StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 10,
    },
    inputWrapperFocused: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.WHITE,
    },
    inputWrapperDesktop: {
        width: 280,
        height: 38,
    },
    inputWrapperMobile: {
        flex: 1,
        height: 40,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    searchIcon: {
        marginRight: 6,
    },
    input: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
        paddingVertical: 0,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            } as Record<string, string>,
        }),
    },
    inputDesktop: {
        fontSize: 13,
    },
    inputMobile: {
        fontSize: 14,
    },
    clearButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomSearchBar;
