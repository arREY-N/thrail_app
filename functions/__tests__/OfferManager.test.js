const { describe, test, expect, jest, beforeEach } = require('@jest/globals');
const { DateTime } = require('luxon');
const {
    parseToManilaDateTime,
    validateOfferUpdatePhase1,
    checkOfferBlockersPhase2,
    executeOfferUpdateTransactionPhase3,
    dispatchOfferUpdateNotificationsPhase4,
} = require('../services/OfferManager');

describe('OfferManager - Phase 1 Validation', () => {
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('parseToManilaDateTime parses Firestore timestamp, Date, and string to Asia/Manila zone', () => {
        const jsDate = new Date('2026-11-20T10:00:00Z');
        const firestoreTimestamp = { toDate: () => jsDate };

        const dt1 = parseToManilaDateTime(firestoreTimestamp);
        expect(dt1.zoneName).toBe('Asia/Manila');

        const dt2 = parseToManilaDateTime('2026-11-20T18:00:00');
        expect(dt2.zoneName).toBe('Asia/Manila');

        const dt3 = parseToManilaDateTime(null);
        expect(dt3).toBeNull();
    });

    test('throws unauthenticated if caller is missing or has no uid', async () => {
        await expect(validateOfferUpdatePhase1(mockDb, null, { offerId: 'off_1' }))
            .rejects.toThrow('Authentication required.');

        await expect(validateOfferUpdatePhase1(mockDb, {}, { offerId: 'off_1' }))
            .rejects.toThrow('Authentication required.');
    });

    test('throws invalid-argument if offerId is missing', async () => {
        const caller = { uid: 'user_123' };
        await expect(validateOfferUpdatePhase1(mockDb, caller, {}))
            .rejects.toThrow('offerId is required.');
    });

    test('throws not-found if offer does not exist', async () => {
        const caller = { uid: 'admin_1' };
        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockReturnValue({
                        doc: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValue({ exists: false }),
                        }),
                    }),
                }),
            }),
        };

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, { offerId: 'off_999', businessId: 'biz_1' })
        ).rejects.toThrow("Offer with ID 'off_999' not found.");
    });

    test('throws failed-precondition if offer is not active', async () => {
        const caller = { uid: 'admin_1' };
        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'cancelled',
                business: { id: 'biz_1' },
                date: new Date('2026-12-01T00:00:00Z'),
                price: 1500,
            }),
            ref: {},
        };
        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockReturnValue({
                        doc: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValue(mockOfferSnap),
                        }),
                    }),
                }),
            }),
        };

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, { offerId: 'off_1', businessId: 'biz_1' })
        ).rejects.toThrow("Cannot update offer because its current status is 'cancelled'.");
    });

    test('throws permission-denied if caller is not an admin/owner of the business', async () => {
        const caller = { uid: 'stranger_uid', token: { role: 'user' } };
        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'active',
                business: { id: 'biz_1' },
                date: new Date('2026-12-01T00:00:00Z'),
                price: 1500,
            }),
            ref: {},
        };

        const mockAdminQuerySnap = { empty: true, docs: [] };

        mockDb = {
            collection: jest.fn().mockImplementation((col) => {
                if (col === 'businesses') {
                    return {
                        doc: jest.fn().mockReturnValue({
                            collection: jest.fn().mockImplementation((subCol) => {
                                if (subCol === 'offers') {
                                    return {
                                        doc: jest.fn().mockReturnValue({
                                            get: jest.fn().mockResolvedValue(mockOfferSnap),
                                        }),
                                    };
                                }
                                if (subCol === 'admins') {
                                    return {
                                        where: jest.fn().mockReturnValue({
                                            limit: jest.fn().mockReturnValue({
                                                get: jest.fn().mockResolvedValue(mockAdminQuerySnap),
                                            }),
                                        }),
                                    };
                                }
                            }),
                        }),
                    };
                }
            }),
        };

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, { offerId: 'off_1', businessId: 'biz_1' })
        ).rejects.toThrow('You are not an authorized admin or owner of this business.');
    });

    test('authorizes owner matching doc.data.id === callerUid', async () => {
        const caller = { uid: 'owner_uid', token: { role: 'business' } };
        const futureDate = DateTime.now().setZone('Asia/Manila').plus({ days: 20 }).toJSDate();
        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'active',
                business: { id: 'biz_1' },
                date: futureDate,
                price: 1500,
            }),
            ref: {},
        };

        // Document id is 'owner', but doc.data().id matches callerUid
        const mockAdminQuerySnap = {
            empty: false,
            docs: [{ id: 'owner', data: () => ({ id: 'owner_uid', role: 'owner' }) }],
        };

        mockDb = {
            collection: jest.fn().mockImplementation((col) => {
                if (col === 'businesses') {
                    return {
                        doc: jest.fn().mockReturnValue({
                            collection: jest.fn().mockImplementation((subCol) => {
                                if (subCol === 'offers') {
                                    return {
                                        doc: jest.fn().mockReturnValue({
                                            get: jest.fn().mockResolvedValue(mockOfferSnap),
                                        }),
                                    };
                                }
                                if (subCol === 'admins') {
                                    return {
                                        where: jest.fn().mockReturnValue({
                                            limit: jest.fn().mockReturnValue({
                                                get: jest.fn().mockResolvedValue(mockAdminQuerySnap),
                                            }),
                                        }),
                                    };
                                }
                            }),
                        }),
                    };
                }
            }),
        };

        const result = await validateOfferUpdatePhase1(mockDb, caller, {
            offerId: 'off_1',
            businessId: 'biz_1',
            updates: { description: 'Updated itinerary' },
        });

        expect(result.businessId).toBe('biz_1');
        expect(result.isDateChanged).toBe(false);
        expect(result.isPriceChanged).toBe(false);
    });

    test('throws failed-precondition if modifying date less than 10 days before current hike', async () => {
        const caller = { uid: 'admin_1', token: { role: 'admin' } };
        // Hike is only 5 days away from now
        const hikeIn5Days = DateTime.now().setZone('Asia/Manila').plus({ days: 5 }).toJSDate();
        const newDateIn20Days = DateTime.now().setZone('Asia/Manila').plus({ days: 20 }).toISO();

        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'active',
                business: { id: 'biz_1' },
                date: hikeIn5Days,
                price: 1500,
            }),
            ref: {},
        };

        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockImplementation((subCol) => {
                        if (subCol === 'offers') {
                            return {
                                doc: jest.fn().mockReturnValue({
                                    get: jest.fn().mockResolvedValue(mockOfferSnap),
                                }),
                            };
                        }
                        if (subCol === 'admins') {
                            return {
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        get: jest.fn().mockResolvedValue({ empty: false }),
                                    }),
                                }),
                            };
                        }
                    }),
                }),
            }),
        };

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, {
                offerId: 'off_1',
                businessId: 'biz_1',
                updates: { date: newDateIn20Days },
            })
        ).rejects.toThrow('Hike date can only be modified at least 10 days before the scheduled hike.');
    });

    test('throws invalid-argument if new proposed date is less than 7 days from today', async () => {
        const caller = { uid: 'admin_1', token: { role: 'admin' } };
        // Current hike is 15 days away (passes 10-day rule)
        const currentHikeIn15Days = DateTime.now().setZone('Asia/Manila').plus({ days: 15 }).toJSDate();
        // New proposed date is only 3 days away (fails 7-day rule)
        const newDateIn3Days = DateTime.now().setZone('Asia/Manila').plus({ days: 3 }).toISO();

        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'active',
                business: { id: 'biz_1' },
                date: currentHikeIn15Days,
                price: 1500,
            }),
            ref: {},
        };

        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockImplementation((subCol) => {
                        if (subCol === 'offers') {
                            return {
                                doc: jest.fn().mockReturnValue({
                                    get: jest.fn().mockResolvedValue(mockOfferSnap),
                                }),
                            };
                        }
                        if (subCol === 'admins') {
                            return {
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        get: jest.fn().mockResolvedValue({ empty: false }),
                                    }),
                                }),
                            };
                        }
                    }),
                }),
            }),
        };

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, {
                offerId: 'off_1',
                businessId: 'biz_1',
                updates: { date: newDateIn3Days },
            })
        ).rejects.toThrow('New hike date must be scheduled at least 7 days from today.');
    });

    test('throws invalid-argument if new price is zero, negative, or not a number', async () => {
        const caller = { uid: 'admin_1', token: { role: 'admin' } };
        const futureDate = DateTime.now().setZone('Asia/Manila').plus({ days: 20 }).toJSDate();

        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'active',
                business: { id: 'biz_1' },
                date: futureDate,
                price: 1500,
            }),
            ref: {},
        };

        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockImplementation((subCol) => {
                        if (subCol === 'offers') {
                            return {
                                doc: jest.fn().mockReturnValue({
                                    get: jest.fn().mockResolvedValue(mockOfferSnap),
                                }),
                            };
                        }
                        if (subCol === 'admins') {
                            return {
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        get: jest.fn().mockResolvedValue({ empty: false }),
                                    }),
                                }),
                            };
                        }
                    }),
                }),
            }),
        };

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, {
                offerId: 'off_1',
                businessId: 'biz_1',
                updates: { price: -500 },
            })
        ).rejects.toThrow('Price must be a valid positive number greater than 0.');

        await expect(
            validateOfferUpdatePhase1(mockDb, caller, {
                offerId: 'off_1',
                businessId: 'biz_1',
                updates: { price: 0 },
            })
        ).rejects.toThrow('Price must be a valid positive number greater than 0.');
    });

    test('validates and normalizes valid price and date updates', async () => {
        const caller = { uid: 'admin_1', token: { role: 'admin' } };
        const currentHikeIn15Days = DateTime.now().setZone('Asia/Manila').plus({ days: 15 }).toJSDate();
        const newDateIn20Days = DateTime.now().setZone('Asia/Manila').plus({ days: 20 }).toISO();

        const mockOfferSnap = {
            exists: true,
            data: () => ({
                status: 'active',
                business: { id: 'biz_1' },
                date: currentHikeIn15Days,
                price: 1500,
            }),
            ref: {},
        };

        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockImplementation((subCol) => {
                        if (subCol === 'offers') {
                            return {
                                doc: jest.fn().mockReturnValue({
                                    get: jest.fn().mockResolvedValue(mockOfferSnap),
                                }),
                            };
                        }
                        if (subCol === 'admins') {
                            return {
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        get: jest.fn().mockResolvedValue({ empty: false }),
                                    }),
                                }),
                            };
                        }
                    }),
                }),
            }),
        };

        const result = await validateOfferUpdatePhase1(mockDb, caller, {
            offerId: 'off_1',
            businessId: 'biz_1',
            updates: {
                price: 1750.555,
                date: newDateIn20Days,
            },
        });

        expect(result.isPriceChanged).toBe(true);
        expect(result.normalizedPrice).toBe(1750.56);
        expect(result.isDateChanged).toBe(true);
        expect(result.proposedDate).toBeDefined();
    });
});

