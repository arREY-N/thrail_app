/**
 * @file TermsScreen.tsx
 * @description View for displaying the Terms of Service.
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
import { TERMS_TEXT } from '@/src/constants/legal';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the TermsContent component.
 * @param onScrollToBottom - Callback triggered when the user scrolls to the bottom of the terms text.
 */
export interface LegalContentProps {
    onScrollToBottom?: () => void;
}

/**
 * Props for the LegalScreen component.
 * @param onBackPress - Callback to navigate back.
 */
export interface LegalScreenProps {
    onBackPress?: () => void;
}

export const TermsContent = ({ onScrollToBottom }: LegalContentProps) => {
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
                    {TERMS_TEXT}
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

const TermsScreen = ({ onBackPress }: LegalScreenProps) => {
    const { isMobile } = useBreakpoints();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader centerTitle title="Terms of Service" onBackPress={onBackPress} />
            <View 
                style={[styles.pageContent, !isMobile && styles.desktopContent]}
            >
                <View style={styles.standaloneContainer}>
                    <TermsContent />
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
    contentContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.WHITE,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 40,
        paddingLeft: 20,
    },
    standaloneContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    legalText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 24,
        textAlign: 'justify',
        paddingRight: 20,
    },
    fadeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
});

export default TermsScreen;
