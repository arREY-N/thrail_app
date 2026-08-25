import { Alert, Platform } from "react-native";

/**
 * Formats error caught in the hook and logs it to prevent breaking the UI flow. 
 * @param error - Error object containing the error message.
 * @param errorState - A string that represents which hook state to access for the UI to display the error message. Default is 'error state'.
 * @param hook - A string that represents the name of the hook where the error was caught. Default is 'Unknown Access'.
 */
export const catchError = (error: Error, errorState: string = 'error state', hook: string = 'Unknown Access'): void => {
    if (!__DEV__) return;

    const title = "🔨 UI Task Required"
    const message = (`Error caught; access \`${errorState}\` via \`${hook}\` \n\n${error}`);

    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message, [{ text: "Got it" }]);
    }
}

export const logger = (location: string, message: string, object?: any) => {
    if (!__DEV__) return;

    console.log(`[${location}] ${message}`, object ?? ``);
}

export const refactorCatcher = (message: string) => {
    if (!__DEV__) return;

    const title = "🔨 UI Task Required"

    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message, [{ text: "Got it" }]);
    }
}