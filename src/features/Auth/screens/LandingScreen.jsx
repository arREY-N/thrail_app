import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { Colors } from "@/src/constants/colors";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import ScreenWrapper from "../../../components/ScreenWrapper";
import DecorativeCircle from "./components/DecorativeCircle";
import MountainGraphic from "./components/MountainGraphic";

const LandingScreen = ({ onLogIn, onSignUp }) => {
    const { height } = useWindowDimensions();

    const isShortScreen = height < 600;

    return (
        <ScreenWrapper backgroundColor={Colors.Background}>
            
            <ScrollView 
                contentContainerStyle={[
                    styles.scrollContainer, 
                    { minHeight: isShortScreen ? 600 : '100%' } 
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.innerContainer}>

                    <View style={styles.topSection}>
                        <View style={styles.circleContainer}>
                            <DecorativeCircle title="Book" style={styles.bookPosition} />
                            <DecorativeCircle title="Explore" style={styles.explorePosition} />
                            <DecorativeCircle title="Hike" style={styles.hikePosition} />
                        </View>
                        <MountainGraphic />
                    </View>

                    <View style={styles.cardSection}>
                        <View style={styles.contentConstrainer}>
                            <CustomText variant="h2" color={Colors.WHITE} style={styles.centerText}>
                                    Welcome To Thrail
                                </CustomText>
                            
                            <View style={styles.titleContainer}>
                                <CustomText variant="h1" color={Colors.WHITE} style={styles.centerText}>
                                    Your Next Trail
                                </CustomText>
                                <CustomText variant="h1" color={Colors.WHITE} style={styles.centerText}>
                                    Begins Here
                                </CustomText>
                            </View>

                            <View style={styles.buttonContainer}>
                                <CustomButton title="Create Account" onPress={onSignUp} variant="primary" />
                                <CustomButton title="Log In" onPress={onLogIn} variant="secondary" />
                            </View>

                            <CustomText variant="caption" style={styles.footerText}>
                                By continuing, you agree to our <CustomText variant="caption" style={styles.linkText}>[Terms of Service]</CustomText> and <CustomText variant="caption" style={styles.linkText}>[Privacy Policy]</CustomText>.
                            </CustomText>

                        </View>
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};



const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    innerContainer: {
        flex: 1,
        width: '100%',
    },
    
    topSection: {
        flex: 0.45, 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
    },
    circleContainer: {
        position: 'absolute',
        top: '15%',
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
        flex: 0.55,
        backgroundColor: Colors.Gray, 
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
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
    },

    
    centerText: {
        textAlign: 'center',
    },
    footerText: {
        color: Colors.GRAY_LIGHT, 
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    linkText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
});

export default LandingScreen;