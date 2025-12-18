import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import CustomButton from '../../../components/CustomButton';
import CustomText from '../../../components/CustomText';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const SignUpScreen = ({ onLogIn, onBack, onSignUp, error }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [emailFocused, setEmailFocused] = useState(false);
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    const { height } = useWindowDimensions();
    const isShortScreen = height < 700;

    return (
        <ScreenWrapper backgroundColor={Colors.Background}>
            
            <ScrollView
                style={AuthStyles.container}
                contentContainerStyle={[
                    AuthStyles.scrollContent,
                    { minHeight: isShortScreen ? 700 : '100%' }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                <View style={AuthStyles.header}> 
                    <TouchableOpacity onPress={onBack} style={AuthStyles.backButton}>
                        <Feather name="chevron-left" size={28} color={Colors.BLACK} />
                    </TouchableOpacity>
                    <CustomText style={AuthStyles.headerTitle}>Thrail</CustomText>
                    <View style={{ width: 28 }} />
                </View>

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="h1" style={AuthStyles.pageTitle}>
                            Sign Up
                        </CustomText>

                        {error && (
                            <View style={AuthStyles.errorContainer}>
                                <Feather name="alert-circle" size={18} color="#D32F2F" />
                                <CustomText style={AuthStyles.errorText}>
                                    {error}
                                </CustomText>
                            </View>
                        )}

                        <View style={[AuthStyles.inputContainer, emailFocused && AuthStyles.inputFocused]}>
                            <TextInput
                                style={AuthStyles.input}
                                placeholder="Email"
                                placeholderTextColor={Colors.GRAY_MEDIUM}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                        </View>

                        <View style={[AuthStyles.inputContainer, usernameFocused && AuthStyles.inputFocused]}>
                            <TextInput
                                style={AuthStyles.input}
                                placeholder="Username"
                                placeholderTextColor={Colors.GRAY_MEDIUM}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                onFocus={() => setUsernameFocused(true)}
                                onBlur={() => setUsernameFocused(false)}
                            />
                        </View>

                        <View style={[AuthStyles.inputContainer, passwordFocused && AuthStyles.inputFocused]}>
                            <TextInput
                                style={AuthStyles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.GRAY_MEDIUM}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                style={AuthStyles.eyeIcon}
                            >
                                <Feather 
                                    name={showPassword ? "eye" : "eye-off"} 
                                    size={20} 
                                    color={Colors.GRAY_MEDIUM} 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[AuthStyles.inputContainer, confirmFocused && AuthStyles.inputFocused]}>
                            <TextInput
                                style={AuthStyles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor={Colors.GRAY_MEDIUM}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                onFocus={() => setConfirmFocused(true)}
                                onBlur={() => setConfirmFocused(false)}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={AuthStyles.eyeIcon}
                            >
                                <Feather 
                                    name={showConfirmPassword ? "eye" : "eye-off"} 
                                    size={20} 
                                    color={Colors.GRAY_MEDIUM} 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton title="Continue" onPress={() => onSignUp(email, password)} variant="primary" />
                            <CustomButton title="Log In" onPress={onLogIn} variant="secondary" />
                        </View>

                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default SignUpScreen;