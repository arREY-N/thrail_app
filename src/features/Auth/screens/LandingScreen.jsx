import { StyleSheet, View } from "react-native";

import CustomButton from "@/src/components/CustomButton";
import CustomText from "@/src/components/CustomText";
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from "@/src/components/ScreenWrapper";
import DecorativeCircle from "@/src/features/Auth/components/DecorativeCircle";
import MountainGraphic from '@/src/features/Auth/components/MountainGraphic';

import { Colors } from '@/src/constants/colors';

const LandingScreen = ({ 
    onLogInPress, 
    onSignUpPress, 
    onTermsPress, 
    onPrivacyPress  
}) => {

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ResponsiveScrollView 
                minHeight={600} 
                style={styles.container} 
                contentContainerStyle={styles.scrollContainer}
            >

                <View style={[styles.topSection, { minHeight: 400 }]}>
                    <View style={styles.circleContainer}>
                        <DecorativeCircle title="Book" style={styles.bookPosition} />
                        <DecorativeCircle title="Explore" style={styles.explorePosition} />
                        <DecorativeCircle title="Hike" style={styles.hikePosition} />
                    </View>
                    <MountainGraphic />
                </View>

                <View style={[styles.cardSection, { minHeight: 450 }]}>
                    <View style={styles.contentConstrainer}>
                        <CustomText variant="subtitle" style={styles.centerText}>
                                Welcome To Thrail
                        </CustomText>
                        
                        <View style={styles.titleContainer}>
                            <CustomText variant="title" style={styles.centerText}>
                                Your Next Trail
                            </CustomText>

                            <CustomText variant="title" style={styles.centerText}>
                                Begins Here
                            </CustomText>
                        </View>

                        <View style={styles.buttonContainer}>
                            <CustomButton title="Sign Up" onPress={onSignUpPress} variant="primary" />
                            <CustomButton title="Log In" onPress={onLogInPress} variant="secondary" />
                        </View>

                        <CustomText variant="caption" style={styles.footerText}>
                            By continuing, you agree to our{' '}
                            <CustomText 
                                variant="caption" 
                                style={styles.linkText}
                                onPress={onTermsPress}
                            >
                                [Terms of Service]
                            </CustomText>
                            {' '}and{' '}
                            <CustomText 
                                variant="caption" 
                                style={styles.linkText}
                                onPress={onPrivacyPress}
                            >
                                [Privacy Policy]
                            </CustomText>
                            .
                        </CustomText>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1, 
        width: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    
    topSection: {
        height: '42%',
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
        backgroundColor: Colors.BACKGROUND,
    },
    circleContainer: {
        position: 'absolute',
        top: '10%',
        width: '100%',
        height: 200,
        zIndex: 10,
    },
    bookPosition: { 
        top: 20, 
        alignSelf: 'center' 
    },
    explorePosition: { 
        top: 100, 
        left: '15%' 
    },
    hikePosition: { 
        top: 100, 
        right: '15%' 
    },

    cardSection: {
        flex: 1,
        backgroundColor: Colors.SECONDARY, 
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',

        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },  
    
    contentConstrainer: {
        width: '100%',
        maxWidth: 400, 
        alignItems: 'center',
    },
    titleContainer: {
        marginBottom: 32,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 20,
        gap: 16,
    },

    centerText: {
        textAlign: 'center',
        color: Colors.TEXT_INVERSE,
    },
    footerText: {
        color: Colors.TEXT_INVERSE, 
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    linkText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
    },
});

export default LandingScreen;