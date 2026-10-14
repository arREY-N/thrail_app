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

export interface ScrollToTopPillProps {
    visible: boolean;
    onPress: () => void;
    animatedHeaderHeight: Animated.Value;
}

export const ScrollToTopPill: React.FC<ScrollToTopPillProps> = ({
    visible,
    onPress,
    animatedHeaderHeight,
}) => {
    if (!visible) return null;

    const translateY = animatedHeaderHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 225],
    });

    return (
        <Animated.View
            style={[
                styles.pillWrapper,
                { transform: [{ translateY }] }
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                style={styles.pill}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <CustomIcon library="Ionicons" name="arrow-up" size={14} color={Colors.WHITE} />
                <CustomText variant="label" style={styles.pillText}>
                    Back to top
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
