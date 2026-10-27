import { Alert, Platform } from "react-native";
import { captureAppError } from "./errorMonitoring";

/**
 * Formats error caught in the hook and logs it to prevent breaking the UI flow. 
 * @param error - Error object containing the error message.
 * @param errorState - A string that represents which hook state to access for the UI to display the error message. Default is 'error state'.
 * @param hook - A string that represents the name of the hook where the error was caught. Default is 'Unknown Access'.
 */
export const catchError = (error: Error, errorState: string = 'error state', hook: string = 'Unknown Access'): string => {
    const title = "Task Required"
    const message = (`Error caught; access \`${errorState}\` via \`${hook}\` \n\n${error}. Update the UI to properly catch the error. This warning is for development only, the error will cause a crash if unhandled in production code.`);

    if (
        error.message === 'Please enter a valid email address' ||
        error.message === 'Please enter a valid password' ||
        error.message === 'Password should be at least 6 characters long' ||
        error.message === 'Wrong password. Please try again.' ||
        error.message === 'Please check your credentials' ||
        error.message === 'Email already in-use. Log in instead' ||
        error.message === 'User not found'
    ) {
        return message;
    }

    // Automatically report caught application errors to Sentry
    captureAppError(error, { errorState, hook });

    if (__DEV__) {
        console.error(`Error: ${title}\n\n${message}`);
    } else {
        console.log(`Error: ${title}\n\n${message}`);
    }

    return message;
}

export const logger = (location: string, message: string, object?: any) => {
    if (!__DEV__) return;

    // console.log(`[${location}] ${message}`, object ?? ``);
}

export const refactorCatcher = (message: string) => {
    if (!__DEV__) return;

    const title = "Task Required"

    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message, [{ text: "Got it" }]);
    }
}