import { FirebaseError } from "firebase/app"

export const getAuthErrorMessage = (error: FirebaseError) => {
    switch (error.code) {
        case "auth/invalid-email":
            return 'Please enter a valid email address'

        case 'auth/missing-password':
            return 'Please enter a valid password'

        case 'auth/weak-password':
            return 'Password should be at least 6 characters long'
        
        case 'auth/wrong-password':
            return 'Wrong password. Please try again.'

        case 'auth/invalid-credential':
            return 'Please check your credentials'

        case 'auth/email-already-in-use':
            return 'Email already in-use. Log in instead'

        case 'auth/user-not-found':
            return 'User not found'
        
        case 'backend/invalid-credentials':
            return error.message;

        // secureLogin Cloud Function (server-side login limiter)
        case 'functions/unauthenticated':
        case 'functions/resource-exhausted':
        case 'functions/invalid-argument':
        case 'functions/permission-denied':
            return error.message;

        case 'functions/unavailable':
        case 'functions/internal':
            return 'Something went wrong. Please try again later.';

        default:
            return `Something went wrong. Please try again. \n${error.message}`
    }
}