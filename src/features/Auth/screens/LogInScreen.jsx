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

const LogInScreen = ({ onLogInPress, onSignUpPress, onBackPress, onForgotPasswordPress, error }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                        
                        <CustomTextInput
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <CustomTextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity onPress={onForgotPasswordPress} style={AuthStyles.forgotContainer}>
                            <CustomText style={AuthStyles.forgotText}>Forgot Password</CustomText>
                        </TouchableOpacity>

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Log In" 
                                onPress={() => onLogInPress(email, password)} 
                                variant="primary" 
                            />
                            <CustomButton 
                                title="Sign Up" 
                                onPress={onSignUpPress} 
                                variant="secondary" 
                            />
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

export default LogInScreen;