import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const CustomLoading = ({ 
    visible = true, 
    message = "Loading ...", 
    children
}) => {
    const fillAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fillAnim, {
                toValue: 100, 
                duration: 2000,
                easing: Easing.out(Easing.cubic), 
                useNativeDriver: false,
            }).start();
        } else {
            fillAnim.setValue(0);
        }
    }, [visible, fillAnim]);

    const barWidth = fillAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                
                {children ? (
                    children
                ) : (
                    <>
                        <View style={styles.animationWrapper}>
                            <LottieView
                                source={require('@/src/assets/loading/mountain-loader.json')} 
                                autoPlay
                                loop
                                style={styles.lottieAnimation}
                            />
                        </View>
                        
                        <View style={styles.progressBarContainer}>
                            <Animated.View style={[
                                styles.progressBarFill, 
                                { width: barWidth }
                            ]} />
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
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottieAnimation: {
        width: 140,
        height: 140,
    },

    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 4,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.PRIMARY,
        borderRadius: 4,
    },

    text: {
        fontWeight: 'bold',
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    }
});

export default CustomLoading;