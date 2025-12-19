import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import CustomButton from '../../../components/CustomButton';
import CustomText from '../../../components/CustomText';
import CustomTextInput from '../../../components/CustomTextInput';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const SignUpScreen = ({ onLogInPress, onBackPress, onSignUpPress, error }) => {

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    return (
        <ScreenWrapper backgroundColor={Colors.Background}>
            
            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
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
                        
                        <CustomTextInput
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <CustomTextInput
                            placeholder="Username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        <CustomTextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <CustomTextInput
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Continue" 
                                onPress={() => onSignUpPress(email, password, username, confirmPassword)} 
                                variant="primary" 
                            />
                            <CustomButton 
                                title="Log In" 
                                onPress={onLogInPress} 
                                variant="secondary" 
                            />
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

export default SignUpScreen;