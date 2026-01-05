import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

const ResponsiveScrollView = ({ children, minHeight = 600, contentContainerStyle, ...props }) => {
    
    const { height } = useWindowDimensions();
    
    const isShortScreen = height < minHeight;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.scrollContent,
                { minHeight: isShortScreen ? minHeight : '100%' },
                contentContainerStyle
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            {...props} 
        >
            {children}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        width: '100%',
    },
});

export default ResponsiveScrollView;