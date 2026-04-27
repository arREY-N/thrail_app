import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Platform,
    StyleSheet
} from 'react-native';

import { Colors } from '@/src/constants/colors';

const SkeletonEffect = ({ style }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
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
        );

        anim.start();

        return () => {
            try {
                anim.stop && anim.stop();
            } catch (e) {
                // ignore stop errors
            }
        };
    }, []);

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