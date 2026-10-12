/**
 * @file useAuthValidation.ts
 * @description Custom hook managing client-side pre-validation, server error formatting,
 * and Tier 4 reactive error clearing on active typing and user actions.
 */

import {
    formatAuthErrorMessage,
    validateLogInFields,
    validateSignUpFields,
} from '@/src/features/Auth/utils/authValidation';
import { useState } from 'react';

/**
 * Hook providing pre-validation checks and Tier 4 reactive error clearing.
 *
 * @param serverError - Optional server error passed from controller props.
 * @returns Object containing activeError, validation methods, and error reset utilities.
 */
export const useAuthValidation = (serverError?: string | null) => {
    const [clientError, setClientError] = useState<string | null>(null);
    const [dismissedServerError, setDismissedServerError] = useState<string | null>(null);
    const [lastHandledServerError, setLastHandledServerError] = useState<string | null>(null);

    // Format the incoming server error
    const formattedServerError = serverError ? formatAuthErrorMessage(serverError) : null;

    // If a brand-new server error arrives that differs from what was last recorded, reset dismissal
    if (formattedServerError !== lastHandledServerError) {
        setLastHandledServerError(formattedServerError);
        setDismissedServerError(null);
    }

    /**
     * Executes client-side validation for log-in credentials.
     *
     * @param email - The entered email.
     * @param password - The entered password.
     * @returns {boolean} True if inputs pass validation, false otherwise.
     */
    const validateLogIn = (email?: string, password?: string): boolean => {
        setDismissedServerError(null);
        const error = validateLogInFields(email, password);
        setClientError(error);
        return error === null;
    };

    /**
     * Executes client-side validation for sign-up credentials.
     *
     * @param email - The entered email.
     * @param username - The chosen username.
     * @param password - The entered password.
     * @param confirmPassword - The repeated password.
     * @returns {boolean} True if inputs pass validation, false otherwise.
     */
    const validateSignUp = (
        email?: string,
        username?: string,
        password?: string,
        confirmPassword?: string,
    ): boolean => {
        setDismissedServerError(null);
        const error = validateSignUpFields(email, username, password, confirmPassword);
        setClientError(error);
        return error === null;
    };

    /**
     * Tier 4 Reactive Clear: Clears active error immediately on typing or any button action.
     */
    const clearError = (): void => {
        setClientError(null);
        if (formattedServerError) {
            setDismissedServerError(formattedServerError);
        }
    };

    const isServerDismissed = formattedServerError !== null && formattedServerError === dismissedServerError;
    const activeServerError = isServerDismissed ? null : formattedServerError;

    // Client validation takes precedence over server errors on new submit attempts
    const activeError = clientError ?? activeServerError ?? null;

    return {
        activeError,
        clientError,
        validateLogIn,
        validateSignUp,
        clearError,
    };
};