describe('OfferManager - Phase 2 Blocker Checks', () => {
    let mockDb;

    const basePhase1Context = {
        offerId: 'off_1',
        businessId: 'biz_1',
        isPriceChanged: true,
        normalizedPrice: 2000,
        isDateChanged: false,
    };

    const createMockDb = (bookings) => ({
        collectionGroup: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                    docs: bookings.map((b, idx) => ({
                        id: b.id || `booking_${idx}`,
                        ref: { id: b.id || `booking_${idx}` },
                        data: () => b,
                    })),
                }),
            }),
        }),
    });

    test('skips all blocker checks if price is not changed', async () => {
        const bookings = [
            { id: 'b1', status: 'for-cancellation' },
            { id: 'b2', status: 'for-reschedule' },
            { id: 'b3', paymentVerificationStatus: 'pending_verification', status: 'for-payment' },
            { id: 'b4', status: 'completed', overpayment: { status: 'awaiting_hiker_wallet' } },
        ];
        mockDb = createMockDb(bookings);

        const contextWithoutPriceChange = {
            ...basePhase1Context,
            isPriceChanged: false,
        };

        const result = await checkOfferBlockersPhase2(mockDb, contextWithoutPriceChange);
        expect(result.activeBookings.length).toBe(4);
    });

    test('throws failed-precondition if there are for-cancellation bookings', async () => {
        const bookings = [
            { id: 'b1', status: 'paid' },
            { id: 'b2', status: 'for-cancellation' },
        ];
        mockDb = createMockDb(bookings);

        await expect(checkOfferBlockersPhase2(mockDb, basePhase1Context))
            .rejects.toThrow('Cannot change price: There are pending cancellation requests awaiting resolution.');
    });

    test('throws failed-precondition if there are for-reschedule bookings', async () => {
        const bookings = [
            { id: 'b1', status: 'paid' },
            { id: 'b2', status: 'for-reschedule' },
        ];
        mockDb = createMockDb(bookings);

        await expect(checkOfferBlockersPhase2(mockDb, basePhase1Context))
            .rejects.toThrow('Cannot change price: There are pending reschedule requests awaiting resolution.');
    });

    test('throws failed-precondition if there are unverified manual payment receipts', async () => {
        const bookings = [
            { id: 'b1', status: 'for-payment', paymentVerificationStatus: 'pending_verification' },
        ];
        mockDb = createMockDb(bookings);

        await expect(checkOfferBlockersPhase2(mockDb, basePhase1Context))
            .rejects.toThrow('Cannot change price: There are unverified manual payment receipts awaiting admin review.');
    });

    test('throws failed-precondition with "Settle overpayments first." if there are unsettled overpayments', async () => {
        const bookings = [
            {
                id: 'b1',
                status: 'completed',
                overpayment: {
                    status: 'awaiting_hiker_wallet',
                    excessAmount: 300,
                },
            },
        ];
        mockDb = createMockDb(bookings);

        await expect(checkOfferBlockersPhase2(mockDb, basePhase1Context))
            .rejects.toThrow('Settle overpayments first.');
    });

    test('allows price change if overpayment is already completed/settled', async () => {
        const bookings = [
            {
                id: 'b1',
                status: 'completed',
                overpayment: {
                    status: 'completed', // Settled!
                    excessAmount: 300,
                },
            },
            {
                id: 'b2',
                status: 'paid',
            },
        ];
        mockDb = createMockDb(bookings);

        const result = await checkOfferBlockersPhase2(mockDb, basePhase1Context);
        expect(result.activeBookings.length).toBe(2);
    });

    test('ignores inactive bookings (cancelled, refunded, expired, rejected)', async () => {
        const bookings = [
            { id: 'b1', status: 'cancelled', paymentVerificationStatus: 'pending_verification' },
            { id: 'b2', status: 'refunded', overpayment: { status: 'awaiting_hiker_wallet' } },
            { id: 'b3', status: 'paid' },
        ];
        mockDb = createMockDb(bookings);

        const result = await checkOfferBlockersPhase2(mockDb, basePhase1Context);
        expect(result.activeBookings.length).toBe(1);
        expect(result.activeBookings[0].id).toBe('b3');
    });
});

