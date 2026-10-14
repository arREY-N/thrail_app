import React, { useEffect, useState } from 'react';
import {
    Animated,
    Easing,
    Platform,
    StyleProp,
    StyleSheet,
    ViewStyle
} from 'react-native';

import { Colors } from '@/src/constants/colors';

/**
 * Props for the SkeletonEffect component.
 */
interface SkeletonEffectProps {
    /** Additional styles to apply to the skeleton container */
    style?: StyleProp<ViewStyle>;
}

/**
 * SkeletonEffect — A generic pulsing skeleton loader component used
 * as a placeholder while data is being fetched.
 */
const SkeletonEffect: React.FC<SkeletonEffectProps> = ({ style }) => {
    const [opacity] = useState(() => new Animated.Value(0.3));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View 
            style={[
                styles.skeleton, 
                style, 
                { opacity }
            ]} 
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.GRAY_LIGHT, 
        borderRadius: 8,
    }
});

export default SkeletonEffect;
