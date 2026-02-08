import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';

const LogInScreen = ({ 
    onLogInPress, 
    onSignUpPress, 
    onBackPress, 
    onForgotPasswordPress, 
    onRememberMePress,
    onGooglePress, 
    error,
    remember,
}) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                            Log In
                        </CustomText>

                        <ErrorMessage error={error} />
                        
                        <CustomTextInput
                            label="Email Address"
                            placeholder="name@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <CustomTextInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View style={[AuthStyles.optionsRow, {justifyContent: 'flex-end'}]}>
                            {/* <TouchableOpacity 
                                style={AuthStyles.rememberMeContainer} 
                                onPress={() => onRememberMePress()}
                                activeOpacity={0.7}
                            >
                                <Feather 
                                    name={remember ? "check-square" : "square"} 
                                    size={20} 
                                    color={remember ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                                />
                                <CustomText style={AuthStyles.rememberText}>Remember Me</CustomText>
                            </TouchableOpacity> */}

                            <TouchableOpacity onPress={onForgotPasswordPress}>
                                <CustomText variant="caption" style={AuthStyles.forgotText}>
                                    Forgot Password?
                                </CustomText>
                            </TouchableOpacity>
                        </View>

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Log In" 
                                onPress={() => onLogInPress(email, password)} 
                                variant="primary" 
                            />
                        </View>

                        <View style={AuthStyles.dividerContainer}>
                            <View style={AuthStyles.line} />
                                <CustomText variant="caption" style={AuthStyles.dividerText}>
                                    or continue with
                                </CustomText>
                            <View style={AuthStyles.line} />
                        </View>

                        <TouchableOpacity 
                            style={AuthStyles.googleButton} 
                            onPress={onGooglePress}
                            activeOpacity={0.8}
                        >
                            <CustomIcon
                                library='AntDesign'
                                name='google'
                                size={20}
                                color={Colors.BLACK}
                            />
                            
                            <CustomText variant="body" style={AuthStyles.googleButtonText}>
                                Log in with Google
                            </CustomText>
                        </TouchableOpacity>

                        <View style={AuthStyles.footerContainer}>
                            <CustomText variant="caption" style={AuthStyles.footerText}>
                                Don't have an account?{' '}
                            </CustomText>

                            <TouchableOpacity onPress={onSignUpPress}>
                                <CustomText variant="caption" style={AuthStyles.signUpLink}>
                                    Sign Up
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

export default LogInScreen;