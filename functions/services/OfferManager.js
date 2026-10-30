const admin = require('firebase-admin');
const { https } = require('firebase-functions/v2');
const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const { DateTime } = require('luxon');

/**
 * Normalizes any date input (Timestamp, Date, ISO string, milliseconds)
 * into a Luxon DateTime pinned to the Asia/Manila timezone.
 *
 * @param {any} dateInput 
 * @returns {DateTime|null}
 */
function parseToManilaDateTime(dateInput) {
    if (!dateInput) return null;
    if (typeof dateInput.toDate === 'function') {
        return DateTime.fromJSDate(dateInput.toDate()).setZone('Asia/Manila');
    }
    if (dateInput instanceof Date) {
        return DateTime.fromJSDate(dateInput).setZone('Asia/Manila');
    }
    if (typeof dateInput === 'string') {
        const dt = DateTime.fromISO(dateInput, { zone: 'Asia/Manila' });
        if (dt.isValid) return dt;
        const fallback = new Date(dateInput);
        if (!isNaN(fallback.getTime())) {
            return DateTime.fromJSDate(fallback).setZone('Asia/Manila');
        }
    }
    if (typeof dateInput === 'number') {
        return DateTime.fromMillis(dateInput).setZone('Asia/Manila');
    }
    return null;
}

/**
 * Validates Phase 1 requirements for updating an offer:
 * 1. Authentication Check
 * 2. Offer Existence & Active Status Check
 * 3. Tenant & Owner Access Verification (matching data.id === callerUid)
 * 4. Hike Date Lead-Time Rules (10-day prior cutoff on current date; 7-day min on new date)
 * 5. Price Format & Positive Value Validation
 *
 * @param {admin.firestore.Firestore} db 
 * @param {Object} caller - request.auth context
 * @param {Object} data - Input payload containing { offerId, businessId, updates }
 * @returns {Promise<Object>} Validated context for subsequent phases
 */
