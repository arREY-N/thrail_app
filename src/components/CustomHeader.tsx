/**
 * @file CustomHeader.tsx
 * @description Unified application header component with three visual variants:
 * - `standard` (default): Standard user-facing header with back button, title, actions, and embedded search bar.
 * - `dashboard`: Admin/Superadmin shell header with drawer toggle, expandable mobile search, and flat container styling.
 * - `hybrid`: Standard header visuals (BACKGROUND bg, centered title, back button) with dashboard search capability.
 */

import React, { ReactNode, useState } from 'react';
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomSearchBar from '@/src/components/CustomSearchBar';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

/**
 * Interface representing the properties of the CustomHeader component.
 * 
 * @param title - Header title text.
 * @param onBackPress - Callback when back button is pressed (standard variant).
 * @param leftAction - Custom ReactNode overriding the default left element.
 * @param rightActions - Custom ReactNode rendered in the right section.
 * @param showDefaultIcons - Flag to show default notification and booking icons (standard variant).
 * @param centerTitle - Flag to center the title text (standard variant).
 * @param hasSearch - Flag to embed a full CustomSearchBar below the title row (standard variant).
 * @param searchProps - Props bag passed to the embedded CustomSearchBar (standard variant).
 * @param style - Custom style override for the header container.
 * @param children - Custom ReactNode children rendered in the title area.
 * @param variant - Visual variant: 'standard' (user-facing), 'dashboard' (admin shell header), or 'hybrid' (standard visuals + dashboard search).
 * @param onToggleDrawer - Callback to open mobile side drawer (dashboard variant).
 * @param isMobile - Flag indicating mobile/tablet layout mode (dashboard variant).
 * @param enableSearch - Flag to enable expandable search icon on mobile (dashboard variant).
 * @param searchValue - Active search text input value (dashboard variant).
 * @param onSearchChange - Callback when search text changes (dashboard variant).
 * @param searchPlaceholder - Custom placeholder text for search input (dashboard variant).
 */
export interface CustomHeaderProps {
    title?: string;
    onBackPress?: () => void;
    leftAction?: ReactNode;
    rightActions?: ReactNode;
    showDefaultIcons?: boolean;
    centerTitle?: boolean;
    hasSearch?: boolean;
    searchProps?: Record<string, any>;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
    variant?: 'standard' | 'dashboard' | 'hybrid';
    onToggleDrawer?: () => void;
    isMobile?: boolean;
    enableSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    searchPlaceholder?: string;
}

/**
 * CustomHeader — Unified application header supporting standard user-facing, dashboard admin, and hybrid layouts.
 * 
 * - `standard` (default): Title row with back button, left/right actions, optional embedded search bar with rounded corners.
 * - `dashboard`: Flat header with drawer toggle, centered mobile title, and expandable search mode using compact CustomSearchBar.
 * - `hybrid`: Standard header visuals (BACKGROUND bg, no border, centered title, back button) with dashboard expandable search.
 *
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered header component.
 */
