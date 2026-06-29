import React, { ReactNode } from 'react';
import {
    Platform,
    StatusBar,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * A high-level layout component that wraps screens safely avoiding notches and bars.
 */
interface ScreenWrapperProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
    children, 
    style, 
    backgroundColor = Colors.BACKGROUND 
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

    return (
        <View 
            style={[
                styles.container, 
                { 
                    backgroundColor, 
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
                style={styles.keyboardContainer}
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