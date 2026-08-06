import React, { ReactNode, useState } from 'react';
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
    contentHeightOffset?: number;
}

const ResponsiveScrollView: React.FC<ResponsiveScrollViewProps> = ({ 
    children, 
    minHeight = 600, 
    contentContainerStyle, 
    bounces = false,
    overScrollMode = 'never',
    scrollEnabled,
    contentHeightOffset = 0,
    ...props 
}) => {
    
    const { height } = useWindowDimensions();
    const [contentHeight, setContentHeight] = useState(0);
    const [layoutHeight, setLayoutHeight] = useState(0);
    
    const isShortScreen: boolean = height < minHeight;
    
    const isScrollNeeded = (contentHeight - contentHeightOffset) > layoutHeight + 2 || contentHeight === 0 || layoutHeight === 0;
    const finalScrollEnabled = scrollEnabled !== undefined ? scrollEnabled : isScrollNeeded;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.scrollContent,
                isShortScreen && { minHeight },
                contentContainerStyle
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={bounces}
            overScrollMode={overScrollMode}
            scrollEnabled={finalScrollEnabled}
            onContentSizeChange={(w, h) => setContentHeight(h)}
            onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
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