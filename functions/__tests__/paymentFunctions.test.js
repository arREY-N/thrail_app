/* eslint-env jest */
/**
 * @file paymentFunctions.test.js
 * @description Comprehensive unit & integration tests for updated Cloud Functions:
 * 1. paymongoRedirect (Web opener handshake, postMessage, auto-close, mobile deep-link fallback)
 * 2. refundBooking (Custom refund, admin auth guards, mutex locking, bounds validation, rollback on error, same-day partial catch)
 */

// Set required environment variables before requiring functions
process.env.GCLOUD_PROJECT = 'thrail-app-test';
process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: 'thrail-app-test',
    databaseURL: 'https://thrail-app-test.firebaseio.com',
    storageBucket: 'thrail-app-test.appspot.com',
});

// Mock PayMongoProvider
const mockIssueRefund = jest.fn();
jest.mock('../services/providers/PayMongoProvider', () => {
    return jest.fn().mockImplementation(() => ({
        issueRefund: mockIssueRefund,
    }));
});

// Mock firebase-admin
const mockBookingGet = jest.fn();
const mockBookingUpdate = jest.fn();
const mockDoc = jest.fn(() => ({
    get: mockBookingGet,
    update: mockBookingUpdate,
    collection: jest.fn(() => ({
        doc: mockDoc,
    })),
}));
const mockCollection = jest.fn(() => ({
    doc: mockDoc,
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [] }),
}));

const mockFirestore = {
    collection: mockCollection,
    doc: mockDoc,
};

jest.mock('firebase-admin', () => {
    return {
        initializeApp: jest.fn(),
        firestore: Object.assign(jest.fn(() => mockFirestore), {
            FieldValue: {
                serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
                arrayUnion: jest.fn((...args) => ({ _methodName: 'arrayUnion', elements: args })),
            },
            Timestamp: {
                now: jest.fn(() => ({
                    toDate: () => new Date('2026-09-23T12:00:00Z'),
                })),
                fromDate: jest.fn((d) => ({
                    toDate: () => d,
                })),
            },
            FieldPath: {
                documentId: jest.fn(() => '__name__'),
            },
        }),
    };
});

// Import the cloud functions module
const cloudFunctions = require('../index');

