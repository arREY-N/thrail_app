import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
    GestureResponderEvent,
    LayoutChangeEvent,
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton, { ButtonValidationState } from '@/src/components/CustomButton';
import CustomText from '@/src/components/CustomText';
import { ToastContext, ToastMode, ToastType } from '@/src/components/Toast/Toast';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    TargetSpotlightType,
} from '@/src/components/Tutorial/Tutorial';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

export interface FooterButtonConfig {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    isLoading?: boolean;
    showIndicator?: boolean;
    badgeCount?: number;
    disabledToastMessage?: string;
    disabledToastType?: ToastType;
    disabledToastMode?: ToastMode;
    onToastHide?: () => void;
    validationState?: ButtonValidationState;
    hasError?: boolean;
    isIdleDisabled?: boolean;
}

/**
 * A sticky footer container usually placed at the bottom of forms or screens.
 */
interface CustomStickyFooterProps {
    primaryButton?: FooterButtonConfig;
    secondaryButton?: FooterButtonConfig;
    layout?: 'row' | 'column';
    buttonDistribution?: 'equal' | 'prominent-primary';
    style?: StyleProp<ViewStyle>;
    enableToastDock?: boolean;
    targetSpotlight?: TargetSpotlightType;
}

/**
 * Calculates the exact scroll container paddingBottom needed so content
 * is not obscured by CustomStickyFooter when scrolled to the very bottom.
 *
 * - Web Desktop: 96px (86px footer + 10px breathing room) or 148px if stacked column
 * - Mobile: Math.max(bottomInset + 102, 120) (~136px with 34px gesture bar) or Math.max(bottomInset + 160, 180) if stacked
 */
export const getStickyFooterScrollPadding = (
    bottomInset: number = 0,
    isMobile: boolean = false,
    isStackedColumn: boolean = false
): number => {
    if (!isMobile) {
        return isStackedColumn ? 148 : 96;
    }
    return isStackedColumn ? Math.max(bottomInset + 160, 180) : Math.max(bottomInset + 102, 120);
};

