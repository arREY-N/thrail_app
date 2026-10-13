import { FirebaseError } from "firebase/app"

export const getAuthErrorMessage = (error: FirebaseError | { code?: string; message?: string } | string) => {
    const code = typeof error === 'string' ? error : error?.code;
    const message = typeof error === 'string' ? error : error?.message;

    switch (code) {
        case "auth/invalid-email":
        case "invalid-email":
            return 'Please enter a valid email address';

        case 'auth/missing-password':
        case 'missing-password':
            return 'Please enter a valid password';

        case 'auth/weak-password':
        case 'weak-password':
            return 'Password should be at least 6 characters long';
        
        case 'auth/wrong-password':
        case 'wrong-password':
            return 'Wrong password. Please try again.';

        case 'auth/invalid-credential':
        case 'invalid-credential':
            return 'Please check your credentials';

        case 'auth/email-already-in-use':
        case 'email-already-in-use':
            return 'Email already in-use. Log in instead';

        case 'auth/user-not-found':
        case 'user-not-found':
            return 'User not found';

        case 'auth/operation-not-allowed':
        case 'operation-not-allowed':
            return 'Operation not allowed. Please contact support.';

        case 'auth/network-request-failed':
        case 'network-request-failed':
            return 'Network error. Please check your internet connection and try again.';

        case 'auth/too-many-requests':
        case 'too-many-requests':
            return 'Too many unsuccessful attempts. Please wait a few moments before trying again.';

        case 'auth/user-disabled':
        case 'user-disabled':
            return 'This account has been disabled. Please contact support.';
        
        case 'backend/invalid-credentials':
            return message || 'Invalid credentials';

        // secureLogin Cloud Function (server-side login limiter)
        case 'functions/unauthenticated':
        case 'unauthenticated':
        case 'functions/resource-exhausted':
        case 'resource-exhausted':
        case 'functions/invalid-argument':
        case 'invalid-argument':
        case 'functions/permission-denied':
        case 'permission-denied':
            return message || 'Authentication failed';

        case 'functions/unavailable':
        case 'unavailable':
        case 'functions/internal':
        case 'internal':
            return 'Something went wrong. Please try again later.';

        default:
            return message ? `Something went wrong. Please try again. \n${message}` : 'An error occurred during authentication. Please try again.';
    }
}