const { describe, test, expect, beforeEach } = require('@jest/globals');
const {
    executeRescheduleApproval,
    reconcilePaymentsAndBalance,
} = require('../services/RescheduleManager');

/**
 * In-Memory Mock Firestore implementation for testing transactions and batch commits.
 */
class MockFirestore {
    constructor() {
        this.data = new Map(); // path -> document data
        this.batchOperations = [];
    }

    _normalizePath(collectionPath, docId) {
        return `${collectionPath}/${docId}`;
    }

    setDoc(path, data) {
        this.data.set(path, JSON.parse(JSON.stringify(data)));
    }

    getDoc(path) {
        return this.data.get(path);
    }

    collection(colName) {
        const self = this;
        return {
            doc(docId) {
                const id = docId || `auto_id_${Math.random().toString(36).substring(2, 9)}`;
                const docPath = `${colName}/${id}`;
                return {
                    id,
                    path: docPath,
                    async get() {
                        const exists = self.data.has(docPath);
                        return {
                            id,
                            exists,
                            data: () => (exists ? JSON.parse(JSON.stringify(self.data.get(docPath))) : undefined),
                        };
                    },
                    async set(data) {
                        self.data.set(docPath, JSON.parse(JSON.stringify(data)));
                    },
                    collection(subColName) {
                        return self.collection(`${docPath}/${subColName}`);
                    }
                };
            },
            where(field, op, val) {
                return {
                    async get() {
                        const getVal = (obj, path) => path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
                        const results = [];
                        for (const [key, docData] of self.data.entries()) {
                            if (key.startsWith(`${colName}/`) && getVal(docData, field) === val) {
                                results.push({
                                    id: key.split('/').pop(),
                                    ref: { path: key },
                                    data: () => docData,
                                });
                            }
                        }
                        return {
                            empty: results.length === 0,
                            docs: results,
                        };
                    }
                };
            }
        };
    }

    batch() {
        const self = this;
        const ops = [];
        return {
            set(docRef, data) {
                ops.push({ type: 'set', ref: docRef, data });
            },
            update(docRef, data) {
                ops.push({ type: 'update', ref: docRef, data });
            },
            async commit() {
                for (const op of ops) {
                    const path = op.ref.path;
                    if (op.type === 'set') {
                        self.data.set(path, JSON.parse(JSON.stringify(op.data)));
                    } else if (op.type === 'update') {
                        const existing = self.data.get(path) || {};
                        const updated = { ...existing };
                        for (const [k, v] of Object.entries(op.data)) {
                            // Check FieldValue increment
                            if (v && v.constructor && v.constructor.name === 'NumericIncrementTransform') {
                                updated[k] = (updated[k] || 0) + (v.operand || 0);
                            } else if (v && v.constructor && v.constructor.name === 'ArrayRemoveTransform') {
                                updated[k] = (updated[k] || []).filter(item => !v.elements.includes(item));
                            } else if (v && v.constructor && v.constructor.name === 'ArrayUnionTransform') {
                                const currentArr = updated[k] || [];
                                const toAdd = v.elements.filter(e => !currentArr.includes(e));
                                updated[k] = [...currentArr, ...toAdd];
                            } else {
                                updated[k] = v;
                            }
                        }
                        self.data.set(path, updated);
                    }
                }
            }
        };
    }
}

