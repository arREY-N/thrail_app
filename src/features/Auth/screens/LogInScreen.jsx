import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import CustomButton from '../../../components/CustomButton';
import CustomText from '../../../components/CustomText';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const LogInScreen = ({ onLogIn, onSignUp, onBackPress, onForgotPassword, error }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const { height } = useWindowDimensions();
    const isShortScreen = height < 600;

    return (
        <ScreenWrapper backgroundColor={Colors.Background}>
            
            <ScrollView
                style={AuthStyles.container}
                contentContainerStyle={[
                    AuthStyles.scrollContent,
                    { minHeight: isShortScreen ? 600 : '100%' } 
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                <View style={AuthStyles.header}> 
                    <TouchableOpacity onPress={onBackPress} style={AuthStyles.backButton}>
                        <Feather name="chevron-left" size={28} color={Colors.BLACK} />
                    </TouchableOpacity>
                    <CustomText style={AuthStyles.headerTitle}>Thrail</CustomText>
                    <View style={{ width: 28 }} />
                </View>

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="h1" style={AuthStyles.pageTitle}>
                            Log In
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

                        <TouchableOpacity onPress={onForgotPassword} style={AuthStyles.forgotContainer}>
                            <CustomText style={AuthStyles.forgotText}>Forgot Password</CustomText>
                        </TouchableOpacity>

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton title="Log In" onPress={() => onLogIn(email, password)} variant="primary" />
                            <CustomButton title="Sign Up" onPress={onSignUp} variant="secondary" />
                        </View>

                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default LogInScreen;