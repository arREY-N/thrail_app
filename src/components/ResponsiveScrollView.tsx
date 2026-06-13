import React, { ReactNode } from 'react';
import {
    ScrollView,
    ScrollViewProps,
    StyleProp,
    StyleSheet,
    ViewStyle,
    useWindowDimensions
} from 'react-native';

/**
 * A responsive scroll view wrapper that adjusts padding for desktop/mobile views.
 */
interface ResponsiveScrollViewProps extends ScrollViewProps {
    children?: ReactNode;
    minHeight?: number;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

const ResponsiveScrollView: React.FC<ResponsiveScrollViewProps> = ({ 
    children, 
    minHeight = 600, 
    contentContainerStyle, 
    ...props 
}) => {
    
    const { height } = useWindowDimensions();
    
    const isShortScreen: boolean = height < minHeight;

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