async function validateOfferUpdatePhase1(db, caller, data = {}) {
    // 1. Authentication Check
    if (!caller || !caller.uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const callerUid = caller.uid;

    const { offerId, businessId: inputBusinessId, updates = {} } = data;
    if (!offerId) {
        throw new HttpsError('invalid-argument', 'offerId is required.');
    }

    // 2. Resolve Offer Document & Business ID
    let businessId = inputBusinessId;
    let offerRef = null;
    let offerSnap = null;

    if (businessId) {
        offerRef = db.collection('businesses').doc(businessId).collection('offers').doc(offerId);
        offerSnap = await offerRef.get();
    } else {
        // Fallback: locate offer via collectionGroup if businessId wasn't passed directly
        const qSnap = await db.collectionGroup('offers').where('id', '==', offerId).limit(1).get();
        if (!qSnap.empty) {
            offerSnap = qSnap.docs[0];
            offerRef = offerSnap.ref;
            businessId = offerSnap.data().business?.id || offerRef.parent.parent?.id;
        }
    }

    if (!offerSnap || !offerSnap.exists) {
        throw new HttpsError('not-found', `Offer with ID '${offerId}' not found.`);
    }

    const offerData = offerSnap.data();
    businessId = businessId || offerData.business?.id;

    if (!businessId) {
        throw new HttpsError('failed-precondition', 'Offer document is missing associated business information.');
    }

    // Ensure offer is currently active
    const offerStatus = offerData.status || 'active';
    if (offerStatus !== 'active') {
        throw new HttpsError(
            'failed-precondition',
            `Cannot update offer because its current status is '${offerStatus}'. Only active offers can be updated.`
        );
    }

    // 3. Tenant & Owner Access Verification
    const isSuperAdmin = caller.token?.role === 'superadmin';
    if (!isSuperAdmin) {
        // Check businesses/{businessId}/admins where doc.data().id === callerUid
        // Handles both regular admin docs and the owner doc (docId 'owner', data.id: callerUid)
        const adminQuerySnap = await db
            .collection('businesses')
            .doc(businessId)
            .collection('admins')
            .where('id', '==', callerUid)
            .limit(1)
            .get();

        if (adminQuerySnap.empty) {
            throw new HttpsError(
                'permission-denied',
                'You are not an authorized admin or owner of this business.'
            );
        }
    }

    const now = DateTime.now().setZone('Asia/Manila');

    // 4. Hike Date Validation (If Date is changing)
    const newDateRaw = updates.date !== undefined ? updates.date : updates.hikeDate;
    let isDateChanged = false;
    let proposedDate = null;
    const currentDate = parseToManilaDateTime(offerData.date || offerData.hikeDate);

    if (!currentDate || !currentDate.isValid) {
        throw new HttpsError('failed-precondition', 'Existing offer contains an invalid or missing hike date.');
    }

    if (newDateRaw !== undefined && newDateRaw !== null) {
        proposedDate = parseToManilaDateTime(newDateRaw);
        if (!proposedDate || !proposedDate.isValid) {
            throw new HttpsError('invalid-argument', 'Invalid new hike date format provided.');
        }

        // Compare timestamps
        if (proposedDate.toMillis() !== currentDate.toMillis()) {
            isDateChanged = true;

            // Rule 1: Date change can only happen at least 10 days before the current scheduled hike
            const daysUntilCurrentHike = currentDate.diff(now, 'days').days;
            if (daysUntilCurrentHike < 10) {
                throw new HttpsError(
                    'failed-precondition',
                    'Hike date can only be modified at least 10 days before the scheduled hike.'
                );
            }

            // Rule 2: Proposed new date cannot be less than 7 days from today
            const daysUntilNewHike = proposedDate.diff(now, 'days').days;
            if (daysUntilNewHike < 7) {
                throw new HttpsError(
                    'invalid-argument',
                    'New hike date must be scheduled at least 7 days from today.'
                );
            }
        }
    }

    // 5. Price Format & Value Validation (If Price is changing)
    const newPriceRaw = updates.price;
    let isPriceChanged = false;
    let normalizedPrice = null;

    if (newPriceRaw !== undefined && newPriceRaw !== null && newPriceRaw !== offerData.price) {
        if (typeof newPriceRaw !== 'number' || !Number.isFinite(newPriceRaw) || newPriceRaw <= 0) {
            throw new HttpsError(
                'invalid-argument',
                'Invalid price amount: Price must be a valid positive number greater than 0.'
            );
        }
        normalizedPrice = Math.round(newPriceRaw * 100) / 100;
        isPriceChanged = true;
    }

    return {
        callerUid,
        businessId,
        offerId,
        offerRef,
        offerData,
        currentDate,
        isDateChanged,
        proposedDate,
        isPriceChanged,
        normalizedPrice,
        updates,
    };
}

const ACTIVE_BOOKING_STATUSES = [
    'for-reservation',
    'pending-docs',
    'approved-docs',
    'for-payment',
    'downpayment',
    'paid',
    'completed',
    'for-cancellation',
    'for-reschedule',
];

/**
 * Evaluates Phase 2 requirements for updating an offer:
 * 1. Query all active bookings for this offer (using collectionGroup).
 * 2. If price is changing, verify that no pending administrative tasks or
 *    unsettled refunds exist that would cause financial/ledger corruption:
 *    - Pending cancellation requests ('for-cancellation')
 *    - Pending reschedule requests ('for-reschedule')
 *    - Pending payment verification receipts ('pending_verification')
 *    - Unsettled overpayment refunds (overpayment.status !== 'completed')
 *
 * @param {admin.firestore.Firestore} db 
 * @param {Object} phase1Context - Output from validateOfferUpdatePhase1
 * @returns {Promise<Object>} Phase 2 context with active bookings list
 */
async function checkOfferBlockersPhase2(db, phase1Context) {
    const { offerId, isPriceChanged } = phase1Context;

    // Fetch all bookings for this offer via collectionGroup
    const bookingsSnap = await db.collectionGroup('bookings')
        .where('offer.id', '==', offerId)
        .get();

    const allBookings = bookingsSnap.docs.map(doc => ({
        id: doc.id,
        ref: doc.ref,
        data: doc.data(),
    }));

    const activeBookings = allBookings.filter(b => 
        ACTIVE_BOOKING_STATUSES.includes(b.data.status)
    );

    // Blocker evaluation only applies if price is changing
    if (isPriceChanged) {
        for (const booking of activeBookings) {
            const b = booking.data;

            // 1. Pending cancellation blocker
            if (b.status === 'for-cancellation') {
                throw new HttpsError(
                    'failed-precondition',
                    'Cannot change price: There are pending cancellation requests awaiting resolution.'
                );
            }

            // 2. Pending reschedule blocker
            if (b.status === 'for-reschedule') {
                throw new HttpsError(
                    'failed-precondition',
                    'Cannot change price: There are pending reschedule requests awaiting resolution.'
                );
            }

            // 3. Unverified payment receipts blocker
            if (b.paymentVerificationStatus === 'pending_verification') {
                throw new HttpsError(
                    'failed-precondition',
                    'Cannot change price: There are unverified manual payment receipts awaiting admin review.'
                );
            }

            // 4. Unsettled overpayment blocker
            if (b.overpayment && b.overpayment.status !== 'completed') {
                throw new HttpsError(
                    'failed-precondition',
                    'Settle overpayments first.'
                );
            }
        }
    }

    return {
        ...phase1Context,
        allBookings,
        activeBookings,
    };
}

/**
 * Executes Phase 3:
 * Runs an atomic Firestore Transaction to update the offer document and all
 * active bookings.
 * 
 * Rules:
 * - All transaction reads occur before all transaction writes.
 * - For each active booking:
 *   - If price changed:
 *     - Recomputes verified paid amount from captured payments.
 *     - If price increased: sets remainingBalance = newPrice - verifiedPaid.
 *       If booking was 'paid' or 'completed' and remainingBalance > 0, marks as 'downpayment'.
 *     - If price decreased:
 *       - If verifiedPaid > newPrice: initializes overpayment object ('awaiting_hiker_wallet')
 *         and sets remainingBalance = 0.
 *       - If verifiedPaid == newPrice: promotes 'downpayment' to 'paid', remainingBalance = 0.
 *       - If verifiedPaid < newPrice: reduces remainingBalance = newPrice - verifiedPaid.
 *     - Updates offer.price and totalAmount to newPrice.
 *   - If date changed: updates offer.date.
 *   - Stamped with updatedAt.
 * - For Offer document:
 *   - Sanitizes and updates allowed fields (price, date, description, etc.) with updatedAt.
 *
 * @param {admin.firestore.Firestore} db 
 * @param {Object} phase2Context - Output from checkOfferBlockersPhase2
 * @returns {Promise<Object>} Phase 3 execution result with affected users list
 */
async function executeOfferUpdateTransactionPhase3(db, phase2Context) {
    const {
        offerRef,
        activeBookings,
        isPriceChanged,
        normalizedPrice,
        isDateChanged,
        proposedDate,
        offerData,
        updates = {},
    } = phase2Context;

    const affectedUsers = [];

    await db.runTransaction(async (transaction) => {
        // --- 1. TRANSACTION READS (Must execute before any writes) ---
        const freshOfferSnap = await transaction.get(offerRef);
        if (!freshOfferSnap.exists) {
            throw new HttpsError('not-found', 'Offer document no longer exists.');
        }

        const freshBookingSnaps = await Promise.all(
            activeBookings.map(b => transaction.get(b.ref))
        );

        // --- 2. TRANSACTION WRITES ---
        // A. Update Active Bookings
        for (let i = 0; i < freshBookingSnaps.length; i++) {
            const snap = freshBookingSnaps[i];
            if (!snap.exists) continue;

            const bData = snap.data();
            const bookingUpdates = {
                updatedAt: FieldValue.serverTimestamp(),
            };

            let userChangeType = 'general_update';
            let excessAmount = 0;
            let currentRemainingBalance = bData.remainingBalance ?? 0;

            if (isPriceChanged) {
                bookingUpdates['offer.price'] = normalizedPrice;
                bookingUpdates.totalAmount = normalizedPrice;

                const payments = bData.payment || [];
                const capturedPayments = payments.filter(p => p.status === 'captured');
                const verifiedPaid = capturedPayments.reduce(
                    (sum, p) => sum + (p.amount || 0) - (p.refundedAmount || 0),
                    0
                );

                if (normalizedPrice > offerData.price) {
                    // Price increased
                    const newBalance = Math.max(0, Math.round((normalizedPrice - verifiedPaid) * 100) / 100);
                    bookingUpdates.remainingBalance = newBalance;
                    currentRemainingBalance = newBalance;

                    if (['paid', 'completed'].includes(bData.status) && newBalance > 0) {
                        bookingUpdates.status = 'downpayment';
                        bookingUpdates.paymentVerificationStatus = 'downpayment';
                    }
                    userChangeType = 'price_increased';
                } else {
                    // Price decreased
                    if (verifiedPaid > normalizedPrice) {
                        excessAmount = Math.round((verifiedPaid - normalizedPrice) * 100) / 100;
                        bookingUpdates.remainingBalance = 0;
                        currentRemainingBalance = 0;
                        bookingUpdates.overpayment = {
                            excessAmount,
                            originalVerifiedAmount: verifiedPaid,
                            hikeAmountCaptured: normalizedPrice,
                            status: 'awaiting_hiker_wallet',
                            createdAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp(),
                        };
                        userChangeType = 'price_decreased_overpayment';
                    } else if (Math.abs(verifiedPaid - normalizedPrice) < 0.01) {
                        bookingUpdates.remainingBalance = 0;
                        currentRemainingBalance = 0;
                        if (bData.status === 'downpayment') {
                            bookingUpdates.status = 'paid';
                            bookingUpdates.paymentVerificationStatus = 'fully_paid';
                        }
                        userChangeType = 'price_decreased_fully_paid';
                    } else {
                        const newBalance = Math.round((normalizedPrice - verifiedPaid) * 100) / 100;
                        bookingUpdates.remainingBalance = newBalance;
                        currentRemainingBalance = newBalance;
                        userChangeType = 'price_decreased_balance_reduced';
                    }
                }
            }

            if (isDateChanged && proposedDate) {
                const newTimestamp = Timestamp.fromDate(proposedDate.toJSDate());
                bookingUpdates['offer.date'] = newTimestamp;
                if (userChangeType === 'general_update') {
                    userChangeType = 'date_rescheduled';
                }
            }

            transaction.update(snap.ref, bookingUpdates);

            const userId = snap.ref.parent?.parent?.id || bData.user?.id;
            if (userId) {
                affectedUsers.push({
                    userId,
                    bookingId: snap.id,
                    trailName: bData.trail?.name || offerData.trail?.name || 'Hike',
                    userChangeType,
                    remainingBalance: currentRemainingBalance,
                    excessAmount,
                    status: bookingUpdates.status || bData.status,
                });
            }
        }

        // B. Update Offer Document
        const offerPayload = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (isPriceChanged) {
            offerPayload.price = normalizedPrice;
        }

        if (isDateChanged && proposedDate) {
            const newTimestamp = Timestamp.fromDate(proposedDate.toJSDate());
            offerPayload.date = newTimestamp;
            offerPayload.hikeDate = newTimestamp;
        }

        const allowedFields = [
            'description',
            'duration',
            'maxPax',
            'minPax',
            'documents',
            'inclusions',
            'thingsToBring',
            'reminders',
            'schedule',
        ];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                offerPayload[field] = updates[field];
            }
        }

        if (updates.endDate) {
            const endDt = parseToManilaDateTime(updates.endDate);
            if (endDt && endDt.isValid) {
                offerPayload.endDate = Timestamp.fromDate(endDt.toJSDate());
            }
        }

        transaction.update(offerRef, offerPayload);
    });

    return {
        ...phase2Context,
        updatedBookingsCount: activeBookings.length,
        affectedUsers,
    };
}

