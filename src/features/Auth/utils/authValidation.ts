/**
 * @file authValidation.ts
 * @description Pure utility functions for validating login and registration inputs, calculating password strength, and formatting authentication error messages.
 */

import { INVISIBLE_CHARS_REGEX } from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';

/**
 * Standard RFC-compliant email regular expression enforcing 2+ char TLD and standard delimiters.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

/**
 * Strict username regular expression:
 * - 6 to 30 characters
 * - Only alphanumeric characters, periods, and underscores
 * - Cannot start or end with a period or underscore
 * - Cannot contain consecutive periods or underscores
 */
export const USERNAME_REGEX = /^(?![._])(?!.*[._]{2})[a-zA-Z0-9._]{6,30}(?<![._])$/;

/**
 * Approved special characters required by password validation (standard ASCII specials).
 */
export const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

/**
 * Sanitizes username input by removing whitespace, zero-width characters,
 * and characters outside alphanumeric, periods, and underscores.
 *
 * @param text - The raw username input string.
 * @returns {string} The sanitized username.
 */
export const sanitizeUsername = (text?: string): string => {
    if (!text) return '';
    return text
        .replace(INVISIBLE_CHARS_REGEX, '')
        .replace(/\s/g, '')
        .replace(/[^a-zA-Z0-9._]/g, '');
};

/**
 * Sanitizes email input by removing whitespace, zero-width characters,
 * and characters not permissible in standard emails.
 * Preserves user-typed casing (e.g. JuanDelaCruz@sample.com).
 *
 * @param text - The raw email input string.
 * @returns {string} The sanitized email string.
 */
export const sanitizeEmail = (text?: string): string => {
    if (!text) return '';
    return text
        .replace(INVISIBLE_CHARS_REGEX, '')
        .replace(/\s/g, '')
        .replace(/[^a-zA-Z0-9@._-]/g, '');
};

/**
 * Sanitizes password input by stripping whitespace, zero-width characters,
 * and non-printable characters while preserving standard ASCII.
 *
 * @param text - The raw password input string.
 * @returns {string} The sanitized password string.
 */
export const sanitizePassword = (text?: string): string => {
    if (!text) return '';
    return text
        .replace(INVISIBLE_CHARS_REGEX, '')
        .replace(/\s/g, '')
        .replace(/[^\x20-\x7E]/g, '');
};

/**
 * Validates login input fields before triggering authentication requests.
 *
 * @param email - The entered email string.
 * @param password - The entered password string.
 * @returns {string | null} An error message if invalid, or null if valid.
 */
export const validateLogInFields = (email?: string, password?: string): string | null => {
    const trimmedEmail = email?.trim() ?? '';
    const trimmedPassword = password ?? '';

    if (!trimmedEmail || !trimmedPassword) {
        return 'Please enter your email and password.';
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return 'Please enter a valid email address.';
    }

    return null;
};

/**
 * Validates sign-up credentials before progressing to the next registration step.
 *
 * @param email - The entered email string.
 * @param username - The chosen username.
 * @param password - The created password.
 * @param confirmPassword - The repeated password for confirmation.
 * @returns {string | null} An error message if invalid, or null if valid.
 */
export const validateSignUpFields = (
    email?: string,
    username?: string,
    password?: string,
    confirmPassword?: string,
): string | null => {
    const trimmedEmail = email?.trim() ?? '';
    const trimmedUsername = username?.trim() ?? '';
    const pass = password ?? '';
    const confirmPass = confirmPassword ?? '';

    if (!trimmedEmail || !trimmedUsername || !pass || !confirmPass) {
        return 'Please fill in all required fields.';
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return 'Please enter a valid email address.';
    }

    if (trimmedUsername.length < 6) {
        return 'Username must be at least 6 characters.';
    }

    if (trimmedUsername.length > 30) {
        return 'Username cannot exceed 30 characters.';
    }

    if (/\s/.test(trimmedUsername)) {
        return 'Username cannot contain spaces.';
    }

    if (/^[._]/.test(trimmedUsername) || /[._]$/.test(trimmedUsername)) {
        return 'Username cannot start or end with a period or underscore.';
    }

    if (/[._]{2}/.test(trimmedUsername)) {
        return 'Username cannot contain consecutive periods or underscores.';
    }

    if (!/^[a-zA-Z0-9._]+$/.test(trimmedUsername)) {
        return 'Username can only contain letters, numbers, periods, and underscores.';
    }

    if (pass.length < 8) {
        return 'Password must be at least 8 characters.';
    }

    if (pass.length > 64) {
        return 'Password cannot exceed 64 characters.';
    }

    if (/\s/.test(pass)) {
        return 'Password cannot contain spaces.';
    }

    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = PASSWORD_SPECIAL_REGEX.test(pass);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return 'Password must contain uppercase, lowercase, numerical, and special characters (e.g. !@#$%^&*).';
    }

    if (pass !== confirmPass) {
        return 'Passwords do not match.';
    }

    return null;
};

/**
 * Evaluates password strength and returns the strength level (0-3) and corresponding color.
 *
 * @param password - The password string to evaluate.
 * @returns {{ strength: number; color: string }} The numeric strength (0-3) and semantic theme color.
 */
export const calculatePasswordStrength = (
    password?: string,
): { strength: number; color: string } => {
    const pass = password ?? '';
    if (pass.length === 0) {
        return { strength: 0, color: Colors.STRENGTH_EMPTY };
    }

    const hasLength = pass.length >= 8 && pass.length <= 64;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = PASSWORD_SPECIAL_REGEX.test(pass);
    const noSpaces = !/\s/.test(pass);

    let strength = 1;
    if (hasLength && hasUpper && hasLower && hasNumber && hasSpecial && noSpaces) {
        strength = 3;
    } else if (hasLength && (hasNumber || hasSpecial)) {
        strength = 2;
    }

    const color =
        strength === 3
            ? Colors.STRENGTH_STRONG
            : strength === 2
                ? Colors.STRENGTH_MEDIUM
                : Colors.STRENGTH_WEAK;

    return { strength, color };
};

/**
 * Formats caught authentication error messages into clean, user-friendly strings.
 *
 * @param error - The raw caught error (Error, FirebaseError, string, or unknown).
 * @returns {string} A sanitized and human-readable error description.
 */
export const formatAuthErrorMessage = (error: unknown): string => {
    if (!error) {
        return 'An unexpected error occurred. Please try again.';
    }

    const rawMessage = typeof error === 'string'
        ? error
        : error instanceof Error
            ? error.message
            : String(error);

    const lower = rawMessage.toLowerCase();

    // Clean Google Sign-In user cancellation
    if (
        lower.includes('popup-closed-by-user') ||
        lower.includes('cancelled') ||
        lower.includes('canceled')
    ) {
        return 'Google sign-in was cancelled.';
    }

    // Strip internal server/repository prefixes
    if (rawMessage.startsWith('Failed checking user credentials: ')) {
        return rawMessage.replace('Failed checking user credentials: ', '').trim();
    }

    // Network request failures
    if (lower.includes('network-request-failed') || lower.includes('network error')) {
        return 'Network error. Please check your internet connection.';
    }

    // Rate limiting
    if (lower.includes('too-many-requests')) {
        return 'Too many failed attempts. Please try again later.';
    }

    // Account disabled
    if (lower.includes('user-disabled')) {
        return 'This account has been disabled. Please contact support.';
    }

    return rawMessage;
};