describe('Payment & Refund Cloud Functions Test Suite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIssueRefund.mockReset();
    });

    // ─────────────────────────────────────────────────────────────
    // 1. paymongoRedirect Tests
    // ─────────────────────────────────────────────────────────────
    describe('paymongoRedirect', () => {
        let req, res;

        beforeEach(() => {
            req = { query: {} };
            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis(),
            };
        });

        it('should return 400 if the target URL parameter is missing', () => {
            cloudFunctions.paymongoRedirect(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Missing URL parameter');
        });

        it('should generate proxy HTML with window.opener handshake and auto-close for web popup flow', () => {
            const targetUrl = 'http://localhost:8081/book/list?bookingId=b_123&view=overview';
            req.query.url = targetUrl;

            cloudFunctions.paymongoRedirect(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const html = res.send.mock.calls[0][0];

            // Verify title and structure
            expect(html).toContain('<title>Payment Complete</title>');
            expect(html).toContain('Payment Successful');

            // Verify window.opener communication and postMessage handshake
            expect(html).toContain('window.opener && !window.opener.closed');
            expect(html).toContain("type: 'PAYMONGO_PAYMENT_SUCCESS'");
            expect(html).toContain('window.opener.location.href = target');
            expect(html).toContain('window.close()');

            // Verify fallback for mobile deep links
            expect(html).toContain('window.location.href = target');
            expect(html).toContain(JSON.stringify(targetUrl));
        });

        it('should correctly handle native mobile deep-link URLs (thrailapp://)', () => {
            const nativeUrl = 'thrailapp://book/list?bookingId=b_456&view=overview';
            req.query.url = nativeUrl;

            cloudFunctions.paymongoRedirect(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const html = res.send.mock.calls[0][0];
            expect(html).toContain(JSON.stringify(nativeUrl));
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. refundBooking Tests
    // ─────────────────────────────────────────────────────────────
    describe('refundBooking', () => {
        const handler = cloudFunctions.refundBooking.run || cloudFunctions.refundBooking;

        const defaultCapturedPayment = {
            gateway: 'paymongo',
            sessionId: 'cs_123',
            gatewayId: 'pay_123',
            status: 'captured',
            amount: 1500,
            refundableUntil: {
                toDate: () => new Date('2026-10-01T00:00:00Z'),
            },
        };

        const defaultBookingData = {
            id: 'book_1',
            business: { id: 'biz_1' },
            user: { id: 'user_1' },
            payment: [{ ...defaultCapturedPayment }],
        };

        const adminAuth = {
            uid: 'admin_uid',
            token: { role: 'admin', businessId: 'biz_1' },
        };

        const superAdminAuth = {
            uid: 'superadmin_uid',
            token: { role: 'superadmin' },
        };

        const userAuth = {
            uid: 'user_1',
            token: { role: 'user' },
        };

        it('should throw unauthenticated if caller is not logged in', async () => {
            await expect(
                handler({
                    auth: null,
                    data: { bookingId: 'book_1', userId: 'user_1' },
                })
            ).rejects.toThrow(/Auth required/);
        });

        it('should throw not-found if booking does not exist in Firestore', async () => {
            mockBookingGet.mockResolvedValueOnce({ exists: false });

            await expect(
                handler({
                    auth: adminAuth,
                    data: { bookingId: 'book_1', userId: 'user_1' },
                })
            ).rejects.toThrow(/Booking not found/);
        });

        it('should throw failed-precondition if payment is not captured', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    ...defaultBookingData,
                    payment: [{ ...defaultCapturedPayment, status: 'pending' }],
                }),
            });

            await expect(
                handler({
                    auth: adminAuth,
                    data: { bookingId: 'book_1', userId: 'user_1' },
                })
            ).rejects.toThrow(/Cannot refund a booking that is not captured/);
        });

        it('should throw failed-precondition if booking was already refunded', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    ...defaultBookingData,
                    payment: [{ ...defaultCapturedPayment, status: 'refunded' }],
                }),
            });

            await expect(
                handler({
                    auth: adminAuth,
                    data: { bookingId: 'book_1', userId: 'user_1' },
                })
            ).rejects.toThrow(/This booking has already been refunded/);
        });

        it('should throw failed-precondition if a refund is already in-flight (mutex lock check)', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    ...defaultBookingData,
                    payment: [{ ...defaultCapturedPayment, status: 'processing_refund' }],
                }),
            });

            await expect(
                handler({
                    auth: adminAuth,
                    data: { bookingId: 'book_1', userId: 'user_1' },
                })
            ).rejects.toThrow(/A refund is already in progress/);
        });

        it('should throw permission-denied if caller is unauthorized', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => defaultBookingData,
            });

            const unauthorizedAuth = {
                uid: 'other_user',
                token: { role: 'user' },
            };

            await expect(
                handler({
                    auth: unauthorizedAuth,
                    data: { bookingId: 'book_1', userId: 'user_1' },
                })
            ).rejects.toThrow(/Not authorized to refund this booking/);
        });

        it('should throw permission-denied if regular user attempts to supply customAmount', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => defaultBookingData,
            });

            await expect(
                handler({
                    auth: userAuth,
                    data: { bookingId: 'book_1', userId: 'user_1', customAmount: 500 },
                })
            ).rejects.toThrow(/Only admins can set a custom refund amount/);
        });

        it('should throw invalid-argument if customAmount is less than 1.00 PHP', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => defaultBookingData,
            });

            await expect(
                handler({
                    auth: adminAuth,
                    data: { bookingId: 'book_1', userId: 'user_1', customAmount: 0.50 },
                })
            ).rejects.toThrow(/Minimum refund amount is ₱1.00/);
        });

        it('should throw invalid-argument if customAmount exceeds total payment amount', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => defaultBookingData,
            });

            await expect(
                handler({
                    auth: adminAuth,
                    data: { bookingId: 'book_1', userId: 'user_1', customAmount: 2000 },
                })
            ).rejects.toThrow(/Custom refund amount cannot exceed total paid/);
        });

        it('should successfully issue a custom amount refund for admin with concurrency lock and Firestore updates', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    ...defaultBookingData,
                    payment: [{ ...defaultCapturedPayment }],
                }),
            });
            mockIssueRefund.mockResolvedValueOnce({ id: 'ref_123', status: 'succeeded' });

            const result = await handler({
                auth: adminAuth,
                data: {
                    bookingId: 'book_1',
                    userId: 'user_1',
                    customAmount: 750,
                    reason: 'requested_by_admin',
                },
            });

            // 1. Verify in-flight lock was set
            expect(mockBookingUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    payment: [expect.objectContaining({ status: 'processing_refund' })],
                })
            );

            // 2. Verify PayMongo was called with exact custom amount (750 PHP)
            expect(mockIssueRefund).toHaveBeenCalledWith('pay_123', 750, 'requested_by_customer');

            // 3. Verify final Firestore update marks booking cancelled and refunded
            expect(mockBookingUpdate).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    status: 'cancelled',
                    payment: [
                        expect.objectContaining({
                            status: 'refunded',
                            refundedAmount: 750,
                        }),
                    ],
                })
            );

            // 4. Verify return response
            expect(result.success).toBe(true);
            expect(result.message).toContain('₱750.00 (50%)');
        });

        it('should successfully issue a 100% full refund for admin', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    ...defaultBookingData,
                    payment: [{ ...defaultCapturedPayment }],
                }),
            });
            mockIssueRefund.mockResolvedValueOnce({ id: 'ref_full' });

            const result = await handler({
                auth: superAdminAuth,
                data: {
                    bookingId: 'book_1',
                    userId: 'user_1',
                    refundPercentage: 'full',
                },
            });

            expect(mockIssueRefund).toHaveBeenCalledWith('pay_123', 1500, 'requested_by_customer');
            expect(result.success).toBe(true);
            expect(result.message).toContain('100%');
        });

        it('should successfully issue a standard 10% partial refund for admin (passing 10)', async () => {
            mockBookingGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    ...defaultBookingData,
                    payment: [{ ...defaultCapturedPayment }],
                }),
            });
            mockIssueRefund.mockResolvedValueOnce({ id: 'ref_partial' });

            const result = await handler({
                auth: adminAuth,
                data: {
                    bookingId: 'book_1',
                    userId: 'user_1',
                    refundPercentage: 10,
                },
            });

            expect(mockIssueRefund).toHaveBeenCalledWith('pay_123', 150, 'requested_by_customer');
            expect(result.success).toBe(true);
            expect(result.message).toContain('10%');
        });

        it('should rollback processing_refund lock to captured if PayMongo throws an error', async () => {
            const inFlightPayment = { ...defaultCapturedPayment, status: 'processing_refund' };
            mockBookingGet
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({
                        ...defaultBookingData,
                        payment: [{ ...defaultCapturedPayment }],
                    }),
                })
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({
                        ...defaultBookingData,
                        payment: [inFlightPayment],
                    }),
                });

            mockIssueRefund.mockRejectedValueOnce(new Error('Gateway connection timeout'));

            await expect(
                handler({
                    auth: adminAuth,
                    data: {
                        bookingId: 'book_1',
                        userId: 'user_1',
                        customAmount: 500,
                    },
                })
            ).rejects.toThrow(/Payment Gateway Error: Gateway connection timeout/);

            // Verify rollback: status reverted back to 'captured'
            expect(mockBookingUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    payment: [expect.objectContaining({ status: 'captured' })],
                })
            );
        });

        it('should format a clear message when PayMongo throws same_day_partial_refund_not_allowed', async () => {
            mockBookingGet
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({
                        ...defaultBookingData,
                        payment: [{ ...defaultCapturedPayment }],
                    }),
                })
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({
                        ...defaultBookingData,
                        payment: [{ ...defaultCapturedPayment, status: 'processing_refund' }],
                    }),
                });

            mockIssueRefund.mockRejectedValueOnce(
                new Error('PayMongo Refund Error: same_day_partial_refund_not_allowed')
            );

            await expect(
                handler({
                    auth: adminAuth,
                    data: {
                        bookingId: 'book_1',
                        userId: 'user_1',
                        customAmount: 300,
                    },
                })
            ).rejects.toThrow(
                /Partial refunds cannot be processed on the same day the payment was made/
            );
        });
    });
});
