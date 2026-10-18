/**
 * @file ScrollToTopPill.tsx
 * @description Floating scroll-to-top indicator pill with animated vertical glide matching collapsible header movement.
 */

import React from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

/**
 * Props for the ScrollToTopPill component.
 *
 * @param visible - Whether the floating pill is currently visible
 * @param onPress - Callback when the pill is tapped
 * @param animatedHeaderHeight - Optional animated value for screens with collapsible headers (e.g. Community)
 * @param topOffset - Optional top position offset when animatedHeaderHeight is not provided
 * @param label - Optional custom text label for the pill (defaults to "Back to top")
 */
export interface ScrollToTopPillProps {
    visible: boolean;
    onPress: () => void;
    animatedHeaderHeight?: Animated.Value;
    topOffset?: number;
    label?: string;
}

export const ScrollToTopPill = ({
    visible,
    onPress,
    animatedHeaderHeight,
    topOffset = 20,
    label = 'Back to top',
}: ScrollToTopPillProps): React.JSX.Element | null => {
    if (!visible) return null;

    const transformStyles = animatedHeaderHeight
        ? [
            {
                translateY: animatedHeaderHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [topOffset, 225],
                }),
            },
        ]
        : [];

    return (
        <Animated.View
            style={[
                styles.pillWrapper,
                !animatedHeaderHeight && { top: topOffset },
                transformStyles.length > 0 && { transform: transformStyles },
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                style={styles.pill}
                onPress={onPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={label}
            >
                <CustomIcon library="Ionicons" name="arrow-up" size={14} color={Colors.WHITE} />
                <CustomText variant="label" style={styles.pillText}>
                    {label}
                </CustomText>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default ScrollToTopPill;

const styles = StyleSheet.create({
    pillWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 50,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        ...Platform.select({
            web: {
                cursor: 'pointer' as const,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            default: {
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
        }),
    },
    pillText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 13,
    },
});
