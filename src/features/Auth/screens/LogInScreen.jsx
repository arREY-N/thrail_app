import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import CustomButton from '../../../components/CustomButton';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import CustomTextInput from '../../../components/CustomTextInput';
import ErrorMessage from '../../../components/ErrorMessage';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const LogInScreen = ({ 
    onLogInPress, 
    onSignUpPress, 
    onBackPress, 
    onForgotPasswordPress, 
    onGooglePress, 
    error 
}) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

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

                        <CustomText variant="h1" style={AuthStyles.pageTitle}>
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
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <Feather 
                                    name={rememberMe ? "check-square" : "square"} 
                                    size={20} 
                                    color={rememberMe ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                                />
                                <CustomText style={AuthStyles.rememberText}>Remember Me</CustomText>
                            </TouchableOpacity> */}

                            <TouchableOpacity onPress={onForgotPasswordPress}>
                                <CustomText style={AuthStyles.forgotText}>Forgot Password?</CustomText>
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
                            <CustomText style={AuthStyles.dividerText}>or continue with</CustomText>
                            <View style={AuthStyles.line} />
                        </View>

                        <TouchableOpacity 
                            style={AuthStyles.googleButton} 
                            onPress={onGooglePress}
                            activeOpacity={0.8}
                        >
                            <AntDesign name="google" size={20} color={Colors.BLACK} />
                            <CustomText style={AuthStyles.googleButtonText}>Log in with Google</CustomText>
                        </TouchableOpacity>

                        <View style={AuthStyles.footerContainer}>
                            <CustomText style={AuthStyles.footerText}>
                                Don't have an account?{' '}
                            </CustomText>
                            <TouchableOpacity onPress={onSignUpPress}>
                                <CustomText style={AuthStyles.signUpLink}>Sign Up</CustomText>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

export default LogInScreen;