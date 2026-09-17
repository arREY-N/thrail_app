import { auth } from '@/src/core/config/Firebase';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { confirmPasswordReset, sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';

export interface ForgotPasswordController {
    onSendResetEmail: (email: string) => Promise<void>;
    onResetPassword: (data: { confirm: string, password: string }) => Promise<void>;
    loading: boolean;
    error: string | null;
    success: boolean;
    onLanding: () => void;
    onBackPress: () => void;
    onLogIn: () => void;
    oobCode?: string;
    reset: () => void;
}

export const useForgotPassword = (oobCode?: any): ForgotPasswordController => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { onLanding, onBackPress, onLogIn } = useAppNavigation();

    const onSendResetEmail = async (email: string) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            if (!email) {
                throw new Error('Please enter your email address.');
            }

            const existing = await UserRepo.checkEmail(email);

            if (!existing) {
                throw new Error('No user with this email found.');
            }

            await sendPasswordResetEmail(auth, email, {
                url: 'https://thrail.web.app/login',
                handleCodeInApp: false,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    const onResetPassword = async ({ confirm, password }: { confirm: string, password: string }) => {
        setLoading(true);
        setError(null);

        try {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

            if (!passwordRegex.test(password)) {
                throw new Error('Password must be at least 8 characters, with an uppercase, lowercase, number, and special character.');
            }

            if (password !== confirm) {
                throw new Error('Passwords do not match.');
            }

            if (!oobCode || (oobCode && typeof oobCode !== 'string')) {
                throw new Error('Invalid or expired reset link.');
            }
            const test = true

            if (test) {
                console.log("Simulating password reset...");
                console.log(auth, oobCode, password);
                setSuccess(true);
                return
            };

            await confirmPasswordReset(auth, oobCode, password);
            onLanding();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setLoading(false);
        setError(null);
        setSuccess(false);
    };

    return {
        onLanding,
        onSendResetEmail,
        onBackPress,
        onResetPassword,
        onLogIn,
        loading,
        error,
        success,
        reset
    };
};