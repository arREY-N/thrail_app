import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const AnimatedG = Animated.createAnimatedComponent(G);

const CustomLoading = ({ 
    visible = true, 
    message = "Loading...", 
    children
}) => {
    const orbitAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            orbitAnim.setValue(0);
            Animated.loop(
                Animated.timing(orbitAnim, {
                    toValue: 1,
                    duration: 4000, 
                    easing: Easing.linear,
                    useNativeDriver: false, 
                })
            ).start();
        } else {
            orbitAnim.stopAnimation();
        }
    }, [visible, orbitAnim]);

    const celestialRotation = orbitAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 360] 
    });

    if (!visible) return null;

    const backMountain = "M -10 120 L 40 45 Q 60 20 80 45 L 140 120 Z";
    const frontMountain = "M 40 120 L 110 65 Q 130 45 150 65 L 220 120 Z";

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                
                {children ? (
                    children
                ) : (
                    <>
                        <View style={styles.animationWrapper}>
                            <Svg width="200" height="120" viewBox="0 0 200 120">
                                
                                <Circle 
                                    cx="100" 
                                    cy="100" 
                                    r="70"   
                                    fill="none" 
                                    stroke={Colors.GRAY_ULTRALIGHT} 
                                    strokeWidth="2" 
                                    strokeDasharray="4, 6" 
                                />

                                <AnimatedG originX="100" originY="100" rotation={celestialRotation}>
                                    
                                    <Circle 
                                        cx="100" 
                                        cy="15"  
                                        r="14"   
                                        fill={Colors.YELLOW} 
                                    />
                                    
                                    <Circle 
                                        cx="100" 
                                        cy="185"  
                                        r="12"
                                        fill={Colors.GRAY_LIGHT} 
                                    />
                                    
                                </AnimatedG>

                                <Path d={backMountain} fill={Colors.SECONDARY} />
                                <Path d={frontMountain} fill={Colors.PRIMARY} />
                                
                            </Svg>
                        </View>
                        
                        <CustomText variant="h3" style={styles.text}>
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
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    animationWrapper: {
        width: 200,
        height: 120, 
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', 
        borderRadius: 8, 
    },
    text: {
        textAlign: 'center',
        marginBottom: 0
    }
});

export default CustomLoading;