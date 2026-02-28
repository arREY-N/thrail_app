import React from 'react';
import { Image, StyleSheet, View } from "react-native";

import CustomButton from "@/src/components/CustomButton";
import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";

import { Colors } from '@/src/constants/colors';

const LandingScreen = ({ 
    onLogInPress, 
    onSignUpPress, 
    onTermsPress, 
    onPrivacyPress  
}) => {

    return (
        <ScreenWrapper backgroundColor="#1A1A1A">
            <View style={styles.container}>
                
                <View style={styles.imageWrapper}>
                    <Image 
                        source={require('@/src/assets/images/Hiking.jpg')}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.cardSection}>
                    {/* <View style={styles.dragIndicator} /> */}

                    <View style={styles.contentConstrainer}>
                        
                        <View style={styles.headerContainer}>
                            <CustomText variant="label" style={styles.welcomeText}>
                                WELCOME TO THRAIL
                            </CustomText>
                            
                            <CustomText variant="h1" style={styles.titleText}>
                                Your Next Trail
                            </CustomText>
                            <CustomText variant="h1" style={styles.titleText}>
                                Begins Here
                            </CustomText>

                            <CustomText variant="body" style={styles.subtitleText}>
                                Discover breathtaking mountains, book local guides, and start your adventure today.
                            </CustomText>
                        </View>

                        <View style={styles.buttonContainer}>
                            <CustomButton 
                                title="Sign Up" 
                                onPress={onSignUpPress} 
                                variant="primary" 
                            />
                            <CustomButton 
                                title="Log In" 
                                onPress={onLogInPress} 
                                variant="outline" 
                            />
                        </View>

                        <CustomText variant="caption" style={styles.footerText}>
                            By continuing, you agree to our{' '}
                            <CustomText 
                                variant="caption" 
                                style={styles.linkText}
                                onPress={onTermsPress}
                            >
                                Terms of Service
                            </CustomText>
                            {' '}and{' '}
                            <CustomText 
                                variant="caption" 
                                style={styles.linkText}
                                onPress={onPrivacyPress}
                            >
                                Privacy Policy
                            </CustomText>
                            .
                        </CustomText>
                    </View>
                </View>

            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        width: '100%',
        backgroundColor: Colors.WHITE,
    },
    
    imageWrapper: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },

    cardSection: {
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 32,
        alignItems: 'center',

        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10, 
    },  
    
    // dragIndicator: {
    //     width: 40,
    //     height: 5,
    //     borderRadius: 3,
    //     backgroundColor: Colors.GRAY_LIGHT,
    // },

    contentConstrainer: {
        width: '100%',
        maxWidth: 400, 
        alignItems: 'center',
    },
    
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        color: Colors.PRIMARY,
        letterSpacing: 1.5,
        marginBottom: 8,
        fontWeight: '700',
    },
    titleText: {
        textAlign: 'center',
        lineHeight: 40,
    },
    subtitleText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginTop: 12,
        paddingHorizontal: 16,
        lineHeight: 22,
    },

    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 24,
    },
    footerText: {
        textAlign: 'center',
        lineHeight: 20,
    },
    linkText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});

export default LandingScreen;