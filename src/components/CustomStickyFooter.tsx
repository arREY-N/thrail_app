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
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

interface FooterButtonConfig {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    isLoading?: boolean;
    showIndicator?: boolean;
    badgeCount?: number;
}

/**
 * A sticky footer container usually placed at the bottom of forms or screens.
 */
interface CustomStickyFooterProps {
    primaryButton?: FooterButtonConfig;
    secondaryButton?: FooterButtonConfig;
    layout?: 'row' | 'column';
    style?: StyleProp<ViewStyle>;
}

/**
 * Calculates the exact scroll container paddingBottom needed so content 
 * is not obscured by CustomStickyFooter when scrolled to the very bottom.
 * 
 * - Web Desktop: 96px (86px footer + 10px breathing room)
 * - Mobile: Math.max(bottomInset + 102, 120) (~136px with 34px gesture bar)
 */
export const getStickyFooterScrollPadding = (bottomInset: number = 0, isMobile: boolean = false): number => {
    return isMobile ? Math.max(bottomInset + 102, 120) : 96;
};

const CustomStickyFooter: React.FC<CustomStickyFooterProps> = ({ 
    primaryButton, 
    secondaryButton,
    layout = 'row',
    style,
}) => {
    const insets = useSafeAreaInsets();
    const safeBottomPadding = Math.max(insets.bottom + 16, 16);

    if (!primaryButton) return null;

    return (
        <View style={[styles.footer, { paddingBottom: safeBottomPadding }, style]}>
            {secondaryButton ? (
                layout === 'column' ? (
                    <View style={styles.buttonColumn}>
                        <CustomButton 
                            title={primaryButton.title}
                            onPress={primaryButton.onPress}
                            variant={primaryButton.variant || 'primary'}
                            style={primaryButton.style}
                            textStyle={primaryButton.textStyle}
                            disabled={primaryButton.disabled}
                            isLoading={primaryButton.isLoading}
                        />
                        <CustomButton 
                            title={secondaryButton.title}
                            onPress={secondaryButton.onPress}
                            variant={secondaryButton.variant || 'outline'}
                            style={secondaryButton.style}
                            textStyle={secondaryButton.textStyle}
                            disabled={secondaryButton.disabled}
                            isLoading={secondaryButton.isLoading}
                        />
                    </View>
                ) : (
                    <View style={styles.buttonRow}>
                        <View style={styles.buttonWrapper}>
                            <CustomButton 
                                title={secondaryButton.title}
                                onPress={secondaryButton.onPress}
                                variant={secondaryButton.variant || 'outline'}
                                style={secondaryButton.style}
                                textStyle={secondaryButton.textStyle}
                                disabled={secondaryButton.disabled}
                                isLoading={secondaryButton.isLoading}
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
                                isLoading={primaryButton.isLoading}
                            />
                            {primaryButton.showIndicator && (
                                <View style={[
                                    styles.indicatorBadge,
                                    typeof primaryButton.badgeCount === 'number' && primaryButton.badgeCount > 0 && styles.indicatorBadgeWithCount
                                ]}>
                                    {typeof primaryButton.badgeCount === 'number' && primaryButton.badgeCount > 0 ? (
                                        <CustomText
                                            variant="caption"
                                            style={styles.indicatorBadgeText}
                                        >
                                            {primaryButton.badgeCount > 99 ? '99+' : String(primaryButton.badgeCount)}
                                        </CustomText>
                                    ) : (
                                        <View style={styles.indicatorDot} />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )
            ) : (
                <View style={styles.singleButtonWrapper}>
                    <CustomButton 
                        title={primaryButton.title}
                        onPress={primaryButton.onPress}
                        variant={primaryButton.variant || 'primary'}
                        style={primaryButton.style}
                        textStyle={primaryButton.textStyle}
                        disabled={primaryButton.disabled}
                        isLoading={primaryButton.isLoading}
                    />
                    {primaryButton.showIndicator && (
                        <View style={[
                            styles.indicatorBadge,
                            typeof primaryButton.badgeCount === 'number' && primaryButton.badgeCount > 0 && styles.indicatorBadgeWithCount
                        ]}>
                            {typeof primaryButton.badgeCount === 'number' && primaryButton.badgeCount > 0 ? (
                                <CustomText
                                    variant="caption"
                                    style={styles.indicatorBadgeText}
                                >
                                    {primaryButton.badgeCount > 99 ? '99+' : String(primaryButton.badgeCount)}
                                </CustomText>
                            ) : (
                                <View style={styles.indicatorDot} />
                            )}
                        </View>
                    )}
                </View>
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
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'transparent',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        // ...GlobalStyles.dropShadow(10, 0.1, Colors.SHADOW, {
        //     offset: { width: 0, height: -4 },
        //     radius: 4
        // }), 
    },
    buttonRow: { 
        flexDirection: 'row', 
        gap: 16, 
    },
    buttonColumn: {
        width: '100%',
        gap: 12,
    },
    buttonWrapper: { 
        flex: 1, 
        position: 'relative',
    },
    singleButtonWrapper: {
        width: '100%',
        position: 'relative',
    },
    indicatorBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 999,
        width: 14,
        height: 14,
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    indicatorBadgeWithCount: {
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        top: -8,
        right: -8,
        borderWidth: 2,
        borderColor: Colors.WHITE,
        backgroundColor: Colors.PRIMARY,
    },
    indicatorBadgeText: {
        color: Colors.WHITE,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false,
    },
    indicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.WHITE,
    },
});

export default CustomStickyFooter;
