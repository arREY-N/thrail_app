import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';

import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const ScreenWrapper = ({ children, style, backgroundColor = Colors.BACKGROUND }) => {
    
    const { isMobile } = useBreakpoints();

    let containerWidthStyle = {};

    if (isMobile) {
        containerWidthStyle = { width: '100%', maxWidth: '100%' }; 
    } else {
        containerWidthStyle = { width: '100%' }; 
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />

            <KeyboardAvoidingView 
                style={styles.keyboardContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={[styles.contentContainer, containerWidthStyle, style]}>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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