export const getAuthErrorMessage = (error) => {
    switch (error.code) {
        case "auth/invalid-email":
            return 'Please enter a valid email address'

        case 'auth/missing-password':
            return 'Please enter a valid password'

        case 'auth/weak-password':
            return 'Password should be at least 6 characters long'

        case 'auth/invalid-credential':
            return 'Please check your credentials'

        case 'auth/email-already-in-use':
            return 'Email already in-use. Log in instead'

        default:
            return `Something went wrong. Please try again. \n${error.message}`
    }
}