describe('RescheduleManager Tests', () => {
    describe('1. Financial Reconciliation Logic (reconcilePaymentsAndBalance)', () => {
        test('Case A: Unpaid booking (0 payments) retains remainingBalance = newPrice', () => {
            const result = reconcilePaymentsAndBalance([], 1500, 'for-reservation');
            expect(result.totalPaid).toBe(0);
            expect(result.remainingBalance).toBe(1500);
            expect(result.status).toBe('for-reservation');
            expect(result.paymentVerificationStatus).toBeNull();
            expect(result.overpayment).toBeNull();
        });

        test('Case B: Equal price payment -> remainingBalance = 0, status = paid, fully_paid', () => {
            const payments = [
                { status: 'captured', amount: 1500, refundedAmount: 0 }
            ];
            const result = reconcilePaymentsAndBalance(payments, 1500, 'paid');
            expect(result.totalPaid).toBe(1500);
            expect(result.remainingBalance).toBe(0);
            expect(result.status).toBe('paid');
            expect(result.paymentVerificationStatus).toBe('fully_paid');
            expect(result.overpayment).toBeNull();
        });

        test('Case C: New offer is more expensive -> status = downpayment with positive remainingBalance', () => {
            const payments = [
                { status: 'captured', amount: 1000, refundedAmount: 0 }
            ];
            const result = reconcilePaymentsAndBalance(payments, 2500, 'downpayment');
            expect(result.totalPaid).toBe(1000);
            expect(result.remainingBalance).toBe(1500);
            expect(result.status).toBe('downpayment');
            expect(result.paymentVerificationStatus).toBe('downpayment');
            expect(result.overpayment).toBeNull();
        });

        test('Case D: New offer is cheaper -> status = paid, remainingBalance = 0, overpayment populated', () => {
            const payments = [
                { status: 'captured', amount: 2000, refundedAmount: 0 }
            ];
            const result = reconcilePaymentsAndBalance(payments, 1200, 'paid');
            expect(result.totalPaid).toBe(2000);
            expect(result.remainingBalance).toBe(0);
            expect(result.status).toBe('paid');
            expect(result.paymentVerificationStatus).toBe('fully_paid');
            expect(result.overpayment).toEqual({
                excessAmount: 800,
                originalVerifiedAmount: 2000,
                hikeAmountCaptured: 1200,
                status: 'awaiting_hiker_wallet',
            });
        });

        test('Ignores pending or failed payments when calculating paid amount', () => {
            const payments = [
                { status: 'captured', amount: 1000, refundedAmount: 0 },
                { status: 'pending', amount: 500, refundedAmount: 0 },
                { status: 'failed', amount: 500, refundedAmount: 0 },
            ];
            const result = reconcilePaymentsAndBalance(payments, 1000, 'paid');
            expect(result.totalPaid).toBe(1000);
            expect(result.remainingBalance).toBe(0);
            expect(result.status).toBe('paid');
        });
    });

    describe('2. End-to-End Approval Workflow (executeRescheduleApproval)', () => {
        let db;
        const businessId = 'biz_123';
        const userId = 'user_456';
        const oldBookingId = 'booking_old';
        const oldOfferId = 'offer_old';
        const newOfferId = 'offer_new';

        const adminCaller = {
            uid: 'admin_789',
            token: {
                role: 'admin',
                businessId: businessId,
            }
        };

        beforeEach(() => {
            db = new MockFirestore();

            // Setup Old Offer
            db.setDoc(`businesses/${businessId}/offers/${oldOfferId}`, {
                id: oldOfferId,
                date: new Date('2026-11-01'),
                price: 1500,
                maxPax: 15,
                minPax: 5,
                reservedPax: 5,
                business: { id: businessId, name: 'Peak Explorers' },
                trail: { id: 'trail_1', name: 'Mt. Pulag' },
                status: 'active',
            });

            // Setup New Offer
            db.setDoc(`businesses/${businessId}/offers/${newOfferId}`, {
                id: newOfferId,
                date: new Date('2026-11-15'),
                price: 1800,
                maxPax: 15,
                minPax: 5,
                reservedPax: 3,
                business: { id: businessId, name: 'Peak Explorers' },
                trail: { id: 'trail_2', name: 'Mt. Ulap' },
                status: 'active',
            });

            // Setup Old Booking
            db.setDoc(`users/${userId}/bookings/${oldBookingId}`, {
                id: oldBookingId,
                status: 'paid',
                offer: { id: oldOfferId, date: new Date('2026-11-01'), price: 1500 },
                trail: { id: 'trail_1', name: 'Mt. Pulag' },
                business: { id: businessId, name: 'Peak Explorers' },
                user: { id: userId, username: 'hiker1', firstname: 'John', lastname: 'Doe', email: 'john@example.com' },
                emergencyContact: { name: 'Jane Doe', contactNumber: '09123456789' },
                documents: [{ name: 'Valid ID', file: 'id.jpg', valid: 'approved' }],
                payment: [{ id: 'pay_1', status: 'captured', amount: 1500 }],
                remainingBalance: 0,
            });

            // Setup Old Group
            db.setDoc(`groups/${oldOfferId}`, {
                id: oldOfferId,
                participantsIds: [userId, 'other_user'],
                members: [
                    { id: userId, username: 'hiker1', bookingId: oldBookingId },
                    { id: 'other_user', username: 'hiker2', bookingId: 'booking_other' }
                ],
            });

            // Setup New Group
            db.setDoc(`groups/${newOfferId}`, {
                id: newOfferId,
                participantsIds: ['existing_user'],
                members: [
                    { id: 'existing_user', username: 'existing', bookingId: 'b_existing' }
                ],
            });
        });

        test('Successfully approves reschedule: updates offers, bookings, payments, and groups', async () => {
            const notifications = [];
            const mockNotify = async (db, uid, payload) => {
                notifications.push({ uid, payload });
            };

            const result = await executeRescheduleApproval(
                db,
                adminCaller,
                {
                    bookingId: oldBookingId,
                    userId,
                    newOfferId,
                    adminNote: 'Customer requested change of date.',
                },
                { notifyFn: mockNotify }
            );

            expect(result.success).toBe(true);
            expect(result.oldBookingId).toBe(oldBookingId);
            expect(result.newBookingId).toBeDefined();

            // 1. Check Offers: old reservedPax decreased, new reservedPax increased
            const updatedOldOffer = db.getDoc(`businesses/${businessId}/offers/${oldOfferId}`);
            const updatedNewOffer = db.getDoc(`businesses/${businessId}/offers/${newOfferId}`);
            // Note: with MockFirestore increment:
            expect(updatedOldOffer.reservedPax).toBe(4); // was 5
            expect(updatedNewOffer.reservedPax).toBe(4); // was 3 + 1

            // 2. Check Old Booking: marked as rescheduled with link to new booking
            const updatedOldBooking = db.getDoc(`users/${userId}/bookings/${oldBookingId}`);
            expect(updatedOldBooking.status).toBe('rescheduled');
            expect(updatedOldBooking.rescheduledToBookingId).toBe(result.newBookingId);
            expect(updatedOldBooking.rescheduledToOfferId).toBe(newOfferId);

            // 3. Check New Booking: created with new offer and trail, and downpayment calculated
            const newBooking = db.getDoc(`users/${userId}/bookings/${result.newBookingId}`);
            expect(newBooking).toBeDefined();
            expect(newBooking.offer.id).toBe(newOfferId);
            expect(newBooking.trail.name).toBe('Mt. Ulap');
            expect(newBooking.status).toBe('downpayment'); // Old paid 1500, new costs 1800 -> 300 remaining
            expect(newBooking.remainingBalance).toBe(300);
            expect(newBooking.paymentVerificationStatus).toBe('downpayment');
            expect(newBooking.rescheduledFromBookingId).toBe(oldBookingId);
            expect(newBooking.user.username).toBe('hiker1');
            expect(newBooking.documents.length).toBe(1);

            // 4. Check Groups: removed from old group, added to new group
            const oldGroup = db.getDoc(`groups/${oldOfferId}`);
            expect(oldGroup.participantsIds).not.toContain(userId);
            expect(oldGroup.members.find(m => m.id === userId)).toBeUndefined();

            const newGroup = db.getDoc(`groups/${newOfferId}`);
            expect(newGroup.participantsIds).toContain(userId);
            const newMember = newGroup.members.find(m => m.id === userId);
            expect(newMember).toBeDefined();
            expect(newMember.bookingId).toBe(result.newBookingId);

            // 5. Notification was sent
            expect(notifications.length).toBe(1);
            expect(notifications[0].uid).toBe(userId);
            expect(notifications[0].payload.type).toBe('reschedule_approved');
        });

        test('Self-heals and creates new group if target offer group does not exist', async () => {
            // Delete new group from db
            db.data.delete(`groups/${newOfferId}`);

            const result = await executeRescheduleApproval(
                db,
                adminCaller,
                { bookingId: oldBookingId, userId, newOfferId }
            );

            expect(result.success).toBe(true);
            const healedGroup = db.getDoc(`groups/${newOfferId}`);
            expect(healedGroup).toBeDefined();
            expect(healedGroup.id).toBe(newOfferId);
            expect(healedGroup.participantsIds).toContain(userId);
            expect(healedGroup.members[0].id).toBe(userId);
            expect(healedGroup.members[0].bookingId).toBe(result.newBookingId);
        });

        test('Rejects if target offer is full (reservedPax >= maxPax)', async () => {
            // Set new offer to max capacity
            db.setDoc(`businesses/${businessId}/offers/${newOfferId}`, {
                id: newOfferId,
                maxPax: 10,
                reservedPax: 10,
                status: 'active',
            });

            await expect(
                executeRescheduleApproval(db, adminCaller, { bookingId: oldBookingId, userId, newOfferId })
            ).rejects.toThrow('Target offer is already at maximum capacity.');
        });

        test('Rejects if booking has already been rescheduled', async () => {
            db.setDoc(`users/${userId}/bookings/${oldBookingId}`, {
                id: oldBookingId,
                status: 'rescheduled',
                offer: { id: oldOfferId },
                business: { id: businessId },
            });

            await expect(
                executeRescheduleApproval(db, adminCaller, { bookingId: oldBookingId, userId, newOfferId })
            ).rejects.toThrow('This booking has already been rescheduled.');
        });

        test('Rejects if caller is not an authorized admin for the business', async () => {
            const unauthorizedCaller = {
                uid: 'hacker',
                token: {
                    role: 'admin',
                    businessId: 'different_business_id',
                }
            };

            await expect(
                executeRescheduleApproval(db, unauthorizedCaller, { bookingId: oldBookingId, userId, newOfferId })
            ).rejects.toThrow('Only administrators for this business can approve reschedule requests.');
        });

        test('Rejects if user already has an active booking on the target new offer', async () => {
            // Add an existing active booking for the user on newOfferId
            db.setDoc(`users/${userId}/bookings/existing_active_booking`, {
                id: 'existing_active_booking',
                status: 'paid',
                offer: { id: newOfferId },
                business: { id: businessId },
            });

            await expect(
                executeRescheduleApproval(db, adminCaller, { bookingId: oldBookingId, userId, newOfferId })
            ).rejects.toThrow('User already has an active booking for the target offer.');
        });

        test('Allows reschedule if user prior booking on the target offer was cancelled', async () => {
            // Add a cancelled booking for the user on newOfferId
            db.setDoc(`users/${userId}/bookings/existing_cancelled_booking`, {
                id: 'existing_cancelled_booking',
                status: 'cancelled',
                offer: { id: newOfferId },
                business: { id: businessId },
            });

            const result = await executeRescheduleApproval(db, adminCaller, {
                bookingId: oldBookingId,
                userId,
                newOfferId,
            });

            expect(result.success).toBe(true);
        });
    });
});

