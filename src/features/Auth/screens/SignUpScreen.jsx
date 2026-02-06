import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import Customicon from '@/src/components/CustomIcon';
import CustomButton from '../../../components/CustomButton';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import CustomTextInput from '../../../components/CustomTextInput';
import ErrorMessage from '../../../components/ErrorMessage';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const SignUpScreen = ({ 
    onLogInPress, 
    onBackPress, 
    onSignUpPress, 
    onGmailSignUp, 
    error 
}) => {

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showPasswords, setShowPasswords] = useState(false);

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
                            Sign Up
                        </CustomText>

                        <ErrorMessage error={error} />
                        
                        <CustomTextInput
                            label="Email Address *"
                            placeholder="name@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <CustomTextInput
                            label="Username *"
                            placeholder="Choose a username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        <CustomTextInput
                            label="Password *"
                            placeholder="Type your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            isPasswordVisible={showPasswords}
                            onTogglePassword={() => setShowPasswords(!showPasswords)}
                        />

                        <CustomTextInput
                            label="Confirm Password *"
                            placeholder="Retype your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            isPasswordVisible={showPasswords}
                            onTogglePassword={() => setShowPasswords(!showPasswords)}
                        />

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Continue with Email" 
                                onPress={() => onSignUpPress(email, password, username, confirmPassword)} 
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
                            onPress={onGmailSignUp}
                            activeOpacity={0.8}
                        >
                            <Customicon
                                    library="AntDesign"
                                    name="google"
                                    size={20}
                                    color={Colors.BLACK}
                            />

                            <CustomText variant="body" style={AuthStyles.googleButtonText}>
                                Continue with Google
                            </CustomText>
                        </TouchableOpacity>

                        <View style={AuthStyles.footerContainer}>
                            <CustomText variant="caption" style={AuthStyles.footerText}>
                                Already have an account?{' '}
                            </CustomText>

                            <TouchableOpacity onPress={onLogInPress}>
                                <CustomText variant="caption" style={AuthStyles.signUpLink}>
                                    Log In
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

export default SignUpScreen;