/**
 * Sends in-app and push notifications to a user.
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
            const response = await admin.messaging().sendEachForMulticast({
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
                        sound: 'default',
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,
                            badge: 1,
                            sound: 'default',
                            priority: 10,
                        }
                    }
                }
            });

            console.log(`[notifyUser] Push sent to user ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed.`);
        }
    } catch (err) {
        console.error(`[notifyUser] Failed notifying user ${userId}:`, err.message);
    }
}

/**
 * Executes Phase 4:
 * Dispatches in-app and push notifications to all affected hikers based on
 * the state changes computed in Phase 3.
 *
 * Runs post-transaction so notification delivery issues never abort or roll
 * back the committed database updates.
 *
 * @param {admin.firestore.Firestore} db 
 * @param {Object} phase3Result - Output from executeOfferUpdateTransactionPhase3
 * @returns {Promise<Object>} Notification summary results
 */
async function dispatchOfferUpdateNotificationsPhase4(db, phase3Result) {
    const {
        offerId,
        normalizedPrice,
        proposedDate,
        affectedUsers = [],
    } = phase3Result;

    let notifiedCount = 0;
    const errors = [];

    const hikeDateStr = proposedDate ? proposedDate.toFormat('LLL dd, yyyy') : '';

    for (const user of affectedUsers) {
        try {
            const { userId, bookingId, trailName, userChangeType, remainingBalance, excessAmount } = user;
            let title = 'Tour Update';
            let message = `Your booking for ${trailName} has been updated.`;
            let notifType = 'offer_update';
            let docId = `notif_${offerId}_${bookingId}`;

            switch (userChangeType) {
                case 'price_increased':
                    title = `Offer Price Updated - ${trailName}`;
                    message = `The price for ${trailName} was updated to ₱${(normalizedPrice || 0).toFixed(2)}. You have a remaining balance of ₱${(remainingBalance || 0).toFixed(2)} to settle before the hike.`;
                    notifType = 'offer_price_increased';
                    docId = `price_inc_${offerId}_${bookingId}`;
                    break;

                case 'price_decreased_overpayment':
                    title = `Excess Refund Available - ${trailName}`;
                    message = `Good news! The price for ${trailName} was lowered to ₱${(normalizedPrice || 0).toFixed(2)}. You have an excess refund of ₱${(excessAmount || 0).toFixed(2)}. Tap to provide your GCash/Maya wallet so the organizer can send your refund.`;
                    notifType = 'overpayment_wallet_requested';
                    docId = `overpayment_req_${offerId}_${bookingId}`;
                    break;

                case 'price_decreased_fully_paid':
                    title = `Booking Fully Paid! 🎉 - ${trailName}`;
                    message = `The price for ${trailName} was lowered to ₱${(normalizedPrice || 0).toFixed(2)}. Your deposit now covers 100% of the tour fee!`;
                    notifType = 'booking_fully_paid';
                    docId = `price_full_${offerId}_${bookingId}`;
                    break;

                case 'price_decreased_balance_reduced':
                    title = `Offer Price Reduced - ${trailName}`;
                    message = `The price for ${trailName} was reduced to ₱${(normalizedPrice || 0).toFixed(2)}. Your remaining balance has been reduced to ₱${(remainingBalance || 0).toFixed(2)}.`;
                    notifType = 'offer_price_reduced';
                    docId = `price_red_${offerId}_${bookingId}`;
                    break;

                case 'date_rescheduled':
                    title = `Hike Date Rescheduled - ${trailName}`;
                    message = `The hike date for ${trailName} has been moved to ${hikeDateStr}. Please review your booking details.`;
                    notifType = 'offer_date_rescheduled';
                    docId = `date_resched_${offerId}_${bookingId}`;
                    break;

                default:
                    title = `Hike Details Updated - ${trailName}`;
                    message = `The organizer has updated the details for ${trailName}. Please check your booking itinerary.`;
                    notifType = 'offer_details_updated';
                    docId = `general_update_${offerId}_${bookingId}`;
                    break;
            }

            await notifyUser(db, userId, {
                title,
                body: message,
                inAppTitle: title,
                inAppMessage: message,
                type: notifType,
                docId,
                metadata: {
                    bookingId,
                    offerId,
                    trailName,
                    ...(normalizedPrice ? { newPrice: normalizedPrice } : {}),
                    ...(remainingBalance !== undefined ? { remainingBalance } : {}),
                    ...(excessAmount ? { excessAmount } : {}),
                    ...(hikeDateStr ? { hikeDate: hikeDateStr } : {}),
                },
                data: {
                    bookingId,
                    offerId,
                    type: notifType,
                }
            });

            notifiedCount++;
        } catch (err) {
            console.error(`[dispatchOfferUpdateNotificationsPhase4] Error notifying user ${user.userId}:`, err.message);
            errors.push({ userId: user.userId, error: err.message });
        }
    }

    return {
        notifiedCount,
        errors,
    };
}

