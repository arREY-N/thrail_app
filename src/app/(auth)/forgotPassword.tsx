import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { ForgotPasswordController, useForgotPassword } from "@/src/core/hook/user/useForgotPassword";
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function forgotPassword(){
    const controller = useForgotPassword();

    return (
        <View style={{ flex: 1 }}>
            <ForgotPassword {...controller }/>

            <CustomLoading 
                children={undefined}
                message="Sending reset email..."
                visible={controller.loading}            
            />
        </View>
    )
}

export const ForgotPassword = ({ onSendResetEmail,  error, success, onLogIn, onBackPress }: ForgotPasswordController) => {
    const [email, setEmail] = useState("");

    return(
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader onBackPress={onBackPress} />  

            <ResponsiveScrollView 
                style={AuthStyles.container}
                contentContainerStyle={AuthStyles.scrollContent}      
            >
                <View style={{...AuthStyles.contentContainer, justifyContent: 'center', alignItems: 'center'}}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Forgot Password
                        </CustomText>

                        <ErrorMessage 
                            error={error} 
                            style={undefined} 
                            children={undefined} 
                        />

                        { success && (
                            <>
                                <View style={styles.container}>
                                    <Feather 
                                        name="alert-circle" 
                                        size={18} 
                                        color={Colors.SECONDARY} 
                                        style={styles.icon}
                                    />
                                    
                                    <View style={styles.textContainer}>
                                        <CustomText variant="caption" style={styles.text}>
                                            Email Sent! Please check your inbox for instructions to reset your password.
                                        </CustomText>
                                    </View>

                                </View>
                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Go to Log In"
                                        onPress={() => onLogIn()}
                                        variant="primary" 
                                        style={undefined}
                                        textStyle={undefined} 
                                        disabled={undefined} 
                                        children={undefined}                            
                                    />
                                </View>
                            </>
                        )}
                        
                        { !success && (
                            <>
                                <CustomTextInput
                                    label="Email Address"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none" 
                                    secureTextEntry={undefined} 
                                    isPasswordVisible={undefined} 
                                    onTogglePassword={undefined} 
                                    style={undefined} 
                                    inputStyle={undefined} 
                                    icon={undefined} 
                                    prefix={undefined} 
                                    children={undefined} 
                                    showTodayButton={undefined} 
                                    allowFutureDates={undefined} 
                                    defaultMode={undefined} 
                                    multiline={undefined} 
                                    maximumDate={undefined}                        
                                />

                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Send Reset Email"
                                        onPress={() => onSendResetEmail(email)}
                                        variant="primary" 
                                        style={undefined}
                                        textStyle={undefined} 
                                        disabled={undefined} 
                                        children={undefined}                            
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start', 
        borderWidth: 1,
        borderColor: Colors.SECONDARY,    
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    icon: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        color: Colors.BLACK,
        fontWeight: '500',
        lineHeight: 20,
    },
});