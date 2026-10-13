import { getAuthErrorMessage } from '../autherror';
import { getAuthErrorMessage as getAuthErrorMessageFromUtility } from '../../utility/autherror';
import { FirebaseError } from 'firebase/app';

describe('getAuthErrorMessage', () => {
    it('maps network-request-failed correctly', () => {
        expect(getAuthErrorMessage({ code: 'auth/network-request-failed' } as FirebaseError))
            .toBe('Network error. Please check your internet connection and try again.');
        expect(getAuthErrorMessage('network-request-failed'))
            .toBe('Network error. Please check your internet connection and try again.');
    });

    it('maps too-many-requests correctly', () => {
        expect(getAuthErrorMessage({ code: 'auth/too-many-requests' } as FirebaseError))
            .toBe('Too many unsuccessful attempts. Please wait a few moments before trying again.');
        expect(getAuthErrorMessage('too-many-requests'))
            .toBe('Too many unsuccessful attempts. Please wait a few moments before trying again.');
    });

    it('maps user-disabled correctly', () => {
        expect(getAuthErrorMessage({ code: 'auth/user-disabled' } as FirebaseError))
            .toBe('This account has been disabled. Please contact support.');
        expect(getAuthErrorMessage('user-disabled'))
            .toBe('This account has been disabled. Please contact support.');
    });

    it('maps operation-not-allowed correctly', () => {
        expect(getAuthErrorMessage({ code: 'auth/operation-not-allowed' } as FirebaseError))
            .toBe('Operation not allowed. Please contact support.');
        expect(getAuthErrorMessage('operation-not-allowed'))
            .toBe('Operation not allowed. Please contact support.');
    });

    it('maps existing auth error codes correctly', () => {
        expect(getAuthErrorMessage({ code: 'auth/invalid-email' } as FirebaseError))
            .toBe('Please enter a valid email address');
        expect(getAuthErrorMessage({ code: 'auth/missing-password' } as FirebaseError))
            .toBe('Please enter a valid password');
        expect(getAuthErrorMessage({ code: 'auth/weak-password' } as FirebaseError))
            .toBe('Password should be at least 6 characters long');
        expect(getAuthErrorMessage({ code: 'auth/wrong-password' } as FirebaseError))
            .toBe('Wrong password. Please try again.');
        expect(getAuthErrorMessage({ code: 'auth/invalid-credential' } as FirebaseError))
            .toBe('Please check your credentials');
        expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' } as FirebaseError))
            .toBe('Email already in-use. Log in instead');
        expect(getAuthErrorMessage({ code: 'auth/user-not-found' } as FirebaseError))
            .toBe('User not found');
    });

    it('handles cloud function error codes correctly', () => {
        expect(getAuthErrorMessage({ code: 'functions/unauthenticated', message: 'Custom unauth' } as FirebaseError))
            .toBe('Custom unauth');
        expect(getAuthErrorMessage({ code: 'unauthenticated', message: 'Custom unauth' } as FirebaseError))
            .toBe('Custom unauth');
        expect(getAuthErrorMessage({ code: 'functions/unavailable' } as FirebaseError))
            .toBe('Something went wrong. Please try again later.');
        expect(getAuthErrorMessage({ code: 'functions/internal' } as FirebaseError))
            .toBe('Something went wrong. Please try again later.');
        expect(getAuthErrorMessage({ code: 'internal' } as FirebaseError))
            .toBe('Something went wrong. Please try again later.');
    });

    it('handles unmapped errors with fallback message', () => {
        expect(getAuthErrorMessage({ code: 'unknown-error', message: 'Something broke' } as unknown as FirebaseError))
            .toBe('Something went wrong. Please try again. \nSomething broke');
    });

    it('is re-exported identically from utility/autherror', () => {
        expect(getAuthErrorMessageFromUtility('auth/network-request-failed'))
            .toBe('Network error. Please check your internet connection and try again.');
    });
});
