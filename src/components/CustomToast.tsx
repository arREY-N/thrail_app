/**
 * @file CustomToast.tsx
 * @description Reusable status Toast component with multiple visual styles (card badge, left accent, dark),
 * two distinct modes (simple and dismissible), smart tab-bar offset, and animated countdown timers.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
    Animated, 
    StyleSheet, 
    TouchableOpacity, 
    View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the CustomToast component.
 * 
 * @param message - The message content to show.
 * @param visible - Controls visibility of the toast.
 * @param onHide - Callback when toast should hide itself after duration or close press.
 * @param duration - Optional explicit duration in milliseconds.
 * @param type - Semantic status type: 'info' | 'warning' | 'success' | 'error'.
 * @param mode - 'simple' (no timer/close button, 2200ms) or 'dismissible' (with timer bar & close button, 4000ms).
 * @param variant - Visual style: 'card' (floating card with icon badge) | 'accent-left' (left color strip) | 'dark' (slate dark pill).
 * @param bottomOffset - Optional custom bottom distance override.
 */
export interface CustomToastProps {
    message: string;
    visible: boolean;
    onHide: () => void;
    duration?: number;
    type?: 'success' | 'warning' | 'info' | 'error';
    mode?: 'simple' | 'dismissible';
    variant?: 'card' | 'accent-left' | 'dark';
    /** Position preset based on screen layout: 'tabbar' (default), 'sticky_footer', or 'floating' */
    position?: 'tabbar' | 'sticky_footer' | 'floating';
    bottomOffset?: number;
}

/**
 * CustomToast — Highly versatile, light/dark harmonious status toast component.
 *
 * @param {CustomToastProps} props - Component properties.
 * @returns {React.JSX.Element | null} The rendered toast component.
 */
