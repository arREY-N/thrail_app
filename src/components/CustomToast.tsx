/**
 * @file CustomToast.tsx
 * @description Reusable status Toast component for displaying brief non-blocking warnings or reminders.
 * Automatically adapts positioning with safe-area insets on mobile and accepts custom bottomOffset overrides.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
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
 * @param onHide - Callback when toast should hide itself after duration.
 * @param duration - Duration in milliseconds before auto-hiding (default: 3000).
 * @param type - Visual style type of the toast (default: 'info').
 * @param bottomOffset - Optional custom bottom distance override (e.g. above sticky footers).
 */
export interface CustomToastProps {
    message: string;
    visible: boolean;
    onHide: () => void;
    duration?: number;
    type?: 'success' | 'warning' | 'info' | 'error';
    bottomOffset?: number;
}

/**
 * CustomToast — Reusable status alert pill floating cleanly above bottom navigation or sticky footers.
 *
 * @param props - Component properties.
 * @returns {React.JSX.Element | null} The rendered toast component.
 */
const CustomToast: React.FC<CustomToastProps> = ({
    message,
    visible,
    onHide,
    duration = 3000,
    type = 'info',
    bottomOffset,
}) => {
    const insets = useSafeAreaInsets();
    const { isMobile } = useBreakpoints();
    const [shouldRender, setShouldRender] = useState(visible);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            if (hideTimeout.current) {
                clearTimeout(hideTimeout.current);
            }

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();

            hideTimeout.current = setTimeout(() => {
                handleHide();
            }, duration);
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 15,
                    duration: 200,
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
    }, [visible, message]);

    const handleHide = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 15,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            setShouldRender(false);
            onHide();
        });
    };

    if (!shouldRender) return null;

    const getToastStyle = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'rgba(46, 125, 50, 0.95)',
                    icon: 'check-circle' as const,
                    color: Colors.WHITE,
                };
            case 'warning':
                return {
                    bg: 'rgba(239, 108, 0, 0.95)',
                    icon: 'alert-triangle' as const,
                    color: Colors.WHITE,
                };
            case 'error':
                return {
                    bg: 'rgba(198, 40, 40, 0.95)',
                    icon: 'alert-circle' as const,
                    color: Colors.WHITE,
                };
            default: // info
                return {
                    bg: 'rgba(30, 34, 30, 0.95)',
                    icon: 'info' as const,
                    color: Colors.WHITE,
                };
        }
    };

    const config = getToastStyle();

    // Dynamically calculate bottom offset factoring in safe-area insets or explicit overrides
    const computedBottom = bottomOffset !== undefined
        ? bottomOffset
        : Math.max(insets.bottom + 16, 20);

    const toastWidth = isMobile ? '90%' : 400;

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: config.bg,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    bottom: computedBottom,
                    width: toastWidth,
                }
            ]}
        >
            <View style={styles.toastContent}>
                <CustomIcon
                    library="Feather"
                    name={config.icon}
                    size={18}
                    color={config.color}
                    style={styles.icon}
                />
                <CustomText style={[styles.messageText, { color: config.color }]}>
                    {message}
                </CustomText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        zIndex: 9999,
        elevation: 8,
        ...GlobalStyles.dropShadow(3),
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    icon: {
        flexShrink: 0,
    },
    messageText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        flexShrink: 1,
        textAlign: 'center',
    },
});

export default CustomToast;
