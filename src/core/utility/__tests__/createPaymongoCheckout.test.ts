import * as admin from 'firebase-admin';

// 1. Mock all Firebase Admin and Functions modules to prevent backend errors in Jest
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(), {
      FieldPath: class {}
  }),
  messaging: jest.fn(),
  auth: jest.fn()
}), { virtual: true });

jest.mock('firebase-functions', () => ({
    setGlobalOptions: jest.fn()
}), { virtual: true });

jest.mock('firebase-functions/v1', () => ({
    firestore: { document: jest.fn(() => ({ onCreate: jest.fn(), onUpdate: jest.fn() })) },
    auth: { user: jest.fn(() => ({ onCreate: jest.fn() })) },
    https: { onRequest: jest.fn() }
}), { virtual: true });

jest.mock('firebase-functions/https', () => ({
    onCall: jest.fn((opts, handler) => {
        return typeof opts === 'function' ? opts : handler;
    }),
    HttpsError: class HttpsError extends Error {
        constructor(code: string, message: string) {
            super(message);
            // @ts-ignore
            this.code = code;
        }
    }
}), { virtual: true });

jest.mock('firebase-functions/v2/https', () => ({
    onRequest: jest.fn((handler) => handler)
}), { virtual: true });

jest.mock('firebase-functions/params', () => ({
    defineSecret: jest.fn(() => ({ value: () => 'dummy_secret_key' }))
}), { virtual: true });

// Mock global fetch to simulate PayMongo API responses
global.fetch = jest.fn();

// 2. Import the backend file
// We use require to ensure it loads synchronously after our mocks
const backend = require('../../../../functions/index.js');

describe('createPaymongoCheckout Error Handlers', () => {
    const createPaymongoCheckout = backend.createPaymongoCheckout;

    const mockRequest = {
        data: {
            amount: 5000, // 50 PHP
            type: 'gcash',
            returnUrl: 'thrailapp://payment-result'
        },
        auth: { uid: 'user_123', token: {} }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockFetchError = (status: number, jsonResponse?: any, textFallback?: string) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: status,
            text: jest.fn().mockResolvedValueOnce(
                jsonResponse ? JSON.stringify(jsonResponse) : (textFallback || 'Error')
            )
        });
    };

    test('throws unavailable error on 401 / 403 API Auth failure', async () => {
        mockFetchError(401, null, 'Unauthorized');

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("Payment service is currently unavailable. Please notify the Thrail administrators.");
    });

    test('handles AMOUNT_EXCEED_LIMIT error code safely', async () => {
        mockFetchError(400, {
            errors: [{ code: 'AMOUNT_EXCEED_LIMIT' }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("This booking exceeds the ₱100,000 maximum transaction limit for GCash/Maya. Please use a different payment method or pay in installments.");
    });

    test('handles pointer-based amount exceed limit (fallback match)', async () => {
        mockFetchError(400, {
            errors: [{ source: { pointer: 'amount' }, detail: 'Amount exceeds the maximum allowed value.' }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("This booking exceeds the ₱100,000 maximum transaction limit for GCash/Maya. Please use a different payment method or pay in installments.");
    });

    test('handles minimum amount invalid parameter (under 100 PHP)', async () => {
        mockFetchError(400, {
            errors: [{ code: 'parameter_invalid', source: { pointer: 'amount' }, detail: 'Must be at least 10000' }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("The booking amount (or 50% downpayment) is too small. The minimum payment required by GCash/Maya is ₱100.");
    });

    test('handles invalid return_url format securely', async () => {
        mockFetchError(400, {
            errors: [{ code: 'parameter_format_invalid', source: { pointer: 'return_url' } }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("An internal routing error occurred while generating your booking checkout. Please try again.");
    });

    test('handles internal SYSTEM_ERROR codes indicating downtime', async () => {
        mockFetchError(500, {
            errors: [{ code: 'SYSTEM_ERROR' }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("GCash/Maya is currently experiencing temporary system downtime. Please try again in a few minutes.");
    });

    test('handles fallback to raw detail for unknown PayMongo errors', async () => {
        mockFetchError(400, {
            errors: [{ code: 'WEIRD_ERROR', detail: 'This account is restricted.' }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("This account is restricted.");
    });

    test('handles missing detail string with a generic fallback message', async () => {
        mockFetchError(400, {
            errors: [{ code: 'UNKNOWN_BLANK_ERROR' }]
        });

        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("An unexpected error occurred with the payment gateway.");
    });

    test('handles completely non-JSON HTML network responses and timeouts safely', async () => {
        mockFetchError(503, null, '<html><body>503 Service Unavailable</body></html>');

        // Using >= 500 block mapping or plain timeout connection wrapper 
        await expect(createPaymongoCheckout(mockRequest))
            .rejects.toThrow("GCash/Maya is currently experiencing temporary system downtime. Please try again in a few minutes.");
    });
});