describe('OfferManager - Phase 3 Atomic Transaction & State Transitions', () => {
    let mockTransaction;
    let mockDb;

    beforeEach(() => {
        mockTransaction = {
            get: jest.fn(),
            update: jest.fn(),
        };
        mockDb = {
            runTransaction: jest.fn().mockImplementation(async (callback) => {
                return await callback(mockTransaction);
            }),
        };
    });

    test('price increase: downgrades paid/completed booking to downpayment with new balance', async () => {
        const offerRef = { id: 'off_1' };
        const bookingRef = {
            id: 'b1',
            parent: { parent: { id: 'user_123' } },
        };

        mockTransaction.get.mockImplementation(async (ref) => {
            if (ref === offerRef) {
                return {
                    exists: true,
                    data: () => ({ id: 'off_1', price: 1000 }),
                };
            }
            if (ref === bookingRef) {
                return {
                    id: 'b1',
                    exists: true,
                    ref: bookingRef,
                    data: () => ({
                        id: 'b1',
                        status: 'paid',
                        offer: { id: 'off_1', price: 1000 },
                        payment: [{ status: 'captured', amount: 1000 }],
                        remainingBalance: 0,
                    }),
                };
            }
        });

        const phase2Context = {
            offerRef,
            activeBookings: [{ id: 'b1', ref: bookingRef, data: { status: 'paid' } }],
            isPriceChanged: true,
            normalizedPrice: 1500, // +500 increase
            isDateChanged: false,
            offerData: { price: 1000 },
            updates: { price: 1500 },
        };

        const result = await executeOfferUpdateTransactionPhase3(mockDb, phase2Context);

        expect(result.updatedBookingsCount).toBe(1);
        expect(result.affectedUsers.length).toBe(1);
        expect(result.affectedUsers[0].userChangeType).toBe('price_increased');
        expect(result.affectedUsers[0].remainingBalance).toBe(500);
        expect(result.affectedUsers[0].status).toBe('downpayment');

        // Check transaction.update calls
        expect(mockTransaction.update).toHaveBeenCalledWith(
            bookingRef,
            expect.objectContaining({
                'offer.price': 1500,
                status: 'downpayment',
                paymentVerificationStatus: 'downpayment',
                remainingBalance: 500,
            })
        );
        expect(mockTransaction.update).toHaveBeenCalledWith(
            offerRef,
            expect.objectContaining({
                price: 1500,
            })
        );
    });

    test('price decrease: initializes overpayment when verifiedPaid exceeds new price', async () => {
        const offerRef = { id: 'off_1' };
        const bookingRef = {
            id: 'b1',
            parent: { parent: { id: 'user_456' } },
        };

        mockTransaction.get.mockImplementation(async (ref) => {
            if (ref === offerRef) {
                return {
                    exists: true,
                    data: () => ({ id: 'off_1', price: 2000 }),
                };
            }
            if (ref === bookingRef) {
                return {
                    id: 'b1',
                    exists: true,
                    ref: bookingRef,
                    data: () => ({
                        id: 'b1',
                        status: 'completed',
                        offer: { id: 'off_1', price: 2000 },
                        payment: [{ status: 'captured', amount: 2000 }],
                        remainingBalance: 0,
                    }),
                };
            }
        });

        const phase2Context = {
            offerRef,
            activeBookings: [{ id: 'b1', ref: bookingRef, data: { status: 'completed' } }],
            isPriceChanged: true,
            normalizedPrice: 1600, // 400 excess
            isDateChanged: false,
            offerData: { price: 2000 },
            updates: { price: 1600 },
        };

        const result = await executeOfferUpdateTransactionPhase3(mockDb, phase2Context);

        expect(result.affectedUsers[0].userChangeType).toBe('price_decreased_overpayment');
        expect(result.affectedUsers[0].excessAmount).toBe(400);

        expect(mockTransaction.update).toHaveBeenCalledWith(
            bookingRef,
            expect.objectContaining({
                'offer.price': 1600,
                remainingBalance: 0,
                overpayment: expect.objectContaining({
                    excessAmount: 400,
                    originalVerifiedAmount: 2000,
                    hikeAmountCaptured: 1600,
                    status: 'awaiting_hiker_wallet',
                }),
            })
        );
    });

    test('price decrease: promotes downpayment to paid when deposit covers new price', async () => {
        const offerRef = { id: 'off_1' };
        const bookingRef = {
            id: 'b1',
            parent: { parent: { id: 'user_789' } },
        };

        mockTransaction.get.mockImplementation(async (ref) => {
            if (ref === offerRef) {
                return { exists: true, data: () => ({ id: 'off_1', price: 2500 }) };
            }
            if (ref === bookingRef) {
                return {
                    id: 'b1',
                    exists: true,
                    ref: bookingRef,
                    data: () => ({
                        id: 'b1',
                        status: 'downpayment',
                        offer: { id: 'off_1', price: 2500 },
                        payment: [{ status: 'captured', amount: 1200 }],
                        remainingBalance: 1300,
                    }),
                };
            }
        });

        const phase2Context = {
            offerRef,
            activeBookings: [{ id: 'b1', ref: bookingRef, data: { status: 'downpayment' } }],
            isPriceChanged: true,
            normalizedPrice: 1200, // Exactly equals downpayment!
            isDateChanged: false,
            offerData: { price: 2500 },
            updates: { price: 1200 },
        };

        const result = await executeOfferUpdateTransactionPhase3(mockDb, phase2Context);

        expect(result.affectedUsers[0].userChangeType).toBe('price_decreased_fully_paid');

        expect(mockTransaction.update).toHaveBeenCalledWith(
            bookingRef,
            expect.objectContaining({
                'offer.price': 1200,
                status: 'paid',
                paymentVerificationStatus: 'fully_paid',
                remainingBalance: 0,
            })
        );
    });

    test('price decrease: downpayment deposit still less than new price reduces remaining balance', async () => {
        const offerRef = { id: 'off_1' };
        const bookingRef = {
            id: 'b1',
            parent: { parent: { id: 'user_101' } },
        };

        mockTransaction.get.mockImplementation(async (ref) => {
            if (ref === offerRef) {
                return { exists: true, data: () => ({ id: 'off_1', price: 3000 }) };
            }
            if (ref === bookingRef) {
                return {
                    id: 'b1',
                    exists: true,
                    ref: bookingRef,
                    data: () => ({
                        id: 'b1',
                        status: 'downpayment',
                        offer: { id: 'off_1', price: 3000 },
                        payment: [{ status: 'captured', amount: 1000 }],
                        remainingBalance: 2000,
                    }),
                };
            }
        });

        const phase2Context = {
            offerRef,
            activeBookings: [{ id: 'b1', ref: bookingRef, data: { status: 'downpayment' } }],
            isPriceChanged: true,
            normalizedPrice: 2200, // Down from 3000 to 2200, paid 1000 => owes 1200
            isDateChanged: false,
            offerData: { price: 3000 },
            updates: { price: 2200 },
        };

        const result = await executeOfferUpdateTransactionPhase3(mockDb, phase2Context);

        expect(result.affectedUsers[0].userChangeType).toBe('price_decreased_balance_reduced');
        expect(result.affectedUsers[0].remainingBalance).toBe(1200);

        expect(mockTransaction.update).toHaveBeenCalledWith(
            bookingRef,
            expect.objectContaining({
                'offer.price': 2200,
                remainingBalance: 1200,
            })
        );
    });
});

