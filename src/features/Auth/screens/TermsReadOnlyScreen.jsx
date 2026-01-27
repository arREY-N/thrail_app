import { ScrollView, StyleSheet, View } from "react-native";

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const TermsReadOnlyScreen = ({ onBackPress }) => {

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
                            Terms of Service
                        </CustomText>

                        <View style={styles.legalContainer}>
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                <CustomText variant="body" style={styles.legalText}>
                                    [TERMS OF SERVICE - READ ONLY]
                                    {'\n'}{'\n'}
                                    1. Introduction{'\n'}
                                    Welcome to Thrail. These are our general terms of use...
                                    {'\n'}{'\n'}
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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

export default TermsReadOnlyScreen;