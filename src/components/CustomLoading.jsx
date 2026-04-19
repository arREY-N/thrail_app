import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CustomLoading = ({ 
    visible = true, 
    message = "Loading trails...", 
    children
}) => {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.linear,
                    useNativeDriver: false,
                })
            ).start();
        } else {
            pulseAnim.setValue(0);
        }
    }, [visible, pulseAnim]);

    const PATH_LENGTH_BUFFER = 500; 

    const strokeDashoffset = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [PATH_LENGTH_BUFFER, -PATH_LENGTH_BUFFER]
    });

    if (!visible) return null;

    const mountainPath = "M 0 90 L 20 90 L 40 60 L 60 90 L 85 50 L 110 90 L 140 20 L 170 90 L 200 90";

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                
                {children ? (
                    children
                ) : (
                    <>
                        <View style={styles.animationWrapper}>
                            <Svg width="200" height="100" viewBox="0 0 200 100">
                                
                                <Path
                                    d={mountainPath}
                                    fill="none"
                                    stroke={Colors.GRAY_ULTRALIGHT}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                
                                <AnimatedPath
                                    d={mountainPath}
                                    fill="none"
                                    stroke={Colors.PRIMARY}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeDasharray="60, 1000" 
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </Svg>
                        </View>
                        
                        <CustomText variant="body" style={styles.text}>
                            {message}
                        </CustomText>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 10,
    },
    container: {
        backgroundColor: Colors.WHITE,
        paddingVertical: 32,
        paddingHorizontal: 24, 
        borderRadius: 24, 
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,

        minWidth: 200, 
        maxWidth: 280,
        width: '75%',
        
        shadowColor: Colors.SHADOW || '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    animationWrapper: {
        width: 200,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    }
});

export default CustomLoading;