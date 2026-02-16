import React from 'react';
import { StyleSheet, View } from "react-native";

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';

export const TermsContent = () => (
    <View style={styles.contentContainer}>
        <ResponsiveScrollView>
            <CustomText variant="body" style={styles.legalText}>
                [TERMS OF SERVICE]
                {'\n'}{'\n'}
                1. Introduction{'\n'}
                Welcome to Thrail. These are our general terms of use. Please read them carefully.
                {'\n'}{'\n'}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                {'\n'}{'\n'}
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                {'\n'}{'\n'}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                {'\n'}{'\n'}
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                {'\n'}{'\n'}
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                {'\n'}{'\n'}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                {'\n'}{'\n'}
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                {'\n'}{'\n'}
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                {'\n'}{'\n'}
                [End of Terms]
            </CustomText>
        </ResponsiveScrollView>
    </View>
);

const TermsScreen = ({ onBackPress }) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <CustomHeader 
                    onBackPress={onBackPress} 
                />

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