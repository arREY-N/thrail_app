const admin = require('firebase-admin');
const { https } = require('firebase-functions/v2');
const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');

/**
 * Sends in-app and push notifications to a hiker.
 * Self-contained helper to avoid circular dependencies with index.js.
 */
async function notifyUser(db, userId, { title, body, inAppTitle, inAppMessage, type = 'booking_update', metadata = {}, data = {}, docId = null }) {
    try {
        if (!userId) return;

        if (docId) {
            const checkDoc = await db.collection('users').doc(userId).collection('notifications').doc(docId).get();
            if (checkDoc.exists) {
                console.log(`[notifyUser] Notification ${docId} already sent to user ${userId}. Skipping duplicate.`);
                return;
            }
        }

        // 1. In-app notification
        const notifRef = docId
            ? db.collection('users').doc(userId).collection('notifications').doc(docId)
            : db.collection('users').doc(userId).collection('notifications').doc();

        await notifRef.set({
            title: inAppTitle || title,
            message: inAppMessage || body,
            createdAt: FieldValue.serverTimestamp(),
            read: false,
            metadata: {
                type,
                ...metadata,
            }
        });

        // 2. Fetch user's tokens for push notification
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;

        const tokens = userDoc.data()?.fcmTokens || [];
        const uniqueTokens = [...new Set(tokens.map(t => typeof t === 'string' ? t : t?.token))].filter(Boolean);

        if (uniqueTokens.length > 0 && admin.messaging) {
            await admin.messaging().sendEachForMulticast({
                tokens: uniqueTokens,
                notification: {
                    title,
                    body,
                },
                data: {
                    title: String(title || ''),
                    body: String(body || ''),
                    type: String(type),
                    ...Object.entries(data).reduce((acc, [k, v]) => {
                        acc[k] = v !== undefined && v !== null ? String(v) : '';
                        return acc;
                    }, {})
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'default',
                        icon: 'notification_icon',
                        color: '#2E7D32',
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,
                            badge: 1,
                            sound: 'default',
                            priority: 10
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.warn(`[notifyUser] Failed to send notification to user ${userId}:`, err.message);
    }
}

/**
 * Calculates payment reconciliation when moving a booking to a new offer.
 * 
 * @param {Array} oldPayments - Payment records from the old booking
 * @param {number} newPrice - Price of the target new offer
 * @param {string} oldStatus - Status of the old booking
 * @returns {Object} Calculated balance, status, verification status, and overpayment if any.
 */
function reconcilePaymentsAndBalance(oldPayments = [], newPrice = 0, oldStatus = 'for-reservation') {
    const capturedPayments = oldPayments.filter(p => p && p.status === 'captured');
    const totalCaptured = capturedPayments.reduce((sum, p) => {
        const net = (Number(p.amount) || 0) - (Number(p.refundedAmount) || 0);
        return sum + Math.max(0, net);
    }, 0);

    const totalPaid = Math.round(totalCaptured * 100) / 100;
    const targetPrice = Math.round(newPrice * 100) / 100;

    let remainingBalance = 0;
    let status = 'for-reservation';
    let paymentVerificationStatus = null;
    let overpayment = null;

    if (totalPaid === 0) {
        // Case A: Unpaid booking
        remainingBalance = targetPrice;
        status = ['for-reservation', 'pending-docs', 'approved-docs', 'for-payment'].includes(oldStatus)
            ? oldStatus
            : 'for-payment';
        paymentVerificationStatus = null;
    } else if (totalPaid < targetPrice) {
        // Case B: Partial / Downpayment transferred; new offer is more expensive or old payment was downpayment
        remainingBalance = Math.round((targetPrice - totalPaid) * 100) / 100;
        status = 'downpayment';
        paymentVerificationStatus = 'downpayment';
    } else if (totalPaid === targetPrice) {
        // Case C: Exact match
        remainingBalance = 0;
        status = 'paid';
        paymentVerificationStatus = 'fully_paid';
    } else {
        // Case D: totalPaid > targetPrice -> New offer is cheaper, resulting in an excess amount
        remainingBalance = 0;
        status = 'paid';
        paymentVerificationStatus = 'fully_paid';
        const excessAmount = Math.round((totalPaid - targetPrice) * 100) / 100;
        overpayment = {
            excessAmount,
            originalVerifiedAmount: totalPaid,
            hikeAmountCaptured: targetPrice,
            status: 'awaiting_hiker_wallet',
        };
    }

    return {
        totalPaid,
        remainingBalance,
        status,
        paymentVerificationStatus,
        overpayment,
    };
}

/**
 * Core business logic for approving a reschedule request.
 * Can be called directly in unit tests with a mock db and caller.
 * 
 * @param {FirebaseFirestore.Firestore} db
 * @param {Object} caller - Auth token information from request.auth
 * @param {Object} data - Input payload { bookingId, userId, newOfferId, rescheduleId, businessId, adminNote }
 * @param {Object} [options] - Optional overrides (e.g. custom notifyFn for testing)
 */
async function executeRescheduleApproval(db, caller, data, options = {}) {
    const {
        bookingId,
        userId,
        newOfferId,
        rescheduleId,
        businessId: inputBusinessId,
        adminNote,
    } = data || {};

    console.log(`[approveReschedule] Invoked by ${caller?.uid} for booking ${bookingId} to offer ${newOfferId}`);

    if (!caller) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!bookingId || !userId || !newOfferId) {
        throw new HttpsError('invalid-argument', 'bookingId, userId, and newOfferId are required.');
    }

    // 1. Fetch old booking
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
        throw new HttpsError('not-found', 'Old booking not found.');
    }

    const bookingData = bookingSnap.data() || {};

    if (bookingData.status === 'rescheduled') {
        throw new HttpsError('failed-precondition', 'This booking has already been rescheduled.');
    }

    const unreschedulableStatuses = ['cancelled', 'finished', 'refunded', 'expired'];
    if (unreschedulableStatuses.includes(bookingData.status)) {
        throw new HttpsError('failed-precondition', `Cannot reschedule a booking with status '${bookingData.status}'.`);
    }

    const oldOfferId = bookingData.offer?.id;
    if (!oldOfferId) {
        throw new HttpsError('invalid-argument', 'Old booking does not contain a valid offer ID.');
    }

    if (oldOfferId === newOfferId) {
        throw new HttpsError('invalid-argument', 'Cannot reschedule to the exact same offer.');
    }

    const businessId = inputBusinessId || bookingData.business?.id;
    if (!businessId) {
        throw new HttpsError('invalid-argument', 'Business ID could not be resolved from booking.');
    }

    // Authorization: Must be admin of this business or superadmin
    const adminBusinessId = caller.token?.businessId || caller.token?.owner;
    const isAdmin = caller.token?.role === 'admin' && (!businessId || adminBusinessId === businessId);
    const isSuperAdmin = caller.token?.role === 'superadmin';

    if (!isAdmin && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only administrators for this business can approve reschedule requests.');
    }

    // 2. Fetch Offer documents
    const oldOfferRef = db.collection('businesses').doc(businessId).collection('offers').doc(oldOfferId);
    const newOfferRef = db.collection('businesses').doc(businessId).collection('offers').doc(newOfferId);

    const [oldOfferSnap, newOfferSnap] = await Promise.all([
        oldOfferRef.get(),
        newOfferRef.get()
    ]);

    if (!newOfferSnap.exists) {
        throw new HttpsError('not-found', 'Target new offer not found.');
    }

    const newOfferData = newOfferSnap.data() || {};

    if ((newOfferData.status || '').toLowerCase() === 'cancelled') {
        throw new HttpsError('failed-precondition', 'Cannot reschedule to a cancelled offer.');
    }

    const currentReserved = Number(newOfferData.reservedPax) || 0;
    const maxPax = Number(newOfferData.maxPax) || 0;
    if (maxPax > 0 && currentReserved >= maxPax) {
        throw new HttpsError('resource-exhausted', 'Target offer is already at maximum capacity.');
    }

    // 3. Verify user does not already have an active booking on the target offer
    const existingTargetBookingsSnap = await db.collection('users').doc(userId).collection('bookings')
        .where('offer.id', '==', newOfferId)
        .get();

    const hasActiveBookingOnNewOffer = existingTargetBookingsSnap.docs.some(docSnap => {
        if (docSnap.id === bookingId) return false;
        const bData = docSnap.data() || {};
        return !['cancelled', 'refunded', 'expired', 'rescheduled'].includes(bData.status);
    });

    if (hasActiveBookingOnNewOffer) {
        throw new HttpsError('already-exists', 'User already has an active booking for the target offer.');
    }

    // 4. Financial Reconciliation
    const oldPayments = Array.isArray(bookingData.payment) ? bookingData.payment : [];
    const newPrice = Number(newOfferData.price) || 0;
    const reconciliation = reconcilePaymentsAndBalance(oldPayments, newPrice, bookingData.status);

    const transferredPayments = oldPayments.map(p => ({
        ...p,
        transferredFromBookingId: bookingId
    }));

    // 4. Prepare New Booking Document
    const newBookingRef = db.collection('users').doc(userId).collection('bookings').doc();
    const newBookingId = newBookingRef.id;

    const newBookingPayload = {
        id: newBookingId,
        status: reconciliation.status,
        offer: {
            id: newOfferId,
            date: newOfferData.date || null,
            price: newPrice,
        },
        trail: newOfferData.trail || bookingData.trail || null,
        business: newOfferData.business || bookingData.business || null,
        user: bookingData.user || null,
        emergencyContact: bookingData.emergencyContact || {
            name: '',
            contactNumber: '',
            phoneVerifiedAt: null
        },
        documents: Array.isArray(bookingData.documents) ? bookingData.documents : [],
        payment: transferredPayments,
        remainingBalance: reconciliation.remainingBalance,
        rescheduledFromBookingId: bookingId,
        rescheduledFromOfferId: oldOfferId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    if (reconciliation.paymentVerificationStatus) {
        newBookingPayload.paymentVerificationStatus = reconciliation.paymentVerificationStatus;
    }
    if (reconciliation.overpayment) {
        newBookingPayload.overpayment = {
            ...reconciliation.overpayment,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
    }

    // 5. Fetch Group documents for Old and New Offers
    const oldGroupRef = db.collection('groups').doc(oldOfferId);
    const newGroupRef = db.collection('groups').doc(newOfferId);

    const [oldGroupSnap, newGroupSnap] = await Promise.all([
        oldGroupRef.get(),
        newGroupRef.get()
    ]);

    // Member representation in group chat
    const hikerMember = {
        id: userId,
        username: bookingData.user?.username || '',
        firstname: bookingData.user?.firstname || '',
        lastname: bookingData.user?.lastname || '',
        email: bookingData.user?.email || '',
        photoUrl: bookingData.user?.photoUrl || '',
        bookingId: newBookingId,
    };

    // 6. Reschedule request document if provided
    let rescheduleRef = null;
    if (rescheduleId) {
        rescheduleRef = db.collection('businesses').doc(businessId).collection('reschedules').doc(rescheduleId);
    }

    // 7. Global payments sync
    let globalPaymentSnaps = [];
    try {
        const paymentsQuery = await db.collection('payments').where('bookingId', '==', bookingId).get();
        if (!paymentsQuery.empty) {
            globalPaymentSnaps = paymentsQuery.docs;
        }
    } catch (pErr) {
        console.warn(`[approveReschedule] Global /payments query warning:`, pErr.message);
    }

    // ─── ATOMIC BATCH WRITE ────────────────────────────────────────────────
    const batch = db.batch();

    // 1. Update Old Offer: Decrement reservedPax
    if (oldOfferSnap.exists) {
        const oldReserved = Number(oldOfferSnap.data()?.reservedPax) || 0;
        if (oldReserved > 0) {
            batch.update(oldOfferRef, {
                reservedPax: FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }

    // 2. Update New Offer: Increment reservedPax
    batch.update(newOfferRef, {
        reservedPax: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
    });

    // 3. Update Old Booking: Mark as 'rescheduled' with tracking IDs
    batch.update(bookingRef, {
        status: 'rescheduled',
        rescheduledToBookingId: newBookingId,
        rescheduledToOfferId: newOfferId,
        rescheduledAt: FieldValue.serverTimestamp(),
        rescheduledBy: caller.uid,
        adminNote: adminNote || null,
        updatedAt: FieldValue.serverTimestamp()
    });

    // 4. Create New Booking
    batch.set(newBookingRef, newBookingPayload);

    // 5. Update Old Group Chat (Remove hiker)
    if (oldGroupSnap.exists) {
        const oldGroupData = oldGroupSnap.data() || {};
        const updatedOldMembers = (oldGroupData.members || []).filter(m => m.id !== userId);
        batch.update(oldGroupRef, {
            participantsIds: FieldValue.arrayRemove(userId),
            members: updatedOldMembers,
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    // 6. Update or Create New Group Chat (Add hiker with self-healing)
    if (newGroupSnap.exists) {
        const newGroupData = newGroupSnap.data() || {};
        const filteredNewMembers = (newGroupData.members || []).filter(m => m.id !== userId);
        batch.update(newGroupRef, {
            participantsIds: FieldValue.arrayUnion(userId),
            members: [...filteredNewMembers, hikerMember],
            updatedAt: FieldValue.serverTimestamp()
        });
    } else {
        // Self-heal: Create group if it doesn't exist yet for new offer
        const healedGroup = {
            id: newOfferId,
            type: 'group',
            status: 'active',
            admins: newOfferData.business ? [{
                id: newOfferData.business.id,
                username: newOfferData.business.name || '',
                firstname: newOfferData.business.name || '',
                lastname: '',
                email: ''
            }] : [],
            participantsIds: [userId],
            members: [hikerMember],
            business: newOfferData.business || bookingData.business || null,
            trail: newOfferData.trail || bookingData.trail || null,
            offer: {
                id: newOfferId,
                date: newOfferData.date || null,
                price: newPrice,
                maxPax: newOfferData.maxPax || 0,
                minPax: newOfferData.minPax || 0,
                reservedPax: (newOfferData.reservedPax || 0) + 1,
                duration: newOfferData.duration || '',
                description: newOfferData.description || '',
                documents: newOfferData.documents || [],
                inclusions: newOfferData.inclusions || [],
                thingsToBring: newOfferData.thingsToBring || [],
                reminders: newOfferData.reminders || [],
                schedule: newOfferData.schedule || []
            },
            lastMessage: null,
            image: newOfferData.trail?.featuredImage || '',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };
        batch.set(newGroupRef, healedGroup);
    }

    // 7. Reschedule Request Update
    if (rescheduleRef) {
        batch.update(rescheduleRef, {
            status: 'approved',
            oldBookingId: bookingId,
            newBookingId: newBookingId,
            adminNote: adminNote || null,
            approvedAt: FieldValue.serverTimestamp(),
            approvedBy: caller.uid,
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    // 8. Global /payments Ledger Update
    if (globalPaymentSnaps.length > 0) {
        globalPaymentSnaps.forEach(pDoc => {
            batch.update(pDoc.ref, {
                bookingId: newBookingId,
                previousBookingId: bookingId,
                updatedAt: FieldValue.serverTimestamp()
            });
        });
    }

    // Commit all operations atomically
    await batch.commit();
    console.log(`[approveReschedule] Successfully rescheduled booking ${bookingId} -> ${newBookingId}`);

    // 8. Notify Hiker
    const dispatcher = options.notifyFn || notifyUser;
    const oldTrailName = bookingData.trail?.name || 'your hike';
    const newTrailName = newOfferData.trail?.name || 'a new hike';
    const businessName = bookingData.business?.name || 'the organizer';

    await dispatcher(db, userId, {
        title: 'Reschedule Approved',
        body: `Your hike for ${oldTrailName} has been rescheduled to ${newTrailName}.`,
        inAppTitle: 'Reschedule Approved',
        inAppMessage: `Your booking has been rescheduled to ${newTrailName} with ${businessName}.`,
        type: 'reschedule_approved',
        metadata: {
            oldBookingId: bookingId,
            newBookingId,
            oldOfferId,
            newOfferId,
            trailName: newTrailName,
            businessName,
        },
        data: {
            bookingId: newBookingId,
            userId,
        }
    });

    return {
        success: true,
        oldBookingId: bookingId,
        newBookingId,
        status: reconciliation.status,
        remainingBalance: reconciliation.remainingBalance,
        totalTransferredPaid: reconciliation.totalPaid,
        hasOverpayment: Boolean(reconciliation.overpayment),
        excessAmount: reconciliation.overpayment?.excessAmount || 0,
        message: 'Reschedule request approved successfully.'
    };
}

/**
 * Callable Firebase Cloud Function wrapper.
 */
const approveReschedule = https.onCall(async (request) => {
    const db = admin.firestore();
    const caller = request.auth;
    const data = request.data || {};

    return await executeRescheduleApproval(db, caller, data);
});

module.exports = {
    approveReschedule,
    executeRescheduleApproval,
    reconcilePaymentsAndBalance,
};
