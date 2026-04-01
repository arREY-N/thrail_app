import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const getPillStyles = (tab, isActive) => {
    if (!isActive) {
        return {
            bgColor: Colors.GRAY_ULTRALIGHT,
            borderColor: Colors.GRAY_LIGHT,
            textColor: Colors.TEXT_SECONDARY,
        };
    }

    switch (tab) {
        case 'All':
            return {
                bgColor: Colors.PRIMARY,
                borderColor: Colors.PRIMARY,
                textColor: Colors.WHITE,
            };
        case 'Pending':
            return {
                bgColor: Colors.STATUS_PENDING_BG,
                borderColor: Colors.STATUS_PENDING_BORDER,
                textColor: Colors.STATUS_PENDING_TEXT,
            };
        case 'Approved':
            return {
                bgColor: Colors.STATUS_APPROVED_BG,
                borderColor: Colors.STATUS_APPROVED_BORDER,
                textColor: Colors.STATUS_APPROVED_TEXT,
            };
        case 'Paid':
            return {
                bgColor: Colors.STATUS_APPROVED_BG,
                borderColor: Colors.SUCCESS,
                textColor: Colors.STATUS_APPROVED_TEXT,
            };
        case 'Cancelled':
            return {
                bgColor: Colors.STATUS_CANCELLED_BG,
                borderColor: Colors.STATUS_CANCELLED_BORDER,
                textColor: Colors.ERROR,
            };
        default:
            return {
                bgColor: Colors.GRAY_MEDIUM,
                borderColor: Colors.GRAY_MEDIUM,
                textColor: Colors.WHITE,
            };
    }
};

const BookTabs = ({ 
    tabs,
    activeTab, 
    onTabChange 
}) => {
    if (!tabs || tabs.length === 0) return null;

    return (
        <View style={styles.tabContainer}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.tabScrollContent}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    const styleConfig = getPillStyles(tab, isActive);
                    
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tabPill, 
                                { 
                                    backgroundColor: styleConfig.bgColor,
                                    borderColor: styleConfig.borderColor,
                                }
                            ]}
                            onPress={() => onTabChange(tab)}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                variant="label" 
                                style={[
                                    styles.tabText, 
                                    { color: styleConfig.textColor }
                                ]}
                            >
                                {tab}
                            </CustomText>
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
        paddingHorizontal: 20, 
        paddingVertical: 8, 
        borderRadius: 20, 
        borderWidth: 1.5,
    },
    tabText: { 
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default BookTabs;