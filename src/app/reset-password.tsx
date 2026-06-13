import CustomButton from "@/src/components/CustomButton";
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { ForgotPasswordController, useForgotPassword } from "@/src/core/hook/user/useForgotPassword";
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function ResetPasswordScreen() {
    const { oobCode } = useLocalSearchParams();
    const controller = useForgotPassword(oobCode);

    return (
        <View style={{ flex: 1 }}>
            <CustomLoading visible={controller.loading} message="Loading..." children={undefined} />
            <ResetPasswordForm {...controller}/>
        </View>
    );
}

const ResetPasswordForm = ({ onResetPassword, error, success, onLanding, onLogIn }: ForgotPasswordController) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    // Password strength logic
    const strength = password.length === 0 ? 0 : (
        /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password) && password.length >= 8 ? 3 :
        (password.length >= 8 ? 2 : 1)
    );

    const getStrengthColor = () => [Colors.STRENGTH_EMPTY, Colors.STRENGTH_WEAK, Colors.STRENGTH_MEDIUM, Colors.STRENGTH_STRONG][strength];


    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <View style={{...AuthStyles.contentContainer, justifyContent: 'center', alignItems: 'center'}}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Reset Password
                        </CustomText>

                        <ErrorMessage error={error} style={undefined} children={undefined} />
                        
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
                                            Password Updated! Please log in with your new password.
                                        </CustomText>
                                    </View>

                                </View>
                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Log In"
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
                                <View>
                                    <CustomTextInput
                                        label="Password *"
                                        placeholder="Type your password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        isPasswordVisible={showPasswords}
                                        onTogglePassword={() => setShowPasswords(!showPasswords)}
                                        style={{ marginBottom: 0 }} keyboardType={undefined} inputStyle={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined} defaultMode={undefined} multiline={undefined} maximumDate={undefined}                            />

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
                                    onTogglePassword={() => setShowPasswords(!showPasswords)} keyboardType={undefined} style={undefined} inputStyle={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined} defaultMode={undefined} multiline={undefined} maximumDate={undefined}                        />

                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Reset Password"
                                        onPress={() => onResetPassword({ confirm: confirmPassword, password })}
                                        variant="primary" style={undefined} textStyle={undefined} disabled={undefined} children={undefined}                            />
                                </View>

                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Home"
                                        onPress={() => onLanding()}
                                        variant="primary" style={undefined} textStyle={undefined} disabled={undefined} children={undefined}                            />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    )

    // return (
    //     <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
    //         <ResponsiveScrollView style={AuthStyles.container} contentContainerStyle={undefined}>
    //             <View style={AuthStyles.contentContainer}>
    //                 <CustomText variant="title">Reset Password</CustomText>
    //                 <ErrorMessage error={error} style={undefined} children={undefined} />
                    
    //                 <CustomTextInput label="Password *" value={password} onChangeText={setPassword} secureTextEntry={!showPasswords} onTogglePassword={() => setShowPasswords(!showPasswords)} placeholder={undefined} keyboardType={undefined} isPasswordVisible={undefined} style={undefined} inputStyle={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined} defaultMode={undefined} multiline={undefined} maximumDate={undefined} />
                    
    //                 <View style={AuthStyles.strengthContainer}>
    //                     {[1, 2, 3].map((level) => (
    //                         <View key={level} style={[AuthStyles.strengthBar, { backgroundColor: strength >= level ? getStrengthColor() : Colors.STRENGTH_EMPTY }]} />
    //                     ))}
    //                 </View>

    //                 <CustomTextInput label="Confirm Password *" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPasswords} placeholder={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} style={undefined} inputStyle={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined} defaultMode={undefined} multiline={undefined} maximumDate={undefined} />

    //                 <CustomButton 
    //                     title={loading ? "Updating..." : "Set New Password"}
    //                     disabled={loading}
    //                     onPress={() => onResetPassword({ confirm: confirmPassword, password })} style={undefined} textStyle={undefined} children={undefined}                    />
    //             </View>
    //         </ResponsiveScrollView>
    //     </ScreenWrapper>
    // );
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