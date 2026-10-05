import React from 'react';
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
}

const BookTabs: React.FC<BookTabsProps> = ({ 
    tabs,
    activeTab, 
    onTabChange,
    style,
    contentContainerStyle,
}) => {
    if (!tabs || tabs.length === 0) return null;

    return (
        <View style={[styles.tabContainer, style]}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={[styles.tabScrollContent, contentContainerStyle]}
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
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: { 
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
});

export default BookTabs;