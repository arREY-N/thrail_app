/**
 * @file BusinessPoliciesScreen.tsx
 * @description View for displaying Booking & Organizer Policies.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from "react-native";

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { BOOKING_TERMS_TEXT } from '@/src/constants/legal';
import { LegalContentProps, LegalScreenProps } from '@/src/features/Legal/screens/TermsScreen';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export const BusinessPoliciesContent = ({ onScrollToBottom }: LegalContentProps) => {
    const [isAtBottom, setIsAtBottom] = useState(false);
    
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (!isAtBottom) setIsAtBottom(true);
            if (onScrollToBottom) onScrollToBottom();
        } else {
            if (isAtBottom) setIsAtBottom(false);
        }
    };

    return (
        <View style={styles.contentContainer}>
            <ResponsiveScrollView 
                onScroll={handleScroll} 
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                contentContainerStyle={styles.scrollContent}
            >
                <CustomText variant="body" style={styles.legalText}>
                    {BOOKING_TERMS_TEXT}
                </CustomText>
            </ResponsiveScrollView>
            
            {!isAtBottom && (
                <LinearGradient
                    colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE]}
                    style={styles.fadeOverlay}
                    pointerEvents="none"
                />
            )}
        </View>
    );
};

const BusinessPoliciesScreen = ({ onBackPress }: LegalScreenProps) => {
    const { isMobile } = useBreakpoints();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader centerTitle title="Booking Policies" onBackPress={onBackPress} />
            <View 
                style={[styles.pageContent, !isMobile && styles.desktopContent]}
            >
                <View style={styles.standaloneContainer}>
                    <BusinessPoliciesContent />
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    pageContent: {
        flex: 1,
        padding: 20,
        paddingBottom: 48,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    standaloneContainer: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    legalText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
    },
    fadeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
});

export default BusinessPoliciesScreen;
