import { useState } from 'react';
import {
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import Customicon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';

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

    let strength = 0;
    if (password.length > 0) {
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (hasLength && hasUpper && hasLower && hasNumber && hasSpecial) {
            strength = 3;
        } else if (hasLength && (hasNumber || hasSpecial)) {
            strength = 2;
        } else {
            strength = 1;
        }
    }

    const getStrengthColor = () => {
        if (strength === 1) return Colors.STRENGTH_WEAK;    
        if (strength === 2) return Colors.STRENGTH_MEDIUM;   
        if (strength === 3) return Colors.STRENGTH_STRONG;  
        return Colors.STRENGTH_EMPTY; 
    };

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

                        <View>
                            <CustomTextInput
                                label="Password *"
                                placeholder="Type your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                isPasswordVisible={showPasswords}
                                onTogglePassword={() => setShowPasswords(!showPasswords)}
                                style={{ marginBottom: 0 }} 
                            />

                            <View style={AuthStyles.strengthContainer}>
                                {[1, 2, 3].map((level) => (
                                    <View 
                                        key={level}
                                        style={[
                                            AuthStyles.strengthBar,
                                            { 
                                                backgroundColor: strength >= level 
                                                    ? getStrengthColor() 
                                                    : Colors.STRENGTH_EMPTY
                                            }
                                        ]} 
                                    />
                                ))}
                            </View>
                        </View>

                        <CustomTextInput
                            label="Confirm Password *"
                            placeholder="Retype your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            isPasswordVisible={showPasswords}
                            onTogglePassword={() => setShowPasswords(!showPasswords)}
                            style={{ marginBottom: 0 }} 
                        />

                        <CustomText 
                                variant="caption" 
                                style={AuthStyles.passwordHint}
                            >
                                At least 8 characters with a mix of letters, numbers & symbols.
                        </CustomText>

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
                                {"Already have an account? "}
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