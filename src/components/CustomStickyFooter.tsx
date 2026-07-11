import React from 'react';
import { 
    GestureResponderEvent,
    StyleProp,
    StyleSheet, 
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';

interface FooterButtonConfig {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
}

/**
 * A sticky footer container usually placed at the bottom of forms or screens.
 */
interface CustomStickyFooterProps {
    primaryButton?: FooterButtonConfig;
    secondaryButton?: FooterButtonConfig;
}

const CustomStickyFooter: React.FC<CustomStickyFooterProps> = ({ primaryButton, secondaryButton }) => {
    const insets = useSafeAreaInsets();
    const safeBottomPadding = Math.max(insets.bottom, 16);

    if (!primaryButton) return null;

    return (
        <View style={[styles.footer, { paddingBottom: safeBottomPadding }]}>
            {secondaryButton ? (
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrapper}>
                        <CustomButton 
                            title={secondaryButton.title}
                            onPress={secondaryButton.onPress}
                            variant={secondaryButton.variant || 'outline'}
                            style={secondaryButton.style}
                            textStyle={secondaryButton.textStyle}
                            disabled={secondaryButton.disabled}
                        />
                    </View>
                    <View style={styles.buttonWrapper}>
                        <CustomButton 
                            title={primaryButton.title}
                            onPress={primaryButton.onPress}
                            variant={primaryButton.variant || 'primary'}
                            style={primaryButton.style}
                            textStyle={primaryButton.textStyle}
                            disabled={primaryButton.disabled}
                        />
                    </View>
                </View>
            ) : (
                <CustomButton 
                    title={primaryButton.title}
                    onPress={primaryButton.onPress}
                    variant={primaryButton.variant || 'primary'}
                    style={primaryButton.style}
                    textStyle={primaryButton.textStyle}
                    disabled={primaryButton.disabled}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center', 
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        ...GlobalStyles.dropShadow(10, 0.1, Colors.SHADOW, {
            offset: { width: 0, height: -4 },
            radius: 4
        }), 
    },
    buttonRow: { 
        flexDirection: 'row', 
        gap: 16 
    },
    buttonWrapper: { 
        flex: 1 
    }
});

export default CustomStickyFooter;
