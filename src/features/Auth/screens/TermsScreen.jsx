import { ScrollView, StyleSheet, View } from "react-native";

import CustomButton from '../../../components/CustomButton';
import CustomText from '../../../components/CustomText';
import ErrorMessage from '../../../components/ErrorMessage';
import Header from '../../../components/Header';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const TermsScreen = ({ onAcceptPress, onDeclinePress, onBackPress, error }) => {

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <Header onBackPress={onBackPress} />

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="h1" style={AuthStyles.pageTitle}>
                            Terms & Conditions
                        </CustomText>

                        <ErrorMessage error={error} />

                        <View style={styles.legalContainer}>
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                <CustomText style={styles.legalText}>
                                    [TERMS AND CONDITIONS PLACEHOLDER]
                                    {'\n'}{'\n'}
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                    {'\n'}{'\n'}
                                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                    {'\n'}{'\n'}
                                </CustomText>
                            </ScrollView>
                        </View>

                        <CustomText style={styles.agreementText}>
                            By clicking "Accept", you acknowledge that you have read and agree to the Terms & Conditions and Privacy Policy.
                        </CustomText>

                        <View style={[AuthStyles.buttonContainer, styles.buttonGap]}>
                            <CustomButton 
                                title="Accept" 
                                onPress={onAcceptPress} 
                                variant="primary"
                            />

                            <CustomButton 
                                title="Decline" 
                                onPress={onDeclinePress} 
                                variant="outline" 
                            />
                        </View>

                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    legalContainer: {
        width: '100%',
        height: 300, 
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        marginBottom: 24,
    },
    legalText: {
        fontSize: 14,
        color: Colors.GRAY,
        lineHeight: 22,
    },
    agreementText: {
        textAlign: 'center',
        fontSize: 14,
        color: Colors.GRAY,
        lineHeight: 20,
        paddingHorizontal: 8,
        marginBottom: 32,
    },
    buttonGap: {
        gap: 16, 
    }
});

export default TermsScreen;