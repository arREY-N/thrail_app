import React from 'react';
import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    View
} from "react-native";

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from "@/src/components/CustomButton";
import CustomText from "@/src/components/CustomText";

import { Colors } from '@/src/constants/colors';

const LandingScreen = ({ 
    onLogInPress, 
    onSignUpPress, 
    onTermsPress, 
    onPrivacyPress  
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            <View style={styles.imageWrapper}>
                <Image 
                    source={require('@/src/assets/images/Mt.Tagapo.jpg')}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            </View>

            <View style={[
                styles.cardSection, 
                { paddingBottom: Math.max(insets.bottom + 16, 32) }
            ]}>
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
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32, 
        paddingHorizontal: 24,
        paddingTop: 32,
        alignItems: 'center',

        ...Platform.select({
            ios: {
                shadowColor: Colors.SHADOW,
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: {
                elevation: 24,
            },
            web: {
                boxShadow: '0px -8px 24px rgba(0, 0, 0, 0.12)', 
            }
        })
    },  
    
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
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: '700',
    },
    titleText: {
        textAlign: 'center',
        lineHeight: 40,
        fontSize: 32,
    },
    subtitleText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginTop: 16,
        paddingHorizontal: 16,
        lineHeight: 24,
        fontSize: 15,
    },

    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 32,
    },
    footerText: {
        textAlign: 'center',
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
    },
    linkText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});

export default LandingScreen;