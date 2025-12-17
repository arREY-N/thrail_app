import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useBreakpoints } from '../hooks/useBreakpoints';

const ScreenWrapper = ({ children, style, backgroundColor = Colors.Background }) => {
    
    const { isMobile, isTablet, isDesktop } = useBreakpoints();

    let containerWidthStyle = {};

    if (isMobile) {
        containerWidthStyle = { width: '100%', maxWidth: '100%' }; 
    } else if (isTablet) {
        containerWidthStyle = { width: '100%', maxWidth: 600 }; 
    } else {
        containerWidthStyle = { width: '100%', maxWidth: 1440 }; 
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />

            <KeyboardAvoidingView 
                style={styles.keyboardContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={[styles.contentContainer, containerWidthStyle, style]}>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        alignSelf: 'center',
    },
});

export default ScreenWrapper;