/**
 * Formats error caught in the hook and logs it to prevent breaking the UI flow. 
 * @param error - Error object containing the error message.
 * @param errorState - A string that represents which hook state to access for the UI to display the error message. Default is 'error state'.
 * @param hook - A string that represents the name of the hook where the error was caught. Default is 'Unknown Access'.
 */
export const catchError = (error: Error, errorState: string = 'error state', hook: string = 'Unknown Access'): void => {
    console.error(`Error caught; access \`${errorState}\` via \`${hook}\` \n\n${error}`);
}

export const logger = (location: string, message: string, object?: any) => {
    console.log(`[${location}] ${message}`, object ?? ``);
}