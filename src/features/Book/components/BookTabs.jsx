import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

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
                    
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tabPill, 
                                isActive ? styles.activePill : styles.inactivePill
                            ]}
                            onPress={() => onTabChange(tab)}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                variant="label" 
                                style={[
                                    styles.tabText, 
                                    isActive ? styles.activeText : styles.inactiveText
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
        borderWidth: 1,
    },
    activePill: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    inactivePill: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    tabText: { 
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeText: {
        color: Colors.WHITE,
    },
    inactiveText: {
        color: Colors.TEXT_SECONDARY,
    },
});

export default BookTabs;