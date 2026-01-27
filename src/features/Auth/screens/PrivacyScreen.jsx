import { ScrollView, StyleSheet, View } from "react-native";

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const PrivacyScreen = ({ onBackPress }) => {

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <CustomHeader onBackPress={onBackPress} />

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Privacy Policy
                        </CustomText>

                        <View style={styles.legalContainer}>
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                <CustomText variant="body" style={styles.legalText}>
                                    [PRIVACY POLICY PLACEHOLDER]
                                    {'\n'}{'\n'}
                                    1. Data Collection{'\n'}
                                    We collect information to provide better services to all our users.
                                    {'\n'}{'\n'}
                                    2. Data Usage{'\n'}
                                    Your data is used solely for improving your hiking experience.
                                    {'\n'}{'\n'}
                                </CustomText>
                            </ScrollView>
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
        flex: 1,
        minHeight: 500,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        marginBottom: 24,
    },
    legalText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
    },
});

export default PrivacyScreen;