describe('OfferManager - Phase 4 Notifications', () => {
    let mockDb;
    let mockUserNotifDoc;
    let mockUserDoc;

    beforeEach(() => {
        mockUserNotifDoc = {
            get: jest.fn().mockResolvedValue({ exists: false }),
            set: jest.fn().mockResolvedValue(),
        };

        mockUserDoc = {
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ fcmTokens: ['token_123'] }),
            }),
        };

        mockDb = {
            collection: jest.fn().mockImplementation((col) => {
                if (col === 'users') {
                    return {
                        doc: jest.fn().mockImplementation((userId) => ({
                            get: mockUserDoc.get,
                            collection: jest.fn().mockImplementation((subCol) => {
                                if (subCol === 'notifications') {
                                    return {
                                        doc: jest.fn().mockReturnValue(mockUserNotifDoc),
                                    };
                                }
                            }),
                        })),
                    };
                }
            }),
        };
    });

    test('sends balance notification when price increased', async () => {
        const phase3Result = {
            offerId: 'off_1',
            normalizedPrice: 1500,
            affectedUsers: [
                {
                    userId: 'user_1',
                    bookingId: 'book_1',
                    trailName: 'Mt. Pulag',
                    userChangeType: 'price_increased',
                    remainingBalance: 500,
                },
            ],
        };

        const result = await dispatchOfferUpdateNotificationsPhase4(mockDb, phase3Result);

        expect(result.notifiedCount).toBe(1);
        expect(mockUserNotifDoc.set).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Offer Price Updated - Mt. Pulag',
                message: expect.stringContaining('remaining balance of ₱500.00'),
                metadata: expect.objectContaining({
                    type: 'offer_price_increased',
                    remainingBalance: 500,
                    newPrice: 1500,
                }),
            })
        );
    });

    test('sends wallet request notification when overpayment created', async () => {
        const phase3Result = {
            offerId: 'off_1',
            normalizedPrice: 1200,
            affectedUsers: [
                {
                    userId: 'user_2',
                    bookingId: 'book_2',
                    trailName: 'Mt. Batulao',
                    userChangeType: 'price_decreased_overpayment',
                    excessAmount: 300,
                },
            ],
        };

        const result = await dispatchOfferUpdateNotificationsPhase4(mockDb, phase3Result);

        expect(result.notifiedCount).toBe(1);
        expect(mockUserNotifDoc.set).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Excess Refund Available - Mt. Batulao',
                message: expect.stringContaining('excess refund of ₱300.00'),
                metadata: expect.objectContaining({
                    type: 'overpayment_wallet_requested',
                    excessAmount: 300,
                }),
            })
        );
    });

    test('sends rescheduled notification with formatted date', async () => {
        const proposedDate = DateTime.fromISO('2026-12-15T08:00:00', { zone: 'Asia/Manila' });
        const phase3Result = {
            offerId: 'off_1',
            proposedDate,
            affectedUsers: [
                {
                    userId: 'user_3',
                    bookingId: 'book_3',
                    trailName: 'Mt. Daraitan',
                    userChangeType: 'date_rescheduled',
                },
            ],
        };

        const result = await dispatchOfferUpdateNotificationsPhase4(mockDb, phase3Result);

        expect(result.notifiedCount).toBe(1);
        expect(mockUserNotifDoc.set).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Hike Date Rescheduled - Mt. Daraitan',
                message: expect.stringContaining('Dec 15, 2026'),
            })
        );
    });

    test('skips duplicate notification if docId already exists', async () => {
        mockUserNotifDoc.get.mockResolvedValueOnce({ exists: true }); // Already exists!

        const phase3Result = {
            offerId: 'off_1',
            normalizedPrice: 1500,
            affectedUsers: [
                {
                    userId: 'user_1',
                    bookingId: 'book_1',
                    trailName: 'Mt. Pulag',
                    userChangeType: 'price_increased',
                    remainingBalance: 500,
                },
            ],
        };

        const result = await dispatchOfferUpdateNotificationsPhase4(mockDb, phase3Result);

        expect(result.notifiedCount).toBe(1);
        expect(mockUserNotifDoc.set).not.toHaveBeenCalled();
    });
});