const CustomStickyFooter: React.FC<CustomStickyFooterProps> = ({
    primaryButton,
    secondaryButton,
    layout = 'row',
    buttonDistribution = 'equal',
    style,
    enableToastDock = false,
    targetSpotlight = 'booking_footer',
}) => {
    const insets = useSafeAreaInsets();
    const toastContext = useContext(ToastContext);
    const safeBottomPadding = Math.max(insets.bottom + 16, 16);

    const unregisterFooterHeight = toastContext?.unregisterFooterHeight;

    useEffect(() => {
        return () => {
            if (enableToastDock && unregisterFooterHeight) {
                unregisterFooterHeight();
            }
        };
    }, [enableToastDock, unregisterFooterHeight]);

    const footerContainerRef = useRef<View>(null);

    const measureFooterNow = useCallback(() => {
        footerContainerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout(targetSpotlight, { x, y, width, height });
            }
        });
    }, [targetSpotlight]);

    useEffect(() => {
        return registerMeasureCallback(targetSpotlight, measureFooterNow);
    }, [measureFooterNow, targetSpotlight]);

    const handleLayout = (event: LayoutChangeEvent) => {
        if (enableToastDock && toastContext) {
            const { height } = event.nativeEvent.layout;
            if (height > 0) {
                toastContext.registerFooterHeight(height);
            }
        }
        if (isTutorialMeasurementActive()) {
            measureFooterNow();
        }
    };

    if (!primaryButton) return null;

    return (
        <View
            ref={footerContainerRef}
            collapsable={false}
            onLayout={handleLayout}
            style={[styles.footer, { paddingBottom: safeBottomPadding }, style]}
        >
            {secondaryButton ? (
                layout === 'column' ? (
                    <View style={styles.buttonColumn}>
                        <View style={styles.singleButtonWrapper}>
                            <CustomButton
                                title={primaryButton.title}
                                onPress={primaryButton.onPress}
                                variant={primaryButton.variant || 'primary'}
                                style={primaryButton.style}
                                textStyle={primaryButton.textStyle}
                                disabled={primaryButton.disabled}
                                isLoading={primaryButton.isLoading}
                                disabledToastMessage={primaryButton.disabledToastMessage}
                                disabledToastType={primaryButton.disabledToastType}
                                disabledToastMode={primaryButton.disabledToastMode}
                                onToastHide={primaryButton.onToastHide}
                                validationState={primaryButton.validationState}
                                hasError={primaryButton.hasError}
                                isIdleDisabled={primaryButton.isIdleDisabled}
                            />
                        </View>
                        <CustomButton
                            title={secondaryButton.title}
                            onPress={secondaryButton.onPress}
                            variant={secondaryButton.variant || 'outline'}
                            style={secondaryButton.style}
                            textStyle={secondaryButton.textStyle}
                            disabled={secondaryButton.disabled}
                            isLoading={secondaryButton.isLoading}
                            disabledToastMessage={secondaryButton.disabledToastMessage}
                            disabledToastType={secondaryButton.disabledToastType}
                            disabledToastMode={secondaryButton.disabledToastMode}
                            onToastHide={secondaryButton.onToastHide}
                            validationState={secondaryButton.validationState}
                            hasError={secondaryButton.hasError}
                            isIdleDisabled={secondaryButton.isIdleDisabled}
                        />
                    </View>
                ) : (
                    <View style={styles.buttonRow}>
                        <View
                            style={
                                buttonDistribution === 'prominent-primary'
                                    ? styles.buttonWrapperCompactSecondary
                                    : styles.buttonWrapper
                            }
                        >
                            <CustomButton
                                title={secondaryButton.title}
                                onPress={secondaryButton.onPress}
                                variant={secondaryButton.variant || 'outline'}
                                style={secondaryButton.style}
                                textStyle={secondaryButton.textStyle}
                                disabled={secondaryButton.disabled}
                                isLoading={secondaryButton.isLoading}
                                disabledToastMessage={secondaryButton.disabledToastMessage}
                                disabledToastType={secondaryButton.disabledToastType}
                                disabledToastMode={secondaryButton.disabledToastMode}
                                onToastHide={secondaryButton.onToastHide}
                                validationState={secondaryButton.validationState}
                                hasError={secondaryButton.hasError}
                                isIdleDisabled={secondaryButton.isIdleDisabled}
                            />
                        </View>
                        <View
                            style={
                                buttonDistribution === 'prominent-primary'
                                    ? styles.buttonWrapperProminentPrimary
                                    : styles.buttonWrapper
                            }
                        >
                            <CustomButton
                                title={primaryButton.title}
                                onPress={primaryButton.onPress}
                                variant={primaryButton.variant || 'primary'}
                                style={primaryButton.style}
                                textStyle={primaryButton.textStyle}
                                disabled={primaryButton.disabled}
                                isLoading={primaryButton.isLoading}
                                disabledToastMessage={primaryButton.disabledToastMessage}
                                disabledToastType={primaryButton.disabledToastType}
                                disabledToastMode={primaryButton.disabledToastMode}
                                onToastHide={primaryButton.onToastHide}
                                validationState={primaryButton.validationState}
                                hasError={primaryButton.hasError}
                                isIdleDisabled={primaryButton.isIdleDisabled}
                            />
                            {primaryButton.showIndicator && (
                                <View
                                    style={[
                                        styles.indicatorBadge,
                                        typeof primaryButton.badgeCount === 'number' &&
                                            primaryButton.badgeCount > 0 &&
                                            styles.indicatorBadgeWithCount,
                                    ]}
                                >
                                    {typeof primaryButton.badgeCount === 'number' &&
                                    primaryButton.badgeCount > 0 ? (
                                        <CustomText
                                            variant="caption"
                                            style={styles.indicatorBadgeText}
                                        >
                                            {primaryButton.badgeCount > 99
                                                ? '99+'
                                                : String(primaryButton.badgeCount)}
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
                        disabledToastMessage={primaryButton.disabledToastMessage}
                        disabledToastType={primaryButton.disabledToastType}
                        disabledToastMode={primaryButton.disabledToastMode}
                        onToastHide={primaryButton.onToastHide}
                        validationState={primaryButton.validationState}
                        hasError={primaryButton.hasError}
                        isIdleDisabled={primaryButton.isIdleDisabled}
                    />
                    {primaryButton.showIndicator && (
                        <View
                            style={[
                                styles.indicatorBadge,
                                typeof primaryButton.badgeCount === 'number' &&
                                    primaryButton.badgeCount > 0 &&
                                    styles.indicatorBadgeWithCount,
                            ]}
                        >
                            {typeof primaryButton.badgeCount === 'number' &&
                            primaryButton.badgeCount > 0 ? (
                                <CustomText
                                    variant="caption"
                                    style={styles.indicatorBadgeText}
                                >
                                    {primaryButton.badgeCount > 99
                                        ? '99+'
                                        : String(primaryButton.badgeCount)}
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
    buttonWrapperCompactSecondary: {
        flex: 1,
        position: 'relative',
    },
    buttonWrapperProminentPrimary: {
        flex: 2.2,
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