const CustomHeader: React.FC<CustomHeaderProps> = ({ 
    title, 
    onBackPress, 
    leftAction,
    rightActions, 
    showDefaultIcons = false,
    centerTitle = false,
    hasSearch = false,
    searchProps = {},
    style,
    children,
    variant = 'standard',
    onToggleDrawer,
    isMobile = false,
    enableSearch = false,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
}) => {

    // Always called unconditionally (Rules of Hooks compliance)
    const { 
        onNotificationPress, 
        onBookingPress,
    } = useAppNavigation();

    const [isMobileSearchActive, setIsMobileSearchActive] = useState<boolean>(false);

    // ── Dashboard Variant (admin/superadmin shell header) ──
    if (variant === 'dashboard') {

        // Expandable Mobile Search Mode: Hides title & drawer menu, shows Back Arrow (←) + borderless compact CustomSearchBar
        if (isMobile && enableSearch && isMobileSearchActive) {
            return (
                <View style={[dashboardStyles.container, dashboardStyles.containerMobileSearch]}>
                    <TouchableOpacity
                        style={dashboardStyles.backButton}
                        onPress={() => {
                            setIsMobileSearchActive(false);
                            onSearchChange?.('');
                        }}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="chevron-left" 
                            size={24} 
                            color={Colors.PRIMARY} 
                            style={styles.backButtonIcon}
                        />
                    </TouchableOpacity>

                    <CustomSearchBar
                        variant="compact"
                        searchValue={searchValue}
                        onSearchChange={onSearchChange}
                        searchPlaceholder={searchPlaceholder}
                        autoFocus={true}
                        isMobile={true}
                    />
                </View>
            );
        }

        return (
            <View style={[dashboardStyles.container, isMobile && dashboardStyles.containerMobile]}>
                <View style={dashboardStyles.leftSection}>
                    {leftAction ? (
                        leftAction
                    ) : isMobile && onToggleDrawer ? (
                        <TouchableOpacity
                            style={dashboardStyles.backButton}
                            onPress={onToggleDrawer}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="menu" size={24} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    ) : null}
                    {!isMobile && (
                        <CustomText variant="h2" style={dashboardStyles.titleTextDesktop} numberOfLines={1}>
                            {title}
                        </CustomText>
                    )}
                </View>

                {/* Centered Title for Mobile */}
                {isMobile && (
                    <View style={dashboardStyles.centerBox} pointerEvents="none">
                        <CustomText variant="h2" style={dashboardStyles.titleTextMobile} numberOfLines={1}>
                            {title}
                        </CustomText>
                    </View>
                )}

                <View style={dashboardStyles.rightSection}>
                    {enableSearch && (
                        isMobile ? (
                            <TouchableOpacity
                                style={dashboardStyles.searchButton}
                                onPress={() => setIsMobileSearchActive(true)}
                                activeOpacity={0.7}
                            >
                                <CustomIcon library="Feather" name="search" size={24} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        ) : (
                            <CustomSearchBar
                                variant="compact"
                                searchValue={searchValue}
                                onSearchChange={onSearchChange}
                                searchPlaceholder={searchPlaceholder}
                                isMobile={false}
                            />
                        )
                    )}

                    {rightActions}
                </View>
            </View>
        );
    }

    // ── Hybrid Variant (standard visuals + dashboard search capability) ──
    if (variant === 'hybrid') {

        // Expandable Mobile Search Mode: White bg + green bottom border
        if (isMobile && enableSearch && isMobileSearchActive) {
            return (
                <View style={hybridStyles.searchActiveContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            setIsMobileSearchActive(false);
                            onSearchChange?.('');
                        }}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="chevron-left" 
                            size={24} 
                            color={Colors.PRIMARY} 
                            style={styles.backButtonIcon}
                        />
                    </TouchableOpacity>

                    <CustomSearchBar
                        variant="compact"
                        searchValue={searchValue}
                        onSearchChange={onSearchChange}
                        searchPlaceholder={searchPlaceholder}
                        autoFocus={true}
                        isMobile={true}
                    />
                </View>
            );
        }

        // Normal Mode: Standard header layout with no border (syncs with body)
        return (
            <View style={{ zIndex: 100 }}>
                <View style={[styles.masterContainer, styles.flatHeader, style]}>
                    <View style={styles.titleRow}>

                        {/* === LEFT SECTION: Back Button === */}
                        <View style={styles.leftBoxCentered} pointerEvents="box-none">
                            {onBackPress && (
                                <TouchableOpacity 
                                    onPress={onBackPress} 
                                    style={styles.backButton}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon 
                                        library="Feather" 
                                        name="chevron-left"
                                        size={24}
                                        color={Colors.PRIMARY} 
                                        style={styles.backButtonIcon}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* === CENTER SECTION: Title (always centered) === */}
                        <View style={styles.centerBox} pointerEvents="none">
                            <CustomText variant="h2" style={styles.centerTitle} numberOfLines={1}>
                                {title}
                            </CustomText>
                        </View>

                        {/* === RIGHT SECTION: Search + Actions === */}
                        <View style={styles.rightBoxCentered} pointerEvents="box-none">
                            <View style={styles.rightActionsInner}>
                                {enableSearch && (
                                    isMobile ? (
                                        <TouchableOpacity
                                            style={styles.actionIcon}
                                            onPress={() => setIsMobileSearchActive(true)}
                                            activeOpacity={0.7}
                                        >
                                            <CustomIcon library="Feather" name="search" size={24} color={Colors.PRIMARY} />
                                        </TouchableOpacity>
                                    ) : (
                                        <CustomSearchBar
                                            variant="compact"
                                            searchValue={searchValue}
                                            onSearchChange={onSearchChange}
                                            searchPlaceholder={searchPlaceholder}
                                            isMobile={false}
                                        />
                                    )
                                )}
                                {rightActions}
                            </View>
                        </View>

                    </View>
                </View>
            </View>
        );
    }

    // ── Standard Variant (original user-facing header) ──
    const enhancedSearchProps = {
        ...searchProps,
        onSearchChange: searchProps.onChangeText || searchProps.onSearchChange,
    };

    return (
        <View style={hasSearch ? { overflow: 'hidden', paddingBottom: 15 } : { zIndex: 100 }}>
            <View style={[
                styles.masterContainer, 
                hasSearch ? styles.withSearchShadowAndRadius : styles.flatHeader, 
                hasSearch && { marginTop: -10, paddingTop: 10 },
                style
            ]}>
                <View style={styles.titleRow}>
                    
                    {/* === LEFT SECTION === */}
                    <View style={centerTitle ? styles.leftBoxCentered : styles.leftBoxStandard} pointerEvents="box-none">
                        {leftAction ? leftAction : (onBackPress ? (
                            <TouchableOpacity 
                                onPress={onBackPress} 
                                style={styles.backButton}
                                activeOpacity={0.7}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="chevron-left"
                                    size={24}
                                    color={Colors.PRIMARY} 
                                    style={styles.backButtonIcon}
                                />
                            </TouchableOpacity>
                        ) : (
                            !centerTitle && (
                                children ? children : (
                                    <CustomText variant="title" style={styles.headline} numberOfLines={1}>
                                        {title}
                                    </CustomText>
                                )
                            )
                        ))}
                    </View>

                    {/* === CENTER SECTION === */}
                    {centerTitle && (
                        <View style={styles.centerBox} pointerEvents="none">
                            {children ? children : (
                                <CustomText variant="h2" style={styles.centerTitle} numberOfLines={1}>
                                    {title}
                                </CustomText>
                            )}
                        </View>
                    )}

                    {/* === RIGHT SECTION === */}
                    <View style={centerTitle ? styles.rightBoxCentered : styles.rightBoxStandard} pointerEvents="box-none">
                        <View style={styles.rightActionsInner}>
                            {showDefaultIcons && (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionIcon}
                                        onPress={onNotificationPress}
                                    >
                                        <CustomIcon 
                                            library="Ionicons" 
                                            name="notifications"
                                            size={24}
                                            color={Colors.PRIMARY} 
                                        />
                                    </TouchableOpacity>
 
                                    <TouchableOpacity
                                        style={styles.actionIcon}
                                        onPress={onBookingPress}
                                    >
                                        <CustomIcon 
                                            library="Ionicons" 
                                            name="calendar-clear"
                                            size={24}
                                            color={Colors.PRIMARY}
                                        />
                                    </TouchableOpacity>
                                </>
                            )}
                            {rightActions}
                        </View>
                    </View>

                </View>

                {/* Embedded Search Bar */}
                {hasSearch && (
                    <CustomSearchBar {...enhancedSearchProps} />
                )}
                
            </View>
        </View>
    );
};

