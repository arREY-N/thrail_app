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
import { ToastContext, ToastType } from '@/src/components/Toast/Toast';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    TargetSpotlightType,
} from '@/src/components/Tutorial/Tutorial';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { IconLibrary } from '@/src/types/ui.types';

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
    validationState?: ButtonValidationState;
    hasError?: boolean;
    isIdleDisabled?: boolean;
    numberOfLines?: number;
    adjustsFontSizeToFit?: boolean;
    minimumFontScale?: number;
    icon?: string;
    iconLibrary?: IconLibrary;
    iconPosition?: 'left' | 'right';
    iconSize?: number;
    iconColor?: string;
    tutorialTargetId?: TargetSpotlightType;
}

interface FooterButtonWrapperProps {
    tutorialTargetId?: TargetSpotlightType;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

const FooterButtonWrapper: React.FC<FooterButtonWrapperProps> = ({
    tutorialTargetId,
    style,
    children,
}) => {
    const wrapperRef = useRef<View>(null);

    const measureNow = useCallback(() => {
        if (!tutorialTargetId) return;
        wrapperRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout(tutorialTargetId, { x, y, width, height });
            }
        });
    }, [tutorialTargetId]);

    useEffect(() => {
        if (!tutorialTargetId) return undefined;
        return registerMeasureCallback(tutorialTargetId, measureNow);
    }, [tutorialTargetId, measureNow]);

    const handleWrapperLayout = () => {
        if (tutorialTargetId && isTutorialMeasurementActive()) {
            measureNow();
        }
    };

    return (
        <View
            ref={wrapperRef}
            collapsable={false}
            onLayout={tutorialTargetId ? handleWrapperLayout : undefined}
            style={style}
        >
            {children}
        </View>
    );
};

/**
 * A sticky footer container usually placed at the bottom of forms or screens.
 */
interface CustomStickyFooterProps {
    primaryButton?: FooterButtonConfig;
    secondaryButton?: FooterButtonConfig;
    tertiaryButton?: FooterButtonConfig;
    buttons?: FooterButtonConfig[];
    layout?: 'row' | 'column';
    style?: StyleProp<ViewStyle>;
    enableToastDock?: boolean;
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
    tertiaryButton,
    buttons,
    layout = 'row',
    style,
    enableToastDock = false,
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
                registerTutorialLayout('booking_footer', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        return registerMeasureCallback('booking_footer', measureFooterNow);
    }, [measureFooterNow]);

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

    const resolvedButtons: FooterButtonConfig[] =
        buttons && buttons.length > 0
            ? buttons
            : layout === 'column'
              ? [primaryButton, secondaryButton, tertiaryButton].filter(
                    (btn): btn is FooterButtonConfig => Boolean(btn),
                )
              : [secondaryButton, primaryButton, tertiaryButton].filter(
                    (btn): btn is FooterButtonConfig => Boolean(btn),
                );

    if (resolvedButtons.length === 0) return null;

    const isThreeColumnRow = layout === 'row' && resolvedButtons.length >= 3;

    const renderIndicator = (btn: FooterButtonConfig) => {
        if (!btn.showIndicator) return null;
        return (
            <View
                style={[
                    styles.indicatorBadge,
                    typeof btn.badgeCount === 'number' &&
                        btn.badgeCount > 0 &&
                        styles.indicatorBadgeWithCount,
                ]}
            >
                {typeof btn.badgeCount === 'number' && btn.badgeCount > 0 ? (
                    <CustomText variant="caption" style={styles.indicatorBadgeText}>
                        {btn.badgeCount > 99 ? '99+' : String(btn.badgeCount)}
                    </CustomText>
                ) : (
                    <View style={styles.indicatorDot} />
                )}
            </View>
        );
    };

    return (
        <View
            ref={footerContainerRef}
            collapsable={false}
            onLayout={handleLayout}
            style={[styles.footer, { paddingBottom: safeBottomPadding }, style]}
        >
            {resolvedButtons.length > 1 ? (
                layout === 'column' ? (
                    <View style={styles.buttonColumn}>
                        {resolvedButtons.map((btn, index) => (
                            <FooterButtonWrapper
                                key={`${btn.title}-${index}`}
                                tutorialTargetId={btn.tutorialTargetId}
                                style={styles.singleButtonWrapper}
                            >
                                <CustomButton
                                    title={btn.title}
                                    onPress={btn.onPress}
                                    variant={btn.variant || (index === 0 ? 'primary' : 'outline')}
                                    style={btn.style}
                                    textStyle={btn.textStyle}
                                    disabled={btn.disabled}
                                    isLoading={btn.isLoading}
                                    disabledToastMessage={btn.disabledToastMessage}
                                    disabledToastType={btn.disabledToastType}
                                    validationState={btn.validationState}
                                    hasError={btn.hasError}
                                    isIdleDisabled={btn.isIdleDisabled}
                                    icon={btn.icon}
                                    iconLibrary={btn.iconLibrary}
                                    iconPosition={btn.iconPosition}
                                    iconSize={btn.iconSize}
                                    iconColor={btn.iconColor}
                                />
                                {renderIndicator(btn)}
                            </FooterButtonWrapper>
                        ))}
                    </View>
                ) : (
                    <View
                        style={[
                            styles.buttonRow,
                            isThreeColumnRow && styles.buttonRowThree,
                        ]}
                    >
                        {resolvedButtons.map((btn, index) => (
                            <FooterButtonWrapper
                                key={`${btn.title}-${index}`}
                                tutorialTargetId={btn.tutorialTargetId}
                                style={styles.buttonWrapper}
                            >
                                <CustomButton
                                    title={btn.title}
                                    onPress={btn.onPress}
                                    variant={
                                        btn.variant ||
                                        (btn === primaryButton ? 'primary' : 'outline')
                                    }
                                    style={[
                                        styles.footerButton,
                                        isThreeColumnRow && styles.footerButtonThree,
                                        btn.style,
                                    ]}
                                    textStyle={btn.textStyle}
                                    numberOfLines={btn.numberOfLines ?? 1}
                                    adjustsFontSizeToFit={btn.adjustsFontSizeToFit ?? true}
                                    minimumFontScale={btn.minimumFontScale ?? 0.75}
                                    disabled={btn.disabled}
                                    isLoading={btn.isLoading}
                                    disabledToastMessage={btn.disabledToastMessage}
                                    disabledToastType={btn.disabledToastType}
                                    validationState={btn.validationState}
                                    hasError={btn.hasError}
                                    isIdleDisabled={btn.isIdleDisabled}
                                    icon={btn.icon}
                                    iconLibrary={btn.iconLibrary}
                                    iconPosition={btn.iconPosition}
                                    iconSize={btn.iconSize}
                                    iconColor={btn.iconColor}
                                />
                                {renderIndicator(btn)}
                            </FooterButtonWrapper>
                        ))}
                    </View>
                )
            ) : (
                <FooterButtonWrapper
                    tutorialTargetId={resolvedButtons[0].tutorialTargetId}
                    style={styles.singleButtonWrapper}
                >
                    <CustomButton
                        title={resolvedButtons[0].title}
                        onPress={resolvedButtons[0].onPress}
                        variant={resolvedButtons[0].variant || 'primary'}
                        style={resolvedButtons[0].style}
                        textStyle={resolvedButtons[0].textStyle}
                        disabled={resolvedButtons[0].disabled}
                        isLoading={resolvedButtons[0].isLoading}
                        disabledToastMessage={resolvedButtons[0].disabledToastMessage}
                        disabledToastType={resolvedButtons[0].disabledToastType}
                        validationState={resolvedButtons[0].validationState}
                        hasError={resolvedButtons[0].hasError}
                        isIdleDisabled={resolvedButtons[0].isIdleDisabled}
                        icon={resolvedButtons[0].icon}
                        iconLibrary={resolvedButtons[0].iconLibrary}
                        iconPosition={resolvedButtons[0].iconPosition}
                        iconSize={resolvedButtons[0].iconSize}
                        iconColor={resolvedButtons[0].iconColor}
                    />
                    {renderIndicator(resolvedButtons[0])}
                </FooterButtonWrapper>
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
        alignItems: 'stretch',
    },
    buttonRowThree: {
        gap: 10,
    },
    buttonColumn: {
        width: '100%',
        gap: 12,
    },
    buttonWrapper: {
        flex: 1,
        position: 'relative',
        alignSelf: 'stretch',
    },
    footerButton: {
        flex: 1,
        height: '100%',
        minHeight: 52,
        justifyContent: 'center',
    },
    footerButtonThree: {
        paddingHorizontal: 10,
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