const CustomToast: React.FC<CustomToastProps> = ({
    message,
    visible,
    onHide,
    duration,
    type = 'info',
    mode = 'simple',
    variant = 'card',
    position = 'tabbar',
    bottomOffset,
}) => {
    const insets = useSafeAreaInsets();
    const { isMobile } = useBreakpoints();
    const [shouldRender, setShouldRender] = useState(visible);
    if (visible && !shouldRender) {
        setShouldRender(true);
    }

    const effectiveDuration = duration !== undefined 
        ? duration 
        : (mode === 'dismissible' ? 4000 : 2200);

    const [fadeAnim] = useState(() => new Animated.Value(0));
    const [slideAnim] = useState(() => new Animated.Value(20));
    const [progressAnim] = useState(() => new Animated.Value(1));
    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onHideRef = useRef(onHide);
    useEffect(() => {
        onHideRef.current = onHide;
    });

    const [displayMessage, setDisplayMessage] = useState(message);
    if (message && message !== displayMessage) {
        setDisplayMessage(message);
    }

    const prevVisibleRef = useRef<boolean>(false);
    const prevMessageRef = useRef<string | null>(null);

    const handleHide = useCallback(() => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 15,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => {
            setShouldRender(false);
            onHideRef.current();
        });
    }, [fadeAnim, slideAnim]);

    useEffect(() => {
        const wasVisible = prevVisibleRef.current;
        const prevMsg = prevMessageRef.current;
        prevVisibleRef.current = visible;
        prevMessageRef.current = visible ? message : null;

        if (visible) {
            // If already visible with identical message, do not reset progressAnim or restart timer
            if (wasVisible && prevMsg === message) {
                return;
            }

            if (hideTimeout.current) {
                clearTimeout(hideTimeout.current);
                hideTimeout.current = null;
            }

            progressAnim.setValue(1);

            const animations = [
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ];

            if (mode === 'dismissible') {
                animations.push(
                    Animated.timing(progressAnim, {
                        toValue: 0,
                        duration: effectiveDuration,
                        useNativeDriver: false,
                    })
                );
            }

            Animated.parallel(animations).start();

            hideTimeout.current = setTimeout(() => {
                handleHide();
            }, effectiveDuration);
        } else {
            if (hideTimeout.current) {
                clearTimeout(hideTimeout.current);
                hideTimeout.current = null;
            }

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 15,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setShouldRender(false);
            });
        }

        return () => {
            if (hideTimeout.current) {
                clearTimeout(hideTimeout.current);
            }
        };
    }, [visible, message, effectiveDuration, mode, fadeAnim, slideAnim, progressAnim, handleHide]);

    if (!shouldRender) return null;

    // Derive semantic color tokens
    const getToastColors = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check-circle' as const,
                    accentColor: Colors.TOAST_SUCCESS_ICON_FG,
                    iconBg: Colors.TOAST_SUCCESS_ICON_BG,
                    iconFg: Colors.TOAST_SUCCESS_ICON_FG,
                    borderColor: Colors.TOAST_SUCCESS_BORDER,
                };
            case 'warning':
                return {
                    icon: 'alert-triangle' as const,
                    accentColor: Colors.TOAST_WARN_ICON_FG,
                    iconBg: Colors.TOAST_WARN_ICON_BG,
                    iconFg: Colors.TOAST_WARN_ICON_FG,
                    borderColor: Colors.TOAST_WARN_BORDER,
                };
            case 'error':
                return {
                    icon: 'alert-circle' as const,
                    accentColor: Colors.TOAST_ERROR_ICON_FG,
                    iconBg: Colors.TOAST_ERROR_ICON_BG,
                    iconFg: Colors.TOAST_ERROR_ICON_FG,
                    borderColor: Colors.TOAST_ERROR_BORDER,
                };
            default: // info
                return {
                    icon: 'info' as const,
                    accentColor: Colors.TOAST_INFO_ICON_FG,
                    iconBg: Colors.TOAST_INFO_ICON_BG,
                    iconFg: Colors.TOAST_INFO_ICON_FG,
                    borderColor: Colors.TOAST_INFO_BORDER,
                };
        }
    };

    const colors = getToastColors();

    // Derive container styling based on variant
    const isDark = variant === 'dark';
    const isAccentLeft = variant === 'accent-left';

    const containerBg = isDark ? Colors.TOAST_BG_DARK : Colors.TOAST_BG_LIGHT;
    const containerBorder = isDark ? Colors.TOAST_BORDER_DARK : Colors.TOAST_BORDER_LIGHT;
    const textColor = isDark ? Colors.TOAST_TEXT_DARK : Colors.TOAST_TEXT_LIGHT;

    const getComputedBottom = () => {
        if (bottomOffset !== undefined) return bottomOffset;
        switch (position) {
            case 'sticky_footer':
                return isMobile ? Math.max(insets.bottom + 90, 94) : 94;
            case 'floating':
                return isMobile ? Math.max(insets.bottom + 16, 20) : 24;
            case 'tabbar':
            default:
                return isMobile ? Math.max(insets.bottom + 16, 20) : 24;
        }
    };

    const computedBottom = getComputedBottom();

    const toastWidth = isMobile ? '90%' : 420;

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: containerBg,
                    borderColor: containerBorder,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    bottom: computedBottom,
                    width: toastWidth,
                },
                isAccentLeft && { borderLeftWidth: 5, borderLeftColor: colors.accentColor }
            ]}
        >
            <View style={styles.toastContent}>
                <View style={styles.leftMessageGroup}>
                    {/* Circular Icon Badge for 'card' & 'dark' variants */}
                    <View style={[
                        styles.iconBadge, 
                        { backgroundColor: isDark ? Colors.TOAST_DARK_ICON_BG : colors.iconBg }
                    ]}>
                        <CustomIcon
                            library="Feather"
                            name={colors.icon}
                            size={16}
                            color={isDark ? colors.accentColor : colors.iconFg}
                        />
                    </View>

                    <CustomText style={[styles.messageText, { color: textColor }]}>
                        {displayMessage}
                    </CustomText>
                </View>

                {/* Instant dismiss close button for dismissible mode */}
                {mode === 'dismissible' && (
                    <TouchableOpacity 
                        onPress={handleHide}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.closeButton}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="x" 
                            size={16} 
                            color={textColor} 
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Countdown animated timer bar for dismissible mode */}
            {mode === 'dismissible' && (
                <View style={styles.progressBarTrack}>
                    <Animated.View 
                        style={[
                            styles.progressBarFill, 
                            { 
                                backgroundColor: colors.accentColor,
                                width: progressWidth 
                            }
                        ]} 
                    />
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 14,
        zIndex: 9999,
        elevation: 8,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(8),
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    leftMessageGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    messageText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        flexShrink: 1,
    },
    closeButton: {
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        opacity: 0.65,
    },
    progressBarTrack: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2.5,
        backgroundColor: Colors.TOAST_PROGRESS_TRACK,
    },
    progressBarFill: {
        height: '100%',
    },
});

export default CustomToast;
