import React, { ReactNode } from 'react';
import {
    StatusBar,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * A high-level layout component that wraps screens safely avoiding notches and bars.
 */
interface ScreenWrapperProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
    statusBarBackgroundColor?: string;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
    children, 
    style, 
    backgroundColor = Colors.BACKGROUND,
    statusBarBackgroundColor,
}) => {
    
    const { isMobile } = useBreakpoints();
    const insets = useSafeAreaInsets();

    let containerWidthStyle: StyleProp<ViewStyle> = {};

    if (isMobile) {
        containerWidthStyle = { 
            width: '100%', 
            maxWidth: '100%' 
        }; 
    } else {
        containerWidthStyle = { 
            width: '100%' 
        }; 
    }

    const topInsetBg = statusBarBackgroundColor || backgroundColor;

    return (
        <View 
            style={[
                styles.container, 
                { 
                    backgroundColor: topInsetBg, 
                    paddingTop: insets.top 
                }
            ]}
        >
            <StatusBar 
                barStyle="dark-content" 
                backgroundColor="transparent" 
                translucent 
            />

            <KeyboardAvoidingView 
                style={[styles.keyboardContainer, { backgroundColor }]}
                behavior="padding"
            >
                <View 
                    style={[
                        styles.contentContainer, 
                        containerWidthStyle, 
                        style
                    ]}
                >
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