import React from 'react';
import { StyleSheet, View } from "react-native";

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { TERMS_TEXT } from '@/src/constants/legal';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';

export const TermsContent = ({ onScrollToBottom }) => {
    
    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (onScrollToBottom) onScrollToBottom();
        }
    };

    return (
        <View style={styles.contentContainer}>
            <ResponsiveScrollView 
                onScroll={handleScroll} 
                scrollEventThrottle={16}
            >
                <CustomText variant="body" style={styles.legalText}>
                    {TERMS_TEXT}
                </CustomText>
            </ResponsiveScrollView>
        </View>
    );
};

const TermsScreen = ({ onBackPress }) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <CustomHeader onBackPress={onBackPress} />

                <View style={AuthStyles.pageContent}>
                    <View style={AuthStyles.formConstrainer}>
                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Terms of Service
                        </CustomText>
                        
                        <View style={styles.standaloneContainer}>
                            <TermsContent />
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.WHITE,
        padding: 16,
    },
    standaloneContainer: {
        height: 500,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    legalText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
    },
});

export default TermsScreen;