/**
 * Callable Cloud Function: adminUpdateOffer
 */
const adminUpdateOffer = https.onCall(async (request) => {
    const db = admin.firestore();
    const caller = request.auth;
    const data = request.data || {};

    // Phase 1: Authentication & Lead-Time Validations
    const phase1Context = await validateOfferUpdatePhase1(db, caller, data);

    // Phase 2: Blocker Detection & Integrity Checks
    const phase2Context = await checkOfferBlockersPhase2(db, phase1Context);

    // Phase 3: Atomic Transaction & State Transitions
    const phase3Result = await executeOfferUpdateTransactionPhase3(db, phase2Context);

    // Phase 4: Post-Transaction Notifications & Communication
    const notificationSummary = await dispatchOfferUpdateNotificationsPhase4(db, phase3Result);

    return {
        success: true,
        message: 'Offer updated and affected users notified successfully.',
        details: {
            offerId: phase3Result.offerId,
            businessId: phase3Result.businessId,
            isDateChanged: phase3Result.isDateChanged,
            isPriceChanged: phase3Result.isPriceChanged,
            normalizedPrice: phase3Result.normalizedPrice,
            updatedBookingsCount: phase3Result.updatedBookingsCount,
            notifiedUsersCount: notificationSummary.notifiedCount,
        }
    };
});

module.exports = {
    ACTIVE_BOOKING_STATUSES,
    parseToManilaDateTime,
    validateOfferUpdatePhase1,
    checkOfferBlockersPhase2,
    executeOfferUpdateTransactionPhase3,
    dispatchOfferUpdateNotificationsPhase4,
    adminUpdateOffer,
};