// ── Standard Variant Styles ──
const styles = StyleSheet.create({
    masterContainer: {
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
    },
    flatHeader: {
        ...GlobalStyles.dropShadow(0, 0),
        borderBottomWidth: 0,
    },
    withSearchShadowAndRadius: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...GlobalStyles.dropShadow(4, 0.1, Colors.SHADOW, { radius: 4 }),
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    titleRow: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    leftBoxCentered: {
        flex: 1,
        alignItems: 'flex-start',
        zIndex: 10,
    },
    leftBoxStandard: {
        flex: 1,
        alignItems: 'flex-start',
        zIndex: 10,
    },
    centerBox: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        paddingHorizontal: 56,
    },
    rightBoxCentered: {
        flex: 1,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    rightBoxStandard: {
        alignItems: 'flex-end',
        zIndex: 10,
    },
    rightActionsInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 6,
        marginLeft: -6, 
    },
    backButtonIcon: {},
    headline: {
        textAlign: 'left',
        marginBottom: 0,
    },
    centerTitle: {
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 0,
        textAlign: 'center',
    },
    actionIcon: {
        padding: 4,
    },
});

// ── Dashboard Variant Styles ──
const dashboardStyles = StyleSheet.create({
    container: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
        gap: 12,
    },
    containerMobile: {
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    containerMobileSearch: {
        justifyContent: 'flex-start',
        backgroundColor: Colors.WHITE,
        borderBottomColor: Colors.PRIMARY,
        borderBottomWidth: 2,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        zIndex: 10,
    },
    centerBox: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        paddingHorizontal: 56,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
    },
    titleTextMobile: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
        textAlign: 'center',
    },
    titleTextDesktop: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
        fontWeight: 'bold',
        fontSize: 18,
    },
    backButton: {
        padding: 6,
        marginLeft: -6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchButton: {
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

// ── Hybrid Variant Styles ──
const hybridStyles = StyleSheet.create({
    searchActiveContainer: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.WHITE,
        borderBottomColor: Colors.PRIMARY,
        borderBottomWidth: 2,
        gap: 12,
    },
});

export default CustomHeader;