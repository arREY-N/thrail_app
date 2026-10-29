const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { https } = require("firebase-functions/v2");
const { HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const functions = require('firebase-functions/v1')
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const { DateTime } = require('luxon');
const { CloudTasksClient } = require('@google-cloud/tasks');

let _tasksClient = null;
function getTasksClient() {
    if (!_tasksClient) {
        _tasksClient = new CloudTasksClient();
    }
    return _tasksClient;
}

const paymongoSecret = defineSecret('PAYMONGO_SECRET_KEY');
const paymongoWebhookSecret = defineSecret('PAYMONGO_WEBHOOK_SECRET'); // Optional
const { Buffer } = require('buffer');
const PaymentManager = require('./services/PaymentManager');
const LoginLimiter = require('./services/LoginLimiter');

const authWebApiKey = defineString('AUTH_WEB_API_KEY');
const PayMongoProvider = require('./services/providers/PayMongoProvider');
const { approveReschedule } = require('./services/RescheduleManager');
const {
    removeUserFromGroupOnCancellation,
    onDeleteBooking,
} = require('./services/GroupChatManager');

admin.initializeApp();

setGlobalOptions({
    region: 'us-central1',
    maxInstances: 10
});

exports.onNewMessage = functions.firestore
    .document('groups/{groupId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();
        if (!data) return null;

        const { content, senderName, senderId } = data;
        const groupId = context.params.groupId;

        const groupDoc = await admin.firestore().collection('groups').doc(groupId).get();
        const group = groupDoc.data();

        if (!group) {
            console.error(`Group ${groupId} not found`);
            return null;
        }

        const recipientIds = (group.members || [])
            .map(m => m.id)
            .filter(id => id && id !== senderId);

        if (recipientIds.length === 0) return null;

        const tokens = [];
        const userSnapshots = await admin.firestore()
            .collection('users')
            .where(admin.firestore.FieldPath.documentId(), 'in', recipientIds.slice(0, 30))
            .get();

        userSnapshots.forEach(doc => {
            const userTokens = doc.data().fcmTokens || [];
            tokens.push(...userTokens.map(t => typeof t === 'string' ? t : t.token));
        });

        const uniqueTokens = [...new Set(tokens)].filter(t => !!t);

        if (uniqueTokens.length === 0) return null;

        const groupName = `${group.business?.name || 'Organizer'}_${group.trail?.name || 'Trail'}`;

        const response = await admin.messaging().sendEachForMulticast({
            tokens: uniqueTokens,
            notification: {
                title: groupName,
                body: `${senderName}: ${content}`
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    icon: 'notification_icon',
                    color: '#2E7D32',
                    clickAction: 'fcm.ACTION.HELLO',
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

        const tokensToRemove = [];
        response.responses.forEach((res, idx) => {
            if (!res.success) {
                const errorCode = res.error?.code;
                if (errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/invalid-registration-token') {
                    tokensToRemove.push(uniqueTokens[idx]);
                }
            }
        });

        console.log(`Sent ${response.successCount} messages. ${tokensToRemove.length} stale tokens found.`);
    }
    );

exports.onAddBooking = functions.firestore
    .document('users/{userId}/bookings/{bookingId}')
    .onCreate(async (snapshot, context) => {
        try {
            const data = snapshot.data();
            const { userId } = context.params;

            const businessId = data.business?.id;
            if (!businessId) {
                console.log('Missing businessId');
                return;
            }
            const bookingId = snapshot.id;

            const userDoc = await admin.firestore()
                .collection('users')
                .doc(userId)
                .get();

            const user = userDoc.data();
            const userName = user?.firstname || 'A hiker';
            const trailName = data.trail?.name || 'a trail';

            let hikeDate = '';
            if (data.offer?.date) {
                const rawDate = data.offer.date.toDate ? data.offer.date.toDate() : new Date(data.offer.date);
                hikeDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const dateStr = hikeDate ? `${hikeDate} ` : '';

            const notificationTitle = `New Booking - ${trailName}`;
            const notificationBody = `${userName} just booked the ${dateStr}offer for ${trailName}`;

            await notifyBusinessAdmins(admin.firestore(), businessId, {
                title: notificationTitle,
                body: notificationBody,
                inAppTitle: notificationTitle,
                inAppMessage: notificationBody,
                type: 'new_booking',
                metadata: {
                    bookingId,
                    userId,
                    trailName,
                    hikeDate,
                },
                data: {
                    bookingId,
                    userId,
                    businessId,
                }
            });
        } catch (error) {
            throw new HttpsError('internal', 'Error processing new booking: ' + error.message);
        }
    }
    );

/**
 * Reusable helper to send in-app and push notifications to all admins of a business.
 */
async function notifyBusinessAdmins(db, businessId, {
    title,
    body,
    inAppTitle,
    inAppMessage,
    type,
    metadata = {},
    data = {},
    docId = null
}) {
    if (!businessId) return;

    try {
        const adminQuery = await db.collection('businesses').doc(businessId).collection('admins').get();
        const rawAdminIds = adminQuery.docs.map(doc => doc.data().id).filter(Boolean);
        const adminIds = [...new Set(rawAdminIds)];
        if (!adminIds.length) return;

        // Idempotency: if docId is specified, check if the notification already exists on the first admin
        if (docId) {
            const checkDoc = await db.collection('users').doc(adminIds[0]).collection('notifications').doc(docId).get();
            if (checkDoc.exists) {
                console.log(`[notifyBusinessAdmins] Notification ${docId} already sent to admins for business ${businessId}. Skipping to prevent duplicate.`);
                return;
            }
        }

        const userDocs = await Promise.all(
            adminIds.map(id => db.collection('users').doc(id).get())
        );

        // 1. In-app notifications for admins
        const notifPromises = adminIds.map(adminId => {
            const notifRef = docId
                ? db.collection('users').doc(adminId).collection('notifications').doc(docId)
                : db.collection('users').doc(adminId).collection('notifications').doc();
            return notifRef.set({
                title: inAppTitle || title,
                message: inAppMessage || body,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                    type,
                    businessId,
                    ...metadata,
                }
            });
        });
        await Promise.all(notifPromises);

        // 2. Multicast push to admins
        let tokens = [];
        userDocs.forEach(doc => {
            if (!doc.exists) return;
            const userTokens = doc.data().fcmTokens || [];
            tokens.push(...userTokens);
        });

        const uniqueTokens = [...new Set(tokens.map(t => typeof t === 'string' ? t : t?.token))].filter(Boolean);
        if (!uniqueTokens.length) {
            console.log(`[notifyBusinessAdmins] No FCM tokens found for business ${businessId} admins`);
            return;
        }

        const response = await admin.messaging().sendEachForMulticast({
            tokens: uniqueTokens,
            notification: {
                title,
                body,
            },
            data: {
                title: String(title || ''),
                body: String(body || ''),
                type: String(type || ''),
                businessId: String(businessId),
                ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])),
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    icon: 'notification_icon',
                    color: '#2E7D32',
                    sound: 'default',
                    defaultSound: true,
                    defaultVibrateTimings: true,
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

        console.log(`[notifyBusinessAdmins] Push sent to ${uniqueTokens.length} tokens for business ${businessId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);

        // 3. Stale token cleanup
        const tokensToRemove = [];
        response.responses.forEach((res, idx) => {
            if (!res.success) {
                const errorCode = res.error?.code;
                console.warn(`[notifyBusinessAdmins] FCM failed for token ${uniqueTokens[idx]}:`, errorCode, res.error?.message);
                if (errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/invalid-registration-token') {
                    tokensToRemove.push(uniqueTokens[idx]);
                }
            }
        });

        if (tokensToRemove.length > 0) {
            for (const doc of userDocs) {
                if (!doc.exists) continue;
                const existingTokens = doc.data().fcmTokens || [];
                const cleaned = existingTokens.filter(t => {
                    const tokenStr = typeof t === 'string' ? t : t?.token;
                    return !tokensToRemove.includes(tokenStr);
                });
                if (cleaned.length !== existingTokens.length) {
                    await db.collection('users').doc(doc.id).update({ fcmTokens: cleaned });
                }
            }
        }
    } catch (err) {
        console.error(`[notifyBusinessAdmins] Failed notifying admins for business ${businessId}:`, err);
    }
}

/**
 * Sends both in-app and push notifications to a user, with automatic invalid token cleanup.
 */
async function notifyUser(db, userId, { title, body, inAppTitle, inAppMessage, type = 'booking_update', metadata = {}, data = {}, docId = null }) {
    try {
        if (!userId) return;

        // Idempotency: if docId is specified, check if the notification already exists on user
        if (docId) {
            const checkDoc = await db.collection('users').doc(userId).collection('notifications').doc(docId).get();
            if (checkDoc.exists) {
                console.log(`[notifyUser] Notification ${docId} already sent to user ${userId}. Skipping to prevent duplicate.`);
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

        // 2. Fetch user's tokens for push
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;

        const tokens = userDoc.data()?.fcmTokens || [];
        const uniqueTokens = [...new Set(tokens.map(t => typeof t === 'string' ? t : t?.token))].filter(Boolean);

        if (uniqueTokens.length > 0) {
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
                        defaultSound: true,
                        defaultVibrateTimings: true,
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

            console.log(`[notifyUser] Push sent to ${uniqueTokens.length} tokens for user ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);

            // Clean up unregistered or invalid tokens
            const tokensToRemove = [];
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const errorCode = res.error?.code;
                    console.warn(`[notifyUser] FCM failed for token ${uniqueTokens[idx]}:`, errorCode, res.error?.message);
                    if (errorCode === 'messaging/registration-token-not-registered' ||
                        errorCode === 'messaging/invalid-registration-token') {
                        tokensToRemove.push(uniqueTokens[idx]);
                    }
                }
            });

            if (tokensToRemove.length > 0) {
                const cleaned = tokens.filter(t => {
                    const tokenStr = typeof t === 'string' ? t : t?.token;
                    return !tokensToRemove.includes(tokenStr);
                });
                if (cleaned.length !== tokens.length) {
                    await db.collection('users').doc(userId).update({ fcmTokens: cleaned });
                }
            }
        } else {
            console.log(`[notifyUser] No FCM tokens found for user ${userId}`);
        }
    } catch (err) {
        console.error(`[notifyUser] Failed notifying user ${userId}:`, err);
    }
}

exports.onBookingStatusChange = functions.firestore
    .document('users/{userId}/bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        try {
            const before = change.before.data();
            const after = change.after.data();
            const { bookingId } = context.params;

            // Detect user document resubmission
            const isDocResubmission = (before.status === 'reservation-rejected' && after.status === 'for-reservation') ||
                (after.status === 'for-reservation' && JSON.stringify(before.documents || []) !== JSON.stringify(after.documents || []));

            // Detect user payment submission (uploading manual QR / receipt proof)
            const isPaymentSubmitted = (
                after.paymentVerificationStatus === 'pending_verification' &&
                before.paymentVerificationStatus !== 'pending_verification'
            ) || (
                    (after.payment?.length || 0) > (before.payment?.length || 0) &&
                    after.payment?.some(p => (p.gateway === 'manual_qr' || p.receiptUrl) && p.status === 'pending') &&
                    !before.payment?.some(p => (p.gateway === 'manual_qr' || p.receiptUrl) && p.status === 'pending')
                );

            if (before.status === after.status && !isDocResubmission && !isPaymentSubmitted) return;

            const { userId } = context.params;

            const userDoc = await admin.firestore()
                .collection('users')
                .doc(userId)
                .get();

            const data = after;

            const trailName = data.trail?.name || 'your trail';
            const businessName = data.business?.name || 'the organizer';
            const businessId = data.business?.id;

            // 1. If documents were resubmitted, alert the business admins
            if (isDocResubmission && businessId) {
                const hikerName = data.user?.firstname || userDoc.data()?.firstname || 'A hiker';
                await notifyBusinessAdmins(admin.firestore(), businessId, {
                    title: `Requirements Resubmitted - ${trailName}`,
                    body: `${hikerName} has resubmitted their booking documents for review.`,
                    inAppTitle: `Requirements Resubmitted`,
                    inAppMessage: `${hikerName} has resubmitted requirements for ${trailName}. Please review.`,
                    type: 'document_resubmission',
                    metadata: {
                        bookingId,
                        userId,
                        trailName,
                    },
                    data: {
                        bookingId,
                        userId,
                    }
                });
            }

            // 2. If user uploaded and submitted payment records, alert the business admins (Case 4 - no amounts)
            if (isPaymentSubmitted && businessId) {
                const hikerName = data.user?.firstname || userDoc.data()?.firstname || 'A hiker';
                const latestPayment = (data.payment || []).slice(-1)[0] || {};
                await notifyBusinessAdmins(admin.firestore(), businessId, {
                    title: `Payment Submitted - ${trailName}`,
                    body: `${hikerName} has submitted payment proof for ${trailName}. Please verify.`,
                    inAppTitle: `Payment Awaiting Verification`,
                    inAppMessage: `${hikerName} has uploaded a payment receipt for ${trailName}. Please verify the payment.`,
                    type: 'payment_submitted',
                    metadata: {
                        bookingId,
                        userId,
                        trailName,
                        classification: latestPayment.classification || 'full',
                    },
                    data: {
                        bookingId,
                        userId,
                    }
                });
            }

            // 3. Determine tailored notification copy for the hiker
            // Note: 'for-cancellation' is handled exclusively by onCancellationDocWrite to prevent duplicates (Case 7)
            if (after.status === 'for-cancellation') {
                return;
            }

            let notifTitle = "Booking Update";
            let notifMessage = `Your booking for ${trailName} with ${businessName} has been updated to ${after.status}.`;
            let notifType = 'booking_update';

            if (isPaymentSubmitted) {
                notifTitle = "Payment Submitted for Verification";
                notifMessage = `Your payment proof for ${trailName} has been submitted to ${businessName} and is awaiting verification.`;
                notifType = 'payment_submitted_user';
            } else if (isDocResubmission) {
                notifTitle = "Requirements Resubmitted";
                notifMessage = `Your updated requirements for ${trailName} have been submitted to ${businessName} for review.`;
                notifType = 'document_resubmission_user';
            } else if (after.status === 'for-payment' || after.status === 'approved-docs') {
                notifTitle = "Reservation Approved! 🎉";
                notifMessage = `Great news! Your reservation for ${trailName} with ${businessName} has been approved. Please proceed to payment to secure your slot.`;
                notifType = 'reservation_approved';
            } else if (after.status === 'reservation-rejected') {
                notifTitle = "Reservation Not Approved";
                const reason = data.cancellationReason ? ` Reason: ${data.cancellationReason}.` : '';
                notifMessage = `Your reservation for ${trailName} was not approved.${reason} You can review and update your documents.`;
                notifType = 'reservation_rejected';
            } else if (after.status === 'cancelled') {
                const isAdminCancelled = data.cancelledBy === 'admin' || after.cancelledBy === 'admin';
                const reason = data.cancellationReason ? ` Reason: ${data.cancellationReason}.` : '';
                if (isAdminCancelled) {
                    notifTitle = "Hike Cancelled by Organizer";
                    notifMessage = `Your hike for ${trailName} was cancelled by ${businessName}.${reason} Go to your booking to choose between a refund or reschedule options.`;
                    notifType = 'admin_cancellation';
                } else {
                    notifTitle = "Booking Cancelled";
                    notifMessage = `Your booking for ${trailName} with ${businessName} has been cancelled.${reason}`;
                    notifType = 'booking_cancelled';
                }
            } else if (after.status === 'paid' || after.status === 'downpayment') {
                const isFull = after.status === 'paid';
                notifTitle = isFull ? "Payment Verified! 🎉" : "Downpayment Verified";
                notifMessage = isFull
                    ? `Your payment for ${trailName} has been verified in full. You are ready to hike!`
                    : `Your downpayment for ${trailName} has been verified. Remaining balance can be settled before or on the hike date.`;
                notifType = 'payment_verified';
            } else if (after.status === 'refunded') {
                notifTitle = "Booking Refunded";
                notifMessage = `Your booking for ${trailName} with ${businessName} has been refunded.`;
                notifType = 'booking_refunded';
            }

            // 4. In-app & Push notification for the hiker via notifyUser
            await notifyUser(admin.firestore(), userId, {
                title: notifTitle,
                body: notifMessage,
                inAppTitle: notifTitle,
                inAppMessage: notifMessage,
                type: notifType,
                docId: `${after.status}_${bookingId}`,
                metadata: {
                    bookingId,
                    status: after.status,
                    trailName,
                    businessName,
                    ...(data.cancellationReason ? { reason: data.cancellationReason } : {}),
                },
                data: {
                    bookingId: String(bookingId),
                    status: String(after.status),
                }
            });

            if (after.status === 'for-payment') {
                if (!data.offer || !data.offer.date) {
                    console.log('Booking missing offer date, skipping token cleanup');
                    throw new HttpsError('invalid-argument', 'Booking missing offer date, skipping token cleanup');
                }

                const jsDate = data.offer.date.toDate();
                const bookingDate = DateTime.fromJSDate(jsDate);
                const reminderDateWeek = bookingDate.minus({ days: 7 });
                const reminderDateDay = bookingDate.minus({ days: 1 });

                const project = JSON.parse(process.env.FIREBASE_CONFIG).projectId;
                const location = 'us-central1';
                const queue = 'booking-reminders';
                const queuePath = getTasksClient().queuePath(project, location, queue);

                const url = `https://${location}-${project}.cloudfunctions.net/sendUserReminder`;

                const reminderDate = bookingDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);

                const payload = {
                    userId,
                    reminderDate,
                    bookingId,
                    trailName
                }

                if (reminderDateWeek > DateTime.now()) {
                    const weekTask = {
                        httpRequest: {
                            httpMethod: 'POST',
                            url,
                            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
                            headers: { 'Content-Type': 'application/json' },
                        },
                        scheduleTime: {
                            seconds: Math.floor(reminderDateWeek.toSeconds()),
                        },
                    };
                    await getTasksClient().createTask({ parent: queuePath, task: weekTask });
                }

                if (reminderDateDay > DateTime.now()) {
                    const dayTask = {
                        httpRequest: {
                            httpMethod: 'POST',
                            url,
                            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
                            headers: { 'Content-Type': 'application/json' },
                        },
                        scheduleTime: {
                            seconds: Math.floor(reminderDateDay.toSeconds()),
                        },
                    };
                    await getTasksClient().createTask({ parent: queuePath, task: dayTask });
                }
            }
        } catch (error) {
            throw new HttpsError('internal', 'Error processing booking update: ' + error.message);
        }
    }
    );

/**
 * Triggered whenever a cancellation request document is created under
 * /businesses/{businessId}/cancellations/{cancellationId}.
 * Ensures business admins receive push + in-app notifications and confirms to the user.
 */
exports.onNewCancellationRequest = functions.firestore
    .document('businesses/{businessId}/cancellations/{cancellationId}')
    .onWrite(async (change, context) => {
        try {
            if (!change.after.exists) return; // Deleted document

            const data = change.after.data();
            if (!data) return;

            const { businessId, cancellationId } = context.params;
            const db = admin.firestore();
            const { userId, bookingId, reason } = data;

            const isNewDoc = !change.before.exists;
            const before = change.before.exists ? change.before.data() : null;

            // Fetch business and hiker details
            const bizDoc = await db.collection('businesses').doc(businessId).get();
            const businessName = bizDoc.exists ? (bizDoc.data()?.name || 'The organizer') : 'The organizer';

            let userName = 'A hiker';
            if (userId) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data()?.firstname || userName;
                }
            }

            let trailName = 'your hike';
            if (userId && bookingId) {
                const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
                const bookingDoc = await bookingRef.get();
                if (bookingDoc.exists) {
                    trailName = bookingDoc.data()?.trail?.name || trailName;
                }
            }

            const reasonText = reason ? ` Reason: ${reason}.` : '';

            // ─────────────────────────────────────────────────────────────────
            // CASE 8A: User Appeals a Declined Cancellation Request
            // ─────────────────────────────────────────────────────────────────
            const isAppeal = before && before.status === 'rejected' && data.status === 'pending';
            if (isAppeal) {
                if (data.appealNotificationSent) {
                    console.log(`[onNewCancellationRequest] Cancellation appeal ${cancellationId} already processed, skipping.`);
                    return;
                }

                console.log(`[onNewCancellationRequest] Detected appeal for cancellation ${cancellationId} by user ${userId}`);

                const appealAdminDocId = bookingId ? `cancel_appeal_${bookingId}` : `cancel_appeal_${cancellationId}`;
                const appealUserDocId = bookingId ? `cancel_appeal_user_${bookingId}` : `cancel_appeal_user_${cancellationId}`;

                await change.after.ref.update({
                    appealNotificationSent: true,
                    appealNotifiedAt: FieldValue.serverTimestamp()
                });

                // 1. Notify Business Admins
                await notifyBusinessAdmins(db, businessId, {
                    title: `Cancellation Request Appealed - ${trailName}`,
                    body: `${userName} appealed the declined cancellation for ${trailName}.${reasonText}`,
                    inAppTitle: `Cancellation Request Appealed`,
                    inAppMessage: `${userName} has submitted an appeal for their declined cancellation on ${trailName}.${reasonText}`,
                    type: 'cancellation_appealed',
                    docId: appealAdminDocId,
                    metadata: {
                        cancellationId,
                        bookingId: bookingId || '',
                        userId: userId || '',
                        trailName,
                        reason: reason || '',
                    },
                    data: {
                        cancellationId,
                        bookingId: String(bookingId || ''),
                        userId: String(userId || ''),
                    }
                });

                // 2. In-app & Push confirmation for the hiker
                if (userId) {
                    await notifyUser(db, userId, {
                        title: "Appeal Submitted",
                        body: `Your cancellation appeal for ${trailName} has been submitted to ${businessName} for review.`,
                        inAppTitle: "Appeal Submitted",
                        inAppMessage: `Your cancellation appeal for ${trailName} has been submitted to ${businessName} for review.`,
                        type: 'cancellation_appeal_submitted',
                        docId: appealUserDocId,
                        metadata: {
                            cancellationId,
                            bookingId: bookingId || '',
                            trailName,
                            businessName,
                        },
                        data: {
                            cancellationId,
                            bookingId: String(bookingId || ''),
                        }
                    });
                }
                return;
            }

            // ─────────────────────────────────────────────────────────────────
            // CASE 1: Admin Cancels Hike / Booking -> Notify User (Case 9)
            // ─────────────────────────────────────────────────────────────────
            if (isNewDoc && data.cancelledBy === 'admin') {
                if (!userId) return;
                if (data.adminCancelNotified) {
                    console.log(`[onNewCancellationRequest] Admin cancellation ${cancellationId} already processed, skipping.`);
                    return;
                }

                await change.after.ref.update({
                    adminCancelNotified: true,
                    adminCancelNotifiedAt: FieldValue.serverTimestamp()
                });

                const notifTitle = `Hike Cancelled by Organizer`;
                const notifMessage = `Your hike for ${trailName} was cancelled by ${businessName}.${reasonText} Go to your booking to choose between a refund or reschedule options.`;
                const adminCancelDocId = bookingId ? `admin_cancel_${bookingId}` : `admin_cancel_${cancellationId}`;

                await notifyUser(db, userId, {
                    title: notifTitle,
                    body: notifMessage,
                    inAppTitle: notifTitle,
                    inAppMessage: notifMessage,
                    type: 'admin_cancellation',
                    docId: adminCancelDocId,
                    metadata: {
                        type: 'admin_cancellation',
                        cancellationId,
                        bookingId: bookingId || '',
                        businessId,
                        trailName,
                        reason: reason || '',
                    },
                    data: {
                        cancellationId: String(cancellationId),
                        bookingId: String(bookingId || ''),
                        businessId: String(businessId),
                    }
                });
                return;
            }

            // ─────────────────────────────────────────────────────────────────
            // CASE 2: User Requests Cancellation -> Notify Admins (Case 7)
            // ─────────────────────────────────────────────────────────────────
            if (isNewDoc && data.cancelledBy === 'user') {
                if (data.notificationSent) {
                    console.log(`[onNewCancellationRequest] Cancellation ${cancellationId} already processed, skipping.`);
                    return;
                }

                // Deterministic doc IDs scoped to bookingId to ensure strict idempotency
                const adminDocId = bookingId ? `cancel_req_${bookingId}` : `cancel_req_${cancellationId}`;
                const userDocId = bookingId ? `cancel_req_user_${bookingId}` : `cancel_req_user_${cancellationId}`;

                // Mark document immediately to prevent concurrent duplicate execution
                await change.after.ref.update({
                    notificationSent: true,
                    notifiedAt: FieldValue.serverTimestamp()
                });

                // Notify Business Admins
                await notifyBusinessAdmins(db, businessId, {
                    title: `Cancellation Request - ${trailName}`,
                    body: `${userName} has requested to cancel their booking for ${trailName}.${reasonText}`,
                    inAppTitle: `Cancellation Request`,
                    inAppMessage: `${userName} has requested to cancel their booking for ${trailName}.${reasonText}`,
                    type: 'cancellation_request',
                    docId: adminDocId,
                    metadata: {
                        cancellationId,
                        bookingId,
                        userId,
                        trailName,
                        cancellationReason: reason || '',
                    },
                    data: {
                        cancellationId,
                        bookingId,
                        userId,
                    }
                });

                // In-app & Push confirmation for the user
                if (userId) {
                    await notifyUser(db, userId, {
                        title: "Cancellation Request Submitted",
                        body: `Your cancellation request for ${trailName} has been submitted to ${businessName} and is awaiting review.`,
                        inAppTitle: "Cancellation Request Submitted",
                        inAppMessage: `Your cancellation request for ${trailName} has been submitted to ${businessName} and is awaiting review.`,
                        type: 'cancellation_request_submitted',
                        docId: userDocId,
                        metadata: {
                            cancellationId,
                            bookingId,
                            trailName,
                        },
                        data: {
                            cancellationId,
                            bookingId,
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[onNewCancellationRequest] Error processing cancellation request:', error);
        }
    });

exports.sendUserReminder = functions.https.onRequest(async (req, res) => {
    try {
        const { userId, bookingId, reminderDate, trailName } = req.body;

        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();

        const db = admin.firestore();

        await db
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .add({
                title: "Booking Reminder",
                message: `Hello! Your booking for ${trailName} on ${reminderDate} is quickly approaching. Be sure to have your things prepared ahead of time. Double check the weather and coordinate with your hikemates through the group chat in case of unexpected scenarios.`,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                    type: 'booking_reminder',
                    bookingId: bookingId,
                }
            });


        const tokenList = userDoc.data()?.fcmTokens || [];

        const tokens = tokenList.filter(t => t.platform === 'android' || t.platform === 'ios');

        if (!tokens.length) {
            console.log('No tokens found for user:', userId);
            res.status(200).send('No tokens to send reminder');
            return;
        }

        const response = await admin.messaging().sendEachForMulticast({
            tokens: tokens.map(t => t.token),
            notification: {
                title: "Booking Reminder",
                body: `This is a reminder of your booking for ${trailName} on ${reminderDate}. Prepare and plan ahead!`
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    icon: 'notification_icon',
                    color: '#2E7D32',
                    sound: 'default',
                }
            }
        });

        const validTokens = tokens.filter((t, i) => {
            const res = response.responses[i];
            console.log(`Token: ${t.token}, Success: ${res.success}, Error: ${res.error?.code}`);
            if (res.success) return true;

            const error = res.error?.code;

            console.log(`Error for token ${t.token}: ${error}`);
            return ![
                'messaging/registration-token-not-registered',
                'messaging/invalid-registration-token'
            ].includes(error);
        });

        if (validTokens.length !== tokens.length) {
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .update({ fcmTokens: validTokens });
        }

        res.status(200).send('Success');
    } catch (error) {
        console.error('Error in sendUserReminder: ', error);
        res.status(500).send('Internal server error');
    }
});

exports.setDefaultUserRole = functions.auth.user().onCreate(async (user) => {
    const account = await admin.auth().getUser(user.uid);

    if (account.customClaims && account.customClaims.role === 'business') {
        console.log(`Skip default role attachement for business accounts.`);
        return null;
    }

    try {
        await admin.auth().setCustomUserClaims(user.uid, { role: 'user' });
        console.log(`Default user role assigned to UID: ${user.uid}`);
    } catch (error) {
        console.error('Error setting default role: ', error);
    }

    const uid = user.uid;

    const userRef = admin.firestore().collection('users').doc(uid);

    await userRef.set({
        email: user.email ?? null,
        createdAt: FieldValue.serverTimestamp(),
        role: 'user',
    }, { merge: true });

    await userRef
        .collection('recommendations')
        .doc('init')
        .set({
            createdAt: FieldValue.serverTimestamp(),
            trails: []
        }, { merge: true });

    console.log(`User doc and recommendation collection created for: ${userRef}`);
});

exports.createAdmin = https.onCall(async (request) => {
    try {
        const { userId, businessId } = request.data;
        const caller = request.auth;
        const db = admin.firestore();

        if (!caller) throw new Error('Authentication required');

        if (!userId) throw new Error('User ID required');

        if (!businessId) throw new Error('Business ID required');

        if (caller.token.role !== 'admin' && caller.token.owner !== businessId)
            throw new Error('Permission denied, only business owners can create admin accounts');

        await admin.auth().setCustomUserClaims(userId, {
            role: 'admin',
            businessId
        });

        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new HttpsError('Not found', 'Business document does not exists');
        }

        await userRef.update({
            updatedAt: FieldValue.serverTimestamp(),
            role: 'admin',
            businessId
        })

        await db
            .collection('businesses')
            .doc(businessId)
            .collection('admins')
            .doc(userId)
            .set({
                assignedAt: FieldValue.serverTimestamp(),
                id: userId,
                firstname: doc.data().firstname,
                lastname: doc.data().lastname,
                username: doc.data().username,
                email: doc.data().email,
                businessId,
            }, { merge: true });


        console.log(`User ${doc.data().uid} made admin for ${businessId}`);
        return { user: doc.data().uid };
    } catch (error) {
        console.error('Error setting default role: ', error);
        throw new HttpsError('internal', error.message);
    }
});

exports.createBusiness = https.onCall(async (request) => {
    const { data, applicationId } = request.data;
    const auth = request.auth;

    if (!auth) throw new Error('unauthenticated: Authentication Required');
    if (auth.token.role !== 'superadmin') {
        throw new Error('permission-denied:  Only superadmins can approve applications');
    }

    const userId = data.owner?.id;
    const appId = applicationId;
    const db = admin.firestore();

    try {
        const result = await db.runTransaction(async (transaction) => {
            const busRef = db.collection('businesses').doc(userId);
            const appRef = db.collection('applications').doc(appId);
            const userRef = db.collection('users').doc(userId);

            const [, appSnap, userSnap] = await Promise.all([
                transaction.get(busRef),
                transaction.get(appRef),
                transaction.get(userRef)
            ]);

            if (appSnap.exists && appSnap.data().status === 'approved') {
                throw new Error('Application already approved');
            }
            if (!userSnap.exists) {
                throw new Error('Owner user account not found');
            }

            const userData = userSnap.data();

            transaction.set(busRef, {
                ...data,
                createdAt: Timestamp.fromDate(new Date(data.createdAt)),
                establishedOn: Timestamp.fromDate(new Date(data.establishedOn)),
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            const adminSubRef = busRef.collection('admins').doc('owner');
            transaction.set(adminSubRef, {
                assignedAt: FieldValue.serverTimestamp(),
                id: userId,
                firstname: userData.firstname || '',
                lastname: userData.lastname || '',
                username: userData.username || '',
                email: userData.email || '',
                businessId: userId,
            }, { merge: true });

            transaction.update(appRef, { status: 'approved' });

            transaction.update(userRef, { role: 'admin' });

            return data;
        });

        await admin.auth().setCustomUserClaims(userId, {
            role: 'admin',
            owner: userId
        });

        return { success: true, data: result };

    } catch (err) {
        console.error("Transaction failed: ", err);
        throw new HttpsError('internal', err.message || 'Failed to create business');
    }
});

exports.deleteUser = https.onCall(async (request) => {
    const { userId } = request.data;
    const caller = request.auth;

    if (!caller)
        throw new HttpsError('unauthenticated', 'Authentication required');

    if (caller.token.role !== 'superadmin')
        throw new HttpsError('permission-denied', 'Only superadmins can delete accounts');

    if (!userId)
        throw new HttpsError('invalid-argument', 'Invalid user ID provided');

    try {
        const user = await admin.auth().getUser(userId);
        const role = user.customClaims ? user.customClaims.role : 'user'

        if (role !== 'user') {
            throw new HttpsError(
                'failed-precondition',
                'Only user accounts are permitted to be deleted');
        }

        await admin.auth().deleteUser(userId);

        await admin.firestore().collection('users').doc(userId).delete();

        return { success: true };
    } catch (err) {
        throw new HttpsError('internal', err.message);
    }
})

exports.checkEmail = https.onCall(async (request) => {
    const { email, username } = request.data;

    if (!email.trim()) throw new HttpsError('invalid-argument', 'No email provided');

    if (!username.trim()) throw new HttpsError('invalid-argument', 'No username provided');

    const authPromise = admin.auth().getUserByEmail(email).catch(() => null);
    const firestorePromise = admin.firestore()
        .collection('users')
        .where('username', '==', username.toLowerCase())
        .limit(1)
        .get();

    const [userRecord, userQuery] = await Promise.all([authPromise, firestorePromise])

    return {
        usernameAvailable: userQuery.empty,
        emailAvailable: !userRecord
    };
})

/**
 * Email/password login with server-enforced brute-force protection.
 * Limits: 5 failures per email, 20 per IP (15 min window) -> 15 min lockout.
 * On success returns a custom token for signInWithCustomToken on the client.
 *
 * @param {Object} request.data - { email: string, password: string }
 * @returns {Promise<{ token: string }>}
 * @throws {HttpsError} invalid-argument | unauthenticated | resource-exhausted | permission-denied | internal
 */
exports.secureLogin = https.onCall((request) =>
    LoginLimiter.handleSecureLogin(request, { apiKey: authWebApiKey.value() })
);

/**
 * Maps raw PayMongo API errors to user-friendly HttpsErrors with localized messaging.
 * Handles specific gateway issues like transaction limits, system downtime, and invalid parameters.
 * 
 * @private
 * @param {Error|Object} err - The error object thrown by the PayMongo provider or axios.
 * @returns {void}
 * @throws {HttpsError} A formatted Firebase HttpsError for the client to consume.
 */
function handlePaymongoError(err) {
    const rawMessage = err.message || String(err);

    // 1. Handle HTTP Auth/Security Failures (401, 403)
    if (rawMessage.includes('Unauthorized') || rawMessage.includes('401') || rawMessage.includes('403')) {
        throw new HttpsError('unavailable', 'Payment service is currently unavailable. Please notify the Thrail administrators.');
    }

    // 2. Parse JSON error details from PayMongo
    const paymongoMarker = 'PayMongo Checkout Error:';
    if (rawMessage.includes(paymongoMarker)) {
        const jsonStr = rawMessage.substring(rawMessage.indexOf(paymongoMarker) + paymongoMarker.length).trim();

        let errorBody;
        try {
            errorBody = JSON.parse(jsonStr);
        } catch (_e) {
            // Check for HTML/Network level errors (503, 500, 502)
            if (jsonStr.includes('503') || jsonStr.includes('500') || jsonStr.includes('<html>')) {
                throw new HttpsError('unavailable', 'GCash/Maya is currently experiencing temporary system downtime. Please try again in a few minutes.');
            }
            throw new HttpsError('internal', 'An unexpected error occurred with the payment gateway.');
        }

        const errors = errorBody.errors || [];
        const mainError = errors[0] || {};

        const code = mainError.code;
        const detail = mainError.detail;
        const pointer = mainError.source?.pointer || '';

        // Transaction Limits (100k PHP)
        if (code === 'AMOUNT_EXCEED_LIMIT' || pointer.includes('amount') && detail?.toLowerCase().includes('maximum')) {
            throw new HttpsError('invalid-argument', 'This booking exceeds the ₱100,000 maximum transaction limit for GCash/Maya. Please use a different payment method or pay in installments.');
        }

        // Minimum Amount (100 PHP)
        if (pointer.includes('amount') && (detail?.includes('10000') || detail?.toLowerCase().includes('at least'))) {
            throw new HttpsError('invalid-argument', 'The booking amount (or 50% downpayment) is too small. The minimum payment required by GCash/Maya is ₱100.');
        }

        // Invalid Return URL (Deep Link)
        if (pointer.includes('return_url') || code === 'parameter_format_invalid' || code === 'parameter_invalid' && pointer.includes('url')) {
            throw new HttpsError('invalid-argument', 'An internal routing error occurred while generating your booking checkout. Please try again.');
        }

        // PayMongo System Downtime
        if (code === 'SYSTEM_ERROR' || code === 'service_unavailable') {
            throw new HttpsError('unavailable', 'GCash/Maya is currently experiencing temporary system downtime. Please try again in a few minutes.');
        }

        // Fallback to specific detail if available
        if (detail) {
            throw new HttpsError('internal', detail);
        }
    }

    // 3. Global Generic Fallback
    throw new HttpsError('internal', 'An unexpected error occurred with the payment gateway.');
}

/**
 * Creates a PayMongo Checkout Session for a new or existing booking.
 * Generates a secure PayMongo-hosted payment page URL for GCash or Maya transactions.
 * Automatically handles installment/downpayment logic by charging the requested 'amount'.
 * 
 * @async
 * @function createPaymongoCheckout
 * @param {Object} request - The callable request object.
 * @param {Object} request.data - Input parameters from the client.
 * @param {number} request.data.amount - The exact amount to charge in PHP (e.g., 1499.50).
 * @param {string} request.data.type - Payment method (e.g., 'gcash', 'maya').
 * @param {string} request.data.returnUrl - App deep link to return to after payment success/fail.
 * @param {string} request.data.bookingId - The target Firestore booking ID.
 * @param {string} request.data.userId - The ID of the customer owning the booking.
 * @param {Object} request.auth - Firebase Authentication context.
 * @returns {Promise<Object>} Success receipt containing sessionId and checkout_url.
 * @throws {HttpsError} 401 if unauthenticated, 400 if arguments missing, or gateway error mapping.
 */
exports.createPaymongoCheckout = https.onCall({ secrets: [paymongoSecret] }, async (request) => {
    const { amount, type, returnUrl, bookingId, userId } = request.data;

    const targetUserId = userId || request.auth?.uid;
    console.log(`[createPaymongoCheckout] Initiating checkout for user ${targetUserId}, booking ${bookingId}`);

    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication Required');
    if (!amount || !type || !bookingId) throw new HttpsError('invalid-argument', 'Amount, type, and bookingId are required');

    const PAYMONGO_SECRET_KEY = paymongoSecret.value();
    if (!PAYMONGO_SECRET_KEY) {
        throw new HttpsError('internal', 'Server configuration error: PayMongo Secret Key missing.');
    }

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(targetUserId).collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    let customerInfo = null;
    let existingBookingData = null;
    if (bookingDoc.exists) {
        existingBookingData = bookingDoc.data();
        const userObj = existingBookingData?.user || {};
        const fullName = [userObj.firstname || userObj.firstName || '', userObj.lastname || userObj.lastName || ''].filter(Boolean).join(' ') || userObj.name || userObj.displayName || '';
        customerInfo = {
            name: fullName.trim(),
            email: (userObj.email || '').trim(),
            phone: (userObj.phone || userObj.phoneNumber || '').trim()
        };
    }

    // Fallback: Query user profile doc if email or phone is missing
    if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
        try {
            const userProfileDoc = await db.collection('users').doc(targetUserId).get();
            if (userProfileDoc.exists) {
                const uData = userProfileDoc.data();
                const uFullName = [uData?.firstname || uData?.firstName || '', uData?.lastname || uData?.lastName || ''].filter(Boolean).join(' ') || uData?.name || uData?.displayName || '';
                customerInfo = {
                    name: customerInfo?.name || uFullName.trim(),
                    email: customerInfo?.email || (uData?.email || '').trim(),
                    phone: customerInfo?.phone || (uData?.phone || uData?.phoneNumber || '').trim()
                };
            }
        } catch (uErr) {
            console.warn('[createPaymongoCheckout] Could not fetch user profile for billing info:', uErr.message);
        }
    }

    // Initialize provider and register to manager
    const paymongoProvider = new PayMongoProvider(PAYMONGO_SECRET_KEY);
    PaymentManager.registerProvider('paymongo', paymongoProvider);

    const redirectUrl = returnUrl || 'thrailapp://';

    try {
        const session = await PaymentManager.getProvider('paymongo').createCheckout(
            amount,
            type,
            redirectUrl,
            { bookingId, userId: targetUserId },
            customerInfo
        );

        // Clean up older pending sessions to 'abandoned'
        const currentPayments = existingBookingData?.payment || [];
        const updatedPayments = currentPayments.map(p => {
            if (p.status === 'pending') {
                return { ...p, status: 'abandoned' };
            }
            return p;
        });

        const channelMethod = type === 'paymaya' ? 'maya' : type;
        const newPaymentRecord = {
            gateway: 'paymongo',
            method: channelMethod,
            sessionId: session.id,
            referenceCode: null,
            status: 'pending',
            amount: amount,
            createdAt: Timestamp.fromDate(new Date(session.createdAt * 1000))
        };
        updatedPayments.push(newPaymentRecord);

        // Update booking with payment records and paymentIntentIds array
        const updateBookingData = {
            payment: updatedPayments,
            paymentIntentId: session.paymentIntentId,
            paymentIntentIds: admin.firestore.FieldValue.arrayUnion(session.paymentIntentId),
            updatedAt: FieldValue.serverTimestamp()
        };
        await bookingRef.update(updateBookingData);

        const response = {
            gateway: 'paymongo',
            method: channelMethod,
            sessionId: session.id,
            referenceCode: null,
            status: 'pending',
            amount: amount,
            createdAt: Timestamp.fromDate(new Date(session.createdAt * 1000)),
            // Included so the frontend can redirect the user
            checkout_url: session.checkout_url
        };

        console.log(`[createPaymongoCheckout] Successfully created session ${session.id} for booking ${bookingId}`);
        return response;
    } catch (err) {
        console.error(`[createPaymongoCheckout] Failed to initialize checkout for booking ${bookingId}: `, err);
        handlePaymongoError(err);
    }
});

/**
 * HTML Proxy to bypass mobile WebView security restrictions (CORS/Deep-linking).
 * Helps transition users from a browser-based PayMongo success page back into the Thrail app.
 * Uses an HTML meta-refresh and JS location change to ensure the app scheme is invoked.
 * 
 * @function paymongoRedirect
 * @param {Object} req - HTTP Request.
 * @param {string} req.query.url - The destination app deep link (e.g., thrailapp://payment-result).
 * @param {Object} res - HTTP Response.
 * @returns {void}
 */
exports.paymongoRedirect = functions.https.onRequest((req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        console.warn('[paymongoRedirect] Missing target URL parameter.');
        res.status(400).send("Missing URL parameter");
        return;
    }
    console.log(`[paymongoRedirect] Generating proxy HTML for redirect to: ${targetUrl}`);

    // If opened via window.open on web, notify parent opener, redirect opener, and close popup.
    // For mobile native WebBrowser, window.opener is absent; redirects via deep link scheme.
    const safeTargetJson = JSON.stringify(targetUrl);
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Payment Complete</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding-top: 60px; color: #1e293b;">
            <div style="max-width: 400px; margin: 0 auto; padding: 20px;">
                <h3 style="margin-bottom: 8px;">Payment Successful</h3>
                <p style="color: #64748b; font-size: 14px;">Returning to your application...</p>
            </div>
            <script>
                (function() {
                    var target = ${safeTargetJson};
                    try {
                        if (window.opener && !window.opener.closed) {
                            try {
                                window.opener.postMessage({ type: 'PAYMONGO_PAYMENT_SUCCESS', url: target }, '*');
                            } catch (e) {}
                            try {
                                window.opener.location.href = target;
                            } catch (e) {}
                            setTimeout(function() {
                                window.close();
                            }, 300);
                            return;
                        }
                    } catch (err) {
                        console.warn('[paymongoRedirect] Opener communication error:', err);
                    }
                    window.location.href = target;
                })();
            </script>
        </body>
        </html>
    `;
    res.status(200).send(html);
});

/**
 * Public Webhook endpoint to receive real-time payment status updates from PayMongo.
 * 1. Verifies the request signature using the Webhook Secret for security.
 * 2. Matches the payment to a booking via paymentIntentId.
 * 3. Updates payment status to 'captured' and determines if booking is 'paid' or 'downpayment'.
 * 4. Generates a permanent transaction receipt and handles auto-refunds for cancelled bookings.
 * 
 * @function paymentWebhook
 * @param {Object} req - HTTP Request with PayMongo JSON payload.
 * @param {Object} res - HTTP Response.
 * @returns {Promise<void>}
 */
exports.paymentWebhook = https.onRequest({ secrets: [paymongoSecret, paymongoWebhookSecret] }, async (req, res) => {
    console.log('[paymentWebhook] Received incoming webhook call');
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const PAYMONGO_SECRET_KEY = paymongoSecret.value();
    const WEBHOOK_SECRET = paymongoWebhookSecret.value();

    const provider = new PayMongoProvider(PAYMONGO_SECRET_KEY, WEBHOOK_SECRET);
    const signature = req.headers['paymongo-signature'];

    if (WEBHOOK_SECRET && signature) {
        const isValid = provider.verifyWebhookSignature(req.rawBody, signature);
        if (!isValid) {
            console.error('[paymentWebhook] Security Alert: Invalid webhook signature detected.');
            return res.status(400).send('Invalid Signature');
        }
    } else {
        console.warn('[paymentWebhook] Processing webhook without secret/signature verification.');
    }

    const event = req.body;
    const eventType = event?.data?.attributes?.type;
    console.log(`[paymentWebhook] Received PayMongo webhook event: ${eventType}`);

    if (eventType === 'checkout_session.payment.paid' || eventType === 'payment.paid') {
        let gatewayId;
        let referenceCode;
        let baseAmount = 0;
        let paymentIntentId = null;
        let sessionId = null;
        let bookingId = null;
        let userId = null;
        let rawMethod = null;

        if (eventType === 'checkout_session.payment.paid') {
            const sessionData = event.data.attributes.data;
            const sessionAttrs = sessionData.attributes || {};
            sessionId = sessionData.id;
            bookingId = sessionAttrs.reference_number || sessionAttrs.metadata?.bookingId;
            userId = sessionAttrs.metadata?.userId;

            const paymentObj = sessionAttrs.payments?.[0];
            const paymentAttrs = paymentObj?.attributes || {};
            gatewayId = paymentObj?.id;
            referenceCode = gatewayId || paymentAttrs.balance_transaction_id;

            // Payment amount in PHP
            baseAmount = (sessionAttrs.line_items?.[0]?.amount || paymentAttrs.amount || 0) / 100;

            paymentIntentId = sessionAttrs.payment_intent?.id || paymentAttrs.payment_intent_id || null;
            rawMethod = paymentAttrs.source?.type || paymentAttrs.payment_method_type || sessionAttrs.payment_method_types?.[0];
        } else {
            // eventType === 'payment.paid'
            const paymentData = event.data.attributes.data.attributes || {};
            gatewayId = event.data.attributes.data.id;
            referenceCode = gatewayId || paymentData.balance_transaction_id;
            baseAmount = (paymentData.amount || 0) / 100;

            paymentIntentId = paymentData.payment_intent_id || null;
            bookingId = paymentData.metadata?.bookingId || null;
            userId = paymentData.metadata?.userId || null;
            rawMethod = paymentData.source?.type || paymentData.payment_method_type;
        }

        console.log(`[paymentWebhook] Extracted payment details: gatewayId=${gatewayId}, amount=${baseAmount}, bookingId=${bookingId}, userId=${userId}, sessionId=${sessionId}, paymentIntentId=${paymentIntentId}`);

        const db = admin.firestore();
        let bookingDoc = null;

        // Strategy 1: Direct Doc lookup via metadata { userId, bookingId } (O(1) direct document access)
        if (userId && bookingId) {
            try {
                const directRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
                const directSnap = await directRef.get();
                if (directSnap.exists) {
                    bookingDoc = directSnap;
                    console.log(`[paymentWebhook] Matched booking via direct metadata path: users/${userId}/bookings/${bookingId}`);
                }
            } catch (err) {
                console.warn(`[paymentWebhook] Direct metadata lookup error:`, err.message);
            }
        }

        // Strategy 2: Lookup by paymentIntentId (standard v1 checkout)
        if (!bookingDoc && paymentIntentId) {
            let snap = await db.collectionGroup('bookings').where('paymentIntentId', '==', paymentIntentId).get();
            if (snap.empty) {
                snap = await db.collectionGroup('bookings').where('paymentIntentIds', 'array-contains', paymentIntentId).get();
            }
            if (!snap.empty) {
                bookingDoc = snap.docs[0];
                console.log(`[paymentWebhook] Matched booking via paymentIntentId query: ${paymentIntentId}`);
            }
        }

        // Strategy 4: Fallback scan of pending/downpayment bookings by sessionId inside payment[] array
        if (!bookingDoc && sessionId) {
            const pendingSnaps = await db.collectionGroup('bookings').where('status', 'in', ['pending', 'downpayment']).get();
            for (const doc of pendingSnaps.docs) {
                const docPayments = doc.data()?.payment || [];
                if (docPayments.some(p => p.sessionId === sessionId)) {
                    bookingDoc = doc;
                    console.log(`[paymentWebhook] Matched booking via deep payment[].sessionId scan: ${doc.id}`);
                    break;
                }
            }
        }

        // Strategy 5: Fallback scan by bookingId document ID
        if (!bookingDoc && bookingId) {
            const pendingSnaps = await db.collectionGroup('bookings').where('status', 'in', ['pending', 'downpayment']).get();
            for (const doc of pendingSnaps.docs) {
                if (doc.id === bookingId) {
                    bookingDoc = doc;
                    console.log(`[paymentWebhook] Matched booking via documentId fallback: ${doc.id}`);
                    break;
                }
            }
        }

        if (!bookingDoc) {
            console.error(`[paymentWebhook] Unable to match booking for gatewayId: ${gatewayId}, sessionId: ${sessionId}, paymentIntentId: ${paymentIntentId}, bookingId: ${bookingId}`);
            return res.status(200).send('Booking Not Found (Logged for Investigation)');
        }

        const bookingData = bookingDoc.data();
        console.log(`[paymentWebhook] Found matching booking: ${bookingDoc.id} with status: ${bookingData.status}`);

        const payments = bookingData.payment || [];

        // Idempotency guard: prevent duplicate captured payments if webhook is retried
        if (payments.some(p => p.gatewayId === gatewayId && p.status === 'captured')) {
            console.log(`[paymentWebhook] Payment ${gatewayId} already captured for booking ${bookingDoc.id}. Skipping duplicate webhook.`);
            return res.status(200).send('Already Processed');
        }

        const pendingIdx = payments.findLastIndex(p => p.status === 'pending');
        const existingSessionId = (pendingIdx >= 0 && payments[pendingIdx].sessionId) ? payments[pendingIdx].sessionId : sessionId;
        const method = rawMethod === 'paymaya' ? 'maya' : (rawMethod || (pendingIdx >= 0 ? payments[pendingIdx].method : 'gcash'));

        // Ensure amount strictly reflects the pending booking installment if already recorded
        const finalAmount = (pendingIdx >= 0 && payments[pendingIdx].amount && payments[pendingIdx].amount > 0)
            ? payments[pendingIdx].amount
            : baseAmount;

        if (bookingData.status !== 'cancelled') {
            // 10 days before hike for refund policy
            const refundableUntil = new Date(bookingData.offer.date.toDate());
            refundableUntil.setDate(refundableUntil.getDate() - 10);

            const capturedPayment = {
                gateway: 'paymongo',
                gatewayId: gatewayId,
                method: method,
                sessionId: existingSessionId,
                referenceCode: referenceCode,
                status: 'captured',
                refundableUntil: Timestamp.fromDate(refundableUntil),
                amount: finalAmount,
                createdAt: pendingIdx >= 0 && payments[pendingIdx].createdAt ? payments[pendingIdx].createdAt : Timestamp.now(),
                capturedAt: Timestamp.now()
            };

            if (pendingIdx >= 0) {
                payments[pendingIdx] = capturedPayment;
            } else {
                payments.push(capturedPayment);
            }

            // Determine the new booking status based on total paid vs offer price
            const totalPaid = payments.reduce((sum, p) => {
                if (p.status === 'captured') {
                    return sum + (p.amount || 0);
                }
                return sum;
            }, 0);
            const offerPrice = bookingData.offer?.price || 0;
            const newBookingStatus = totalPaid >= (offerPrice - 0.01) ? 'paid' : 'downpayment';

            const updateBookingPayload = {
                payment: payments,
                status: newBookingStatus,
                updatedAt: FieldValue.serverTimestamp()
            };
            if (paymentIntentId) {
                updateBookingPayload.paymentIntentId = paymentIntentId;
                updateBookingPayload.paymentIntentIds = admin.firestore.FieldValue.arrayUnion(paymentIntentId);
            }

            await bookingDoc.ref.update(updateBookingPayload);

            // Create Payment Receipt Record in global /payments collection
            await db.collection('payments').add({
                bookingId: bookingDoc.id,
                gatewayId: gatewayId,
                gateway: 'paymongo',
                method: method,
                status: 'captured',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                receipt: {
                    amount: finalAmount,
                    date: FieldValue.serverTimestamp(),
                    gateway: 'paymongo',
                    referenceCode: referenceCode
                },
                offer: bookingData.offer,
                business: bookingData.business,
                user: bookingData.user
            });

            console.log(`[paymentWebhook] Successfully captured payment and generated receipt for booking ${bookingDoc.id}`);

            // Alert business admins of confirmed online payment and secured slot
            const businessId = bookingData.business?.id;
            const trailName = bookingData.offer?.trail?.name || bookingData.trail?.name || 'a trail';
            const hikerName = bookingData.user?.firstname || 'A hiker';
            const classificationText = newBookingStatus === 'paid' ? 'Full Payment' : 'Downpayment';
            if (businessId) {
                await notifyBusinessAdmins(db, businessId, {
                    title: `Online Payment Received - ${trailName}`,
                    body: `${hikerName} paid ₱${Number(finalAmount).toLocaleString()} (${classificationText}) via ${(method || 'PayMongo').toUpperCase()}.`,
                    inAppTitle: `Online Payment Received`,
                    inAppMessage: `${hikerName} paid ₱${Number(finalAmount).toLocaleString()} (${classificationText}) via ${(method || 'PayMongo').toUpperCase()} for ${trailName}. Slot confirmed.`,
                    type: 'payment_received_admin',
                    metadata: {
                        bookingId: bookingDoc.id,
                        userId: bookingData.user?.id || userId,
                        amount: finalAmount,
                        gateway: 'paymongo',
                        method: method || '',
                    },
                    data: {
                        bookingId: bookingDoc.id,
                        userId: bookingData.user?.id || userId,
                    }
                });
            }
        } else {
            // Booking was already cancelled, issue automatic refund!
            try {
                await provider.issueRefund(gatewayId, finalAmount, 'others', 'Auto-refund for cancelled booking');
                console.log(`Auto-refunded late payment for cancelled booking: ${bookingDoc.id}`);
            } catch (e) {
                console.error("Failed to auto-refund cancelled booking", e);
            }
        }
    }

    res.status(200).send('Webhook Received');
});

/**
 * Handles the cancellation of a booking BEFORE any payment is captured.
 * Fails 'pending' payment sessions and updates the booking status to 'cancelled'.
 * If the booking already has a 'captured' payment, it forces the user to use refundBooking instead.
 * 
 * @async
 * @function cancelBooking
 * @param {Object} request - The callable request object.
 * @param {Object} request.data - Input parameters.
 * @param {string} request.data.bookingId - ID of booking to cancel.
 * @param {string} request.data.userId - ID of the booking owner.
 * @param {string} [request.data.reason] - Optional explanation for the cancellation.
 * @returns {Promise<Object>} Object with { success: true }.
 * @throws {HttpsError} 403 if unauthorized, 400 if payment is already captured.
 */
exports.cancelBooking = https.onCall(async (request) => {
    const { bookingId, userId, reason } = request.data;
    const caller = request.auth;

    console.log(`[cancelBooking] Cancellation requested for booking ${bookingId} by user ${caller?.uid}`);

    if (!caller) throw new HttpsError('unauthenticated', 'Auth required');
    if (caller.uid !== userId && caller.token.role !== 'admin') {
        console.warn(`[cancelBooking] Unauthorized cancellation attempt by ${caller.uid}`);
        throw new HttpsError('permission-denied', 'Not authorized to cancel this booking');
    }

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) throw new HttpsError('not-found', 'Booking not found');
    const data = bookingDoc.data();

    if (data.status === 'cancelled') return { success: true, message: 'Already cancelled' };

    // Only allow pre-payment cancellation
    const payments = data.payment || [];
    const hasCaptured = payments.some(p => p.status === 'captured');

    if (hasCaptured || data.status === 'paid') {
        throw new HttpsError('failed-precondition', 'Payment already completed. Please request a refund instead.');
    }

    const updatedPayments = payments.map(p => p.status === 'pending' ? { ...p, status: 'failed' } : p);

    const batch = db.batch();
    batch.update(bookingRef, {
        status: 'cancelled',
        payment: updatedPayments,
        cancellationReason: reason || 'User initiated cancellation',
        cancelledBy: caller.uid,
        updatedAt: FieldValue.serverTimestamp()
    });

    // Release Offer Slot if the booking had reserved a slot (e.g. for-payment)
    const offerId = data.offer?.id;
    const businessId = data.business?.id;
    if (offerId && businessId && data.status === 'for-payment') {
        try {
            const offerRef = db.collection('businesses').doc(businessId).collection('offers').doc(offerId);
            const offerSnap = await offerRef.get();
            if (offerSnap.exists && (offerSnap.data()?.reservedPax || 0) > 0) {
                batch.update(offerRef, {
                    reservedPax: admin.firestore.FieldValue.increment(-1),
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
        } catch (offerErr) {
            console.warn(`[cancelBooking] Could not release offer slot:`, offerErr.message);
        }
    }

    // Remove user from Group Chat
    if (offerId) {
        try {
            const groupRef = db.collection('groups').doc(offerId);
            const groupSnap = await groupRef.get();
            if (groupSnap.exists) {
                const groupData = groupSnap.data();
                const updatedMembers = (groupData.members || []).filter(m => m.id !== userId);
                batch.update(groupRef, {
                    participantsIds: admin.firestore.FieldValue.arrayRemove(userId),
                    members: updatedMembers,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
        } catch (groupErr) {
            console.warn(`[cancelBooking] Could not remove member from group chat:`, groupErr.message);
        }
    }

    await batch.commit();

    console.log(`[cancelBooking] Successfully cancelled booking ${bookingId}`);
    return { success: true };
});

/**
 * Processes PayMongo refunds for captured payments (10% partial or 100% full).
 * Logic:
 * - Customers: Restricted to 10% partial refund and a 10-day pre-hike timeframe.
 * - Admins: Can trigger 10% or 100% refunds at any time (bypasses timeframe check).
 * Automatically updates booking status to 'cancelled' and payment status to 'refunded'.
 * 
 * @async
 * @function refundBooking
 * @param {Object} request - The callable request object.
 * @param {Object} request.data - Input parameters.
 * @param {string} request.data.bookingId - ID of booking to refund.
 * @param {string} request.data.userId - ID of the customer owning the booking.
 * @param {string} [request.data.reason] - Valid PayMongo reason ('requested_by_customer', etc).
 * @param {string|number} [request.data.refundPercentage] - Admin only: 'full' (100%) or 'partial' (10%).
 * @returns {Promise<Object>} Success message and gateway transaction ID.
 * @throws {HttpsError} 403 if unauthorized, 400 if timeframe expired or gateway error.
 */
exports.refundBooking = https.onCall({ secrets: [paymongoSecret] }, async (request) => {
    const { bookingId, userId, reason, refundPercentage, customAmount } = request.data;
    const caller = request.auth;

    console.log(`[refundBooking] Refund requested for booking ${bookingId} by user ${caller?.uid}`);

    if (!caller) throw new HttpsError('unauthenticated', 'Auth required');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) throw new HttpsError('not-found', 'Booking not found');
    const data = bookingDoc.data();

    const payments = data.payment || [];

    // Concurrency Check: Ensure no refund is already in-flight
    if (payments.some(p => p.status === 'processing_refund')) {
        throw new HttpsError('failed-precondition', 'A refund is already in progress for this booking. Please wait.');
    }

    // Phase 1 / T1.1: Multi-Payment Iteration - Collect all captured payments
    const capturedPayments = payments.filter(p => p.status === 'captured');

    if (capturedPayments.length === 0) {
        if (payments.some(p => p.status === 'refunded')) {
            throw new HttpsError('failed-precondition', 'This booking has already been refunded.');
        }
        throw new HttpsError('failed-precondition', 'Cannot refund a booking that has no captured payments.');
    }

    // Dual-System Authorization Check
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && adminBusinessId === data.business?.id;
    const isSuperAdmin = caller.token.role === 'superadmin';
    const isOwner = caller.uid === data.user?.id;

    if (!isAdmin && !isSuperAdmin && !isOwner) {
        throw new HttpsError('permission-denied', 'Not authorized to refund this booking.');
    }

    // Custom amount privilege guard: strictly admin/superadmin only
    if (customAmount !== undefined && customAmount !== null && !isAdmin && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only admins can set a custom refund amount.');
    }

    // User-triggered timeframe check: check against latest payment's refundable deadline
    if (isOwner && !isAdmin && !isSuperAdmin) {
        const now = Timestamp.now().toDate();
        const latestCaptured = capturedPayments[capturedPayments.length - 1];
        const refundableUntil = latestCaptured.refundableUntil ? latestCaptured.refundableUntil.toDate() : new Date(0);

        if (now > refundableUntil) {
            throw new HttpsError('failed-precondition', 'The automated refund timeframe has expired. Please contact the organizer.');
        }
    }

    // Phase 1 / T1.2: Aggregate Bounds Checking across ALL captured installments
    const totalCapturedAmount = capturedPayments.reduce((sum, p) => {
        const available = (p.amount || 0) - (p.refundedAmount || 0);
        return sum + Math.max(0, available);
    }, 0);

    if (totalCapturedAmount <= 0) {
        throw new HttpsError('failed-precondition', 'All captured payments for this booking have already been fully refunded.');
    }

    // Calculate Refund Amount
    let refundAmount;
    let refundLabel;

    if ((isAdmin || isSuperAdmin) && typeof customAmount === 'number' && !isNaN(customAmount) && customAmount > 0) {
        const parsedCustom = Math.round(customAmount * 100) / 100;
        if (parsedCustom < 1.00) {
            throw new HttpsError('invalid-argument', 'Minimum refund amount is ₱1.00.');
        }
        if (parsedCustom > totalCapturedAmount) {
            throw new HttpsError('invalid-argument', `Custom refund amount (₱${parsedCustom.toFixed(2)}) cannot exceed total refundable amount (₱${totalCapturedAmount.toFixed(2)}).`);
        }
        refundAmount = parsedCustom;
        const pct = Math.round((refundAmount / totalCapturedAmount) * 100);
        refundLabel = `₱${refundAmount.toFixed(2)} (${pct}%)`;
    } else {
        let multiplier = 0.10; // Normal users are strictly limited to 10%
        if (isAdmin || isSuperAdmin) {
            if (refundPercentage === 'none' || refundPercentage === 0 || refundPercentage === '0') {
                throw new HttpsError('invalid-argument', 'Cannot process a refund of 0%. Use cancellation approval without refund.');
            } else if (refundPercentage === 'full' || refundPercentage === 1 || refundPercentage === 100) {
                multiplier = 1.0;
            } else if (refundPercentage === 'partial' || refundPercentage === 0.1 || refundPercentage === 10) {
                multiplier = 0.10;
            }
        }
        refundAmount = Math.round((totalCapturedAmount * multiplier) * 100) / 100;
        refundLabel = multiplier === 1.0 ? '100%' : '10%';
    }

    // Acquire In-Flight Distributed Lock to prevent duplicate charge calls
    capturedPayments.forEach(p => {
        p.status = 'processing_refund';
    });
    await bookingRef.update({
        payment: payments.map(p => ({ ...p })),
        updatedAt: FieldValue.serverTimestamp()
    });

    // Execute Refund via PaymentManager
    const PAYMONGO_SECRET_KEY = paymongoSecret.value();
    const provider = new PayMongoProvider(PAYMONGO_SECRET_KEY);
    PaymentManager.registerProvider('paymongo', provider);

    const validReasons = ['duplicate', 'fraudulent', 'others'];
    const sanitizedReason = validReasons.includes(reason) ? reason : 'others';
    const refundNotes = reason && reason !== sanitizedReason ? `Reason: ${reason}` : 'Cancellation refund requested';

    try {
        let remainingToRefund = refundAmount;
        const refundResults = [];

        // Phase 1 / T1.3 & T1.4: Waterfall Drain Allocation Loop
        for (const payment of capturedPayments) {
            if (remainingToRefund <= 0.001) {
                payment.status = 'captured';
                continue;
            }

            const availableInPayment = (payment.amount || 0) - (payment.refundedAmount || 0);
            if (availableInPayment <= 0.001) {
                payment.status = 'refunded';
                continue;
            }

            const amountToDrain = Math.min(availableInPayment, Math.round(remainingToRefund * 100) / 100);

            // Self-Healing: Resolve true 'pay_' ID from checkout session if missing or bal_txn_
            let gatewayId = payment.gatewayId;
            if ((!gatewayId || !gatewayId.startsWith('pay_')) && payment.sessionId) {
                try {
                    console.log(`[refundBooking] Attempting to resolve true pay_ ID from sessionId ${payment.sessionId}`);
                    const sessionData = await provider.getCheckoutSession(payment.sessionId);
                    const paymentItem = sessionData?.attributes?.payments?.[0];
                    if (paymentItem?.id && paymentItem.id.startsWith('pay_')) {
                        gatewayId = paymentItem.id;
                        payment.gatewayId = gatewayId;
                        console.log(`[refundBooking] Successfully resolved pay_ ID from session: ${gatewayId}`);
                    }
                } catch (sessionErr) {
                    console.warn(`[refundBooking] Could not resolve payment ID from session ${payment.sessionId}:`, sessionErr.message);
                }
            }

            if (!gatewayId && payment.referenceCode?.startsWith('pay_')) {
                gatewayId = payment.referenceCode;
            }

            if (!gatewayId || !gatewayId.startsWith('pay_')) {
                throw new HttpsError('failed-precondition', `Invalid payment identifier '${gatewayId || 'unknown'}'. PayMongo refunds require a valid payment ID starting with 'pay_'.`);
            }

            console.log(`[refundBooking] Draining ₱${amountToDrain} from payment ${gatewayId} (target: ₱${refundAmount}, remaining: ₱${remainingToRefund})`);

            // Phase 1 / T1.4: Execute PayMongo API refund call for this specific payment
            const refundRes = await PaymentManager.getProvider(payment.gateway || 'paymongo').issueRefund(
                gatewayId,
                amountToDrain,
                sanitizedReason,
                refundNotes
            );

            // Phase 1 / T1.5 & Phase 5 / T5.1: Record refundedAmount, refundedAt, and refundReason
            payment.refundedAmount = (payment.refundedAmount || 0) + amountToDrain;
            payment.status = payment.refundedAmount >= (payment.amount - 0.01) ? 'refunded' : 'captured';
            payment.refundedAt = Timestamp.now();
            payment.refundReason = sanitizedReason;

            remainingToRefund = Math.max(0, Math.round((remainingToRefund - amountToDrain) * 100) / 100);
            refundResults.push({ gatewayId, amount: amountToDrain, refundId: refundRes?.id });
        }

        // Restore any untouched payment back to 'captured'
        capturedPayments.forEach(p => {
            if (p.status === 'processing_refund') {
                p.status = 'captured';
            }
        });

        // Phase 1 / T1.6: Finalize booking status in Firestore
        // Any successfully processed refund (whether partial or full) marks the booking as refunded
        const finalBookingStatus = 'refunded';

        await bookingRef.update({
            status: finalBookingStatus,
            payment: payments.map(p => ({ ...p })),
            updatedAt: FieldValue.serverTimestamp()
        });

        // Phase 1 / T1.7: Release Offer Slot if booking was active before this refund
        // Exclude 'for-cancellation' because useCancellationAdmin handles slot decrement when approving user cancellation requests
        if (data.offer?.id && data.business?.id && data.status !== 'cancelled' && data.status !== 'refunded' && data.status !== 'for-cancellation') {
            try {
                const offerRef = db.collection('businesses').doc(data.business.id).collection('offers').doc(data.offer.id);
                const offerSnap = await offerRef.get();
                if (offerSnap.exists) {
                    const currentReserved = offerSnap.data()?.reservedPax || 0;
                    if (currentReserved > 0) {
                        await offerRef.update({
                            reservedPax: admin.firestore.FieldValue.increment(-1),
                            updatedAt: FieldValue.serverTimestamp()
                        });
                        console.log(`[refundBooking] Decremented reservedPax for offer ${data.offer.id}`);
                    }
                }
            } catch (offerErr) {
                console.warn(`[refundBooking] Failed to decrement offer reservedPax:`, offerErr.message);
            }
        }

        // Phase 5 / T5.2: Synchronize refund entries with global /payments collection
        try {
            const paymentsQuery = await db.collection('payments')
                .where('bookingId', '==', bookingId)
                .get();

            if (!paymentsQuery.empty) {
                const batch = db.batch();
                paymentsQuery.docs.forEach(docSnap => {
                    batch.update(docSnap.ref, {
                        status: 'refunded',
                        'receipt.refundedAmount': FieldValue.increment(refundAmount),
                        refundedAt: FieldValue.serverTimestamp(),
                        refundReason: sanitizedReason,
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                console.log(`[refundBooking] Synchronized refund to ${paymentsQuery.size} payments collection documents`);
            } else {
                for (const res of refundResults) {
                    const paySnap = await db.collection('payments')
                        .where('gatewayId', '==', res.gatewayId)
                        .get();
                    if (!paySnap.empty) {
                        const batch = db.batch();
                        paySnap.docs.forEach(docSnap => {
                            batch.update(docSnap.ref, {
                                status: 'refunded',
                                'receipt.refundedAmount': res.amount,
                                refundedAt: FieldValue.serverTimestamp(),
                                refundReason: sanitizedReason,
                                updatedAt: FieldValue.serverTimestamp()
                            });
                        });
                        await batch.commit();
                    }
                }
            }
        } catch (paymentsSyncErr) {
            console.warn(`[refundBooking] Could not sync to /payments collection:`, paymentsSyncErr.message);
        }

        // If self-serve refund by hiker, alert the business admins
        if (isOwner && !isAdmin && !isSuperAdmin && data.business?.id) {
            const hikerName = data.user?.firstname || 'A hiker';
            const trailName = data.trail?.name || 'the hike';
            await notifyBusinessAdmins(db, data.business.id, {
                title: `Self-Serve Refund - ${trailName}`,
                body: `${hikerName} processed an automated refund for ${trailName}. Slot released.`,
                inAppTitle: `Automated Refund Processed`,
                inAppMessage: `${hikerName} processed a self-serve refund for ${trailName}. Slot released.`,
                type: 'self_serve_refund',
                metadata: {
                    bookingId,
                    userId,
                    refundAmount,
                },
                data: {
                    bookingId,
                    userId,
                }
            });
        }

        return {
            success: true,
            refundResults,
            totalRefunded: refundAmount,
            message: `Refunded ${refundLabel} successfully`
        };
    } catch (error) {
        console.error("[refundBooking] PayMongo Refund Error:", error);

        // Rollback lock to 'captured' so the admin can safely retry
        try {
            const freshDoc = await bookingRef.get();
            if (freshDoc.exists) {
                const freshPayments = freshDoc.data().payment || [];
                let modified = false;
                freshPayments.forEach(p => {
                    if (p.status === 'processing_refund') {
                        p.status = 'captured';
                        modified = true;
                    }
                });
                if (modified) {
                    await bookingRef.update({
                        payment: freshPayments.map(p => ({ ...p })),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (rollbackErr) {
            console.error("[refundBooking] Failed to rollback processing_refund lock:", rollbackErr);
        }

        // Handle specific PayMongo API Errors gracefully
        const errorMessage = error.message || '';
        if (errorMessage.includes('same_day_partial_refund_not_allowed')) {
            throw new HttpsError('failed-precondition', 'Partial refunds cannot be processed on the same day the payment was made. Please issue a full (100%) refund or try again tomorrow.');
        }

        throw new HttpsError('internal', `Payment Gateway Error: ${errorMessage}`);
    }
});

/**
 * Atomically processes a cancellation request approval or rejection.
 * Executes PayMongo refund (if requested) and commits all Firestore updates
 * (Booking status, Offer slot release, Group chat member removal, Cancellation request status, /payments sync)
 * inside a single atomic Firestore batch (all-or-nothing).
 *
 * @async
 * @function processCancellationApproval
 * @param {Object} request - The callable request object.
 * @param {Object} request.data - Input parameters.
 * @param {string} [request.data.cancellationId] - Cancellation document ID.
 * @param {string} request.data.bookingId - Booking document ID.
 * @param {string} request.data.userId - Booking owner user ID.
 * @param {string} [request.data.businessId] - Business ID owning the offer/booking.
 * @param {string} [request.data.offerId] - Offer ID for slot inventory.
 * @param {boolean} request.data.approved - True to approve cancellation, false to decline.
 * @param {boolean} [request.data.shouldRefund=true] - Whether to issue a refund.
 * @param {string} [request.data.refundType='full'] - 'full', 'partial', 'custom', or 'none'.
 * @param {number} [request.data.customAmount] - Custom amount in PHP if refundType === 'custom'.
 * @param {string} [request.data.adminNote] - Reason or explanation note.
 * @returns {Promise<Object>} Result receipt.
 */
exports.processCancellationApproval = https.onCall({ secrets: [paymongoSecret] }, async (request) => {
    const {
        cancellationId,
        bookingId,
        userId,
        businessId: inputBusinessId,
        offerId: inputOfferId,
        approved,
        shouldRefund = true,
        refundType = 'full',
        customAmount,
        adminNote
    } = request.data || {};

    const caller = request.auth;
    console.log(`[processCancellationApproval] Invoked by ${caller?.uid} for booking ${bookingId}, approved=${approved}, refundType=${refundType}`);

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;
    const offerId = inputOfferId || bookingData.offer?.id;

    // Authorization: Must be admin for this business or superadmin
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && (!businessId || adminBusinessId === businessId);
    const isSuperAdmin = caller.token.role === 'superadmin';

    if (!isAdmin && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only administrators can process cancellation requests.');
    }

    // Resolve Cancellation Document reference if present
    let cancellationRef = null;
    let cancellationData = null;
    if (cancellationId && businessId) {
        cancellationRef = db.collection('businesses').doc(businessId).collection('cancellations').doc(cancellationId);
        const cSnap = await cancellationRef.get();
        if (cSnap.exists) {
            cancellationData = cSnap.data();
        }
    }

    // ─── CASE 1: DECLINE CANCELLATION REQUEST ─────────────────────────────────
    if (!approved) {
        if (!adminNote || !adminNote.trim()) {
            throw new HttpsError('invalid-argument', 'An admin note is required when declining a cancellation request.');
        }

        const batch = db.batch();
        if (cancellationRef) {
            batch.update(cancellationRef, {
                status: 'rejected',
                adminNote: adminNote.trim(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }

        batch.update(bookingRef, {
            cancellationReason: adminNote.trim(),
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();
        console.log(`[processCancellationApproval] Declined cancellation for booking ${bookingId}`);

        // Notify hiker that their cancellation request was declined
        const trailName = bookingData.trail?.name || 'your hike';
        const businessName = bookingData.business?.name || 'the organizer';
        await notifyUser(db, userId, {
            title: `Cancellation Request Declined`,
            body: `Your cancellation request for ${trailName} was declined by ${businessName}. Reason: ${adminNote.trim()}`,
            inAppTitle: `Cancellation Request Declined`,
            inAppMessage: `Your cancellation request for ${trailName} has been declined. Organizer note: ${adminNote.trim()}`,
            type: 'cancellation_declined',
            metadata: {
                bookingId,
                trailName,
                businessName,
                adminNote: adminNote.trim(),
            },
            data: {
                bookingId,
                userId,
            }
        });

        return {
            success: true,
            approved: false,
            message: 'Cancellation request declined.'
        };
    }

    // ─── CASE 2: APPROVE CANCELLATION REQUEST ─────────────────────────────────
    const payments = bookingData.payment || [];
    const capturedPayments = payments.filter(p => p.status === 'captured');
    const totalCapturedAmount = capturedPayments.reduce((sum, p) => {
        const available = (p.amount || 0) - (p.refundedAmount || 0);
        return sum + Math.max(0, available);
    }, 0);

    const willRefund = Boolean(shouldRefund) && refundType !== 'none' && totalCapturedAmount > 0;
    let actualRefundedAmount = 0;
    const refundResults = [];

    if (willRefund) {
        let targetRefund = totalCapturedAmount;
        if (refundType === 'custom' && typeof customAmount === 'number' && customAmount > 0) {
            targetRefund = Math.min(totalCapturedAmount, Math.round(customAmount * 100) / 100);
        } else if (refundType === 'partial') {
            targetRefund = Math.round((totalCapturedAmount * 0.10) * 100) / 100;
        }

        if (targetRefund < 1.00) {
            throw new HttpsError('invalid-argument', 'Minimum refund amount is ₱1.00.');
        }

        const PAYMONGO_SECRET_KEY = paymongoSecret.value();
        const provider = new PayMongoProvider(PAYMONGO_SECRET_KEY);
        PaymentManager.registerProvider('paymongo', provider);

        const sanitizedReason = 'others';
        const refundNotes = adminNote ? `Cancellation Approval: ${adminNote}` : 'Cancellation approved by organizer';

        let remainingToRefund = targetRefund;

        // PayMongo Waterfall Drain
        for (const payment of capturedPayments) {
            if (remainingToRefund <= 0.001) break;

            const availableInPayment = (payment.amount || 0) - (payment.refundedAmount || 0);
            if (availableInPayment <= 0.001) continue;

            const amountToDrain = Math.min(availableInPayment, Math.round(remainingToRefund * 100) / 100);

            // Self-Healing: Resolve true 'pay_' ID from checkout session if missing or bal_txn_
            let gatewayId = payment.gatewayId;
            if ((!gatewayId || !gatewayId.startsWith('pay_')) && payment.sessionId) {
                try {
                    const sessionData = await provider.getCheckoutSession(payment.sessionId);
                    const paymentItem = sessionData?.attributes?.payments?.[0];
                    if (paymentItem?.id && paymentItem.id.startsWith('pay_')) {
                        gatewayId = paymentItem.id;
                        payment.gatewayId = gatewayId;
                    }
                } catch (sErr) {
                    console.warn(`[processCancellationApproval] Could not resolve payment ID:`, sErr.message);
                }
            }

            if (!gatewayId && payment.referenceCode?.startsWith('pay_')) {
                gatewayId = payment.referenceCode;
            }

            if (!gatewayId || !gatewayId.startsWith('pay_')) {
                throw new HttpsError('failed-precondition', `Invalid payment identifier '${gatewayId || 'unknown'}'. PayMongo refund cannot proceed.`);
            }

            console.log(`[processCancellationApproval] Draining ₱${amountToDrain} from payment ${gatewayId}`);
            const refundRes = await PaymentManager.getProvider(payment.gateway || 'paymongo').issueRefund(
                gatewayId,
                amountToDrain,
                sanitizedReason,
                refundNotes
            );

            payment.refundedAmount = (payment.refundedAmount || 0) + amountToDrain;
            payment.status = payment.refundedAmount >= (payment.amount - 0.01) ? 'refunded' : 'captured';
            payment.refundedAt = Timestamp.now();
            payment.refundReason = sanitizedReason;

            remainingToRefund = Math.max(0, Math.round((remainingToRefund - amountToDrain) * 100) / 100);
            actualRefundedAmount += amountToDrain;
            refundResults.push({ gatewayId, amount: amountToDrain, refundId: refundRes?.id });
        }
    }

    // ─── ATOMIC FIRESTORE BATCH EXECUTION ──────────────────────────────────────
    const batch = db.batch();
    const isRefundIssued = actualRefundedAmount > 0;

    // 1. Booking Document Update
    const finalBookingStatus = isRefundIssued ? 'refunded' : 'cancelled';
    batch.update(bookingRef, {
        status: finalBookingStatus,
        payment: payments.map(p => ({ ...p })),
        cancellationReason: adminNote || cancellationData?.reason || bookingData.cancellationReason || 'Cancellation approved',
        cancelledBy: cancellationData?.cancelledBy || bookingData.cancelledBy || caller.uid,
        updatedAt: FieldValue.serverTimestamp()
    });

    // 2. Offer Slot Inventory Update (Release slot)
    if (businessId && offerId) {
        try {
            const offerRef = db.collection('businesses').doc(businessId).collection('offers').doc(offerId);
            const offerSnap = await offerRef.get();
            if (offerSnap.exists) {
                const currentReserved = offerSnap.data()?.reservedPax || 0;
                if (currentReserved > 0) {
                    batch.update(offerRef, {
                        reservedPax: admin.firestore.FieldValue.increment(-1),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (offerErr) {
            console.warn(`[processCancellationApproval] Could not verify offer doc:`, offerErr.message);
        }
    }

    // 3. Group Chat Document Update (Remove member)
    if (offerId) {
        try {
            const groupRef = db.collection('groups').doc(offerId);
            const groupSnap = await groupRef.get();
            if (groupSnap.exists) {
                const groupData = groupSnap.data();
                const updatedMembers = (groupData.members || []).filter(m => m.id !== userId);
                batch.update(groupRef, {
                    participantsIds: admin.firestore.FieldValue.arrayRemove(userId),
                    members: updatedMembers,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
        } catch (groupErr) {
            console.warn(`[processCancellationApproval] Could not verify group doc:`, groupErr.message);
        }
    }

    // 4. Cancellation Document Update (if present)
    if (cancellationRef) {
        batch.update(cancellationRef, {
            status: 'approved',
            adminNote: adminNote || null,
            refundAmount: actualRefundedAmount,
            refundDecision: isRefundIssued ? 'issue_refund' : 'no_refund',
            handshakeStep: 'completed',
            refundedAt: isRefundIssued ? FieldValue.serverTimestamp() : null,
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    // 5. Global /payments Collection Sync (if refunded)
    if (isRefundIssued) {
        try {
            const paymentsQuery = await db.collection('payments').where('bookingId', '==', bookingId).get();
            if (!paymentsQuery.empty) {
                paymentsQuery.docs.forEach(docSnap => {
                    batch.update(docSnap.ref, {
                        status: 'refunded',
                        'receipt.refundedAmount': FieldValue.increment(actualRefundedAmount),
                        refundedAt: FieldValue.serverTimestamp(),
                        refundReason: adminNote || 'cancellation_approved',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
            }
        } catch (syncErr) {
            console.warn(`[processCancellationApproval] Global /payments sync warning:`, syncErr.message);
        }
    }

    // Commit all Firestore operations together
    await batch.commit();
    console.log(`[processCancellationApproval] Successfully committed atomic batch for booking ${bookingId}`);

    // Notify hiker that their cancellation request was approved
    const trailName = bookingData.trail?.name || 'your hike';
    const businessName = bookingData.business?.name || 'the organizer';
    await notifyUser(db, userId, {
        title: isRefundIssued ? `Cancellation Approved & Refunded` : `Cancellation Approved`,
        body: isRefundIssued
            ? `Your cancellation for ${trailName} was approved and your refund has been processed.`
            : `Your cancellation request for ${trailName} was approved by ${businessName}.`,
        inAppTitle: isRefundIssued ? `Cancellation Approved & Refunded` : `Cancellation Approved`,
        inAppMessage: isRefundIssued
            ? `Your cancellation request for ${trailName} was approved and your refund has been processed.`
            : `Your cancellation request for ${trailName} has been approved by ${businessName}.`,
        type: isRefundIssued ? 'cancellation_refunded' : 'cancellation_approved',
        metadata: {
            bookingId,
            trailName,
            businessName,
            refundAmount: actualRefundedAmount,
            ...(adminNote ? { adminNote: adminNote.trim() } : {}),
        },
        data: {
            bookingId,
            userId,
        }
    });

    return {
        success: true,
        approved: true,
        isRefundIssued,
        refundAmount: actualRefundedAmount,
        refundResults,
        message: isRefundIssued
            ? `Cancellation approved and ₱${actualRefundedAmount.toFixed(2)} refunded successfully.`
            : 'Cancellation approved and slot released successfully.'
    };
});

/**
 * Atomically verifies or rejects a manual QR payment.
 * On verification:
 *   1. Updates booking status to 'paid' (if full) or 'downpayment' (if partial).
 *   2. Sets remainingBalance.
 *   3. Captures payment record with verifiedAt, verifiedBy, and classification.
 *   4. Atomically adds hiker to tour group chat (groups/{offerId}) participants and members.
 * On rejection:
 *   1. Resets booking status to 'for-payment' with rejection reason.
 *   2. Marks payment as 'rejected'.
 */
exports.verifyManualPayment = https.onCall(async (request) => {
    const {
        bookingId,
        userId,
        businessId: inputBusinessId,
        offerId: inputOfferId,
        classification = 'full',
        verifiedAmount,
        note,
        isRejection = false,
        rejectionReason = ''
    } = request.data || {};

    const caller = request.auth;
    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;
    const offerId = inputOfferId || bookingData.offer?.id;

    // Authorization: Must be admin or owner for this business, or superadmin
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && (!businessId || adminBusinessId === businessId);
    const isOwner = caller.token.role === 'owner' && (!businessId || adminBusinessId === businessId);
    const isSuperAdmin = caller.token.role === 'superadmin';

    if (!isAdmin && !isOwner && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only administrators can verify manual payments.');
    }

    const batch = db.batch();
    const payments = bookingData.payment || [];
    const pendingPaymentIndex = payments.findIndex(p => p.gateway === 'manual_qr' && p.status === 'pending');

    if (isRejection) {
        if (!rejectionReason || !rejectionReason.trim()) {
            throw new HttpsError('invalid-argument', 'Rejection reason is required.');
        }

        const updatedPayments = payments.map((p, idx) => {
            if (idx === pendingPaymentIndex || (p.gateway === 'manual_qr' && p.status === 'pending')) {
                return {
                    ...p,
                    status: 'rejected',
                    adminNote: rejectionReason.trim(),
                };
            }
            return p;
        });

        batch.update(bookingRef, {
            status: 'for-payment',
            paymentVerificationStatus: 'rejected',
            paymentRejectionReason: rejectionReason.trim(),
            payment: updatedPayments,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();
        console.log(`[verifyManualPayment] Rejected manual payment for booking ${bookingId}`);

        // Notify hiker that their payment receipt was not approved
        const trailName = bookingData.trail?.name || 'your booking';
        const businessName = bookingData.business?.name || 'the organizer';
        await notifyUser(db, userId, {
            title: `Payment Receipt Not Approved`,
            body: `Your payment receipt for ${trailName} was not approved: ${rejectionReason.trim()}. Please submit a valid receipt.`,
            inAppTitle: `Payment Receipt Not Approved`,
            inAppMessage: `Your payment receipt for ${trailName} was not approved by ${businessName}. Reason: ${rejectionReason.trim()}. Please upload a valid receipt to secure your slot.`,
            type: 'payment_rejected',
            metadata: {
                bookingId,
                trailName,
                businessName,
                rejectionReason: rejectionReason.trim(),
            },
            data: {
                bookingId,
                userId,
            }
        });

        return { success: true, verified: false, message: 'Payment rejected.' };
    }

    // ─── VERIFICATION (Full or Downpayment) ──────────────────────────────────
    const totalPrice = bookingData.totalPrice || bookingData.offer?.price || 0;
    const previouslyCaptured = payments.reduce((sum, p) => (p.status === 'captured' ? sum + (p.amount || 0) : sum), 0);
    const currentRemaining = typeof bookingData.remainingBalance === 'number'
        ? bookingData.remainingBalance
        : Math.max(0, totalPrice - previouslyCaptured);

    const isOverpaid = typeof verifiedAmount === 'number' && verifiedAmount > currentRemaining;
    const excessAmount = isOverpaid ? (verifiedAmount - currentRemaining) : 0;

    const approvedAmount = isOverpaid
        ? currentRemaining
        : (typeof verifiedAmount === 'number' && verifiedAmount > 0
            ? verifiedAmount
            : (classification === 'full' ? currentRemaining : Math.min(currentRemaining, currentRemaining / 2)));

    const remaining = isOverpaid ? 0 : Math.max(0, currentRemaining - approvedAmount);
    const isFull = isOverpaid || remaining === 0 || (classification === 'full' && approvedAmount >= currentRemaining);
    const effectiveClassification = isFull ? 'full' : 'downpayment';

    let refundableDeadline = null;
    if (bookingData.offer && bookingData.offer.date) {
        const rawDate = bookingData.offer.date.toDate ? bookingData.offer.date.toDate() : new Date(bookingData.offer.date);
        const deadline = new Date(rawDate);
        deadline.setDate(deadline.getDate() - 10);
        refundableDeadline = Timestamp.fromDate(deadline);
    }

    let paymentFound = false;
    const updatedPayments = payments.map((p, idx) => {
        if (idx === pendingPaymentIndex || (p.gateway === 'manual_qr' && p.status === 'pending')) {
            paymentFound = true;
            return {
                ...p,
                amount: approvedAmount,
                status: 'captured',
                classification: effectiveClassification,
                paidAt: Timestamp.now(),
                verifiedBy: caller.uid,
                verifiedAt: Timestamp.now(),
                adminNote: note ? note.trim() : null,
                ...(refundableDeadline ? { refundableUntil: refundableDeadline } : {}),
            };
        }
        return p;
    });

    if (!paymentFound) {
        updatedPayments.push({
            gateway: 'manual_qr',
            sessionId: `manual_${Date.now()}`,
            referenceCode: `MANUAL-${Date.now()}`,
            amount: approvedAmount,
            status: 'captured',
            classification: effectiveClassification,
            createdAt: Timestamp.now(),
            paidAt: Timestamp.now(),
            verifiedBy: caller.uid,
            verifiedAt: Timestamp.now(),
            adminNote: note ? note.trim() : null,
            ...(refundableDeadline ? { refundableUntil: refundableDeadline } : {}),
        });
    }

    const bookingUpdates = {
        status: isFull ? 'completed' : 'downpayment',
        remainingBalance: remaining,
        paymentVerificationStatus: isFull ? 'fully_paid' : 'downpayment',
        paymentRejectionReason: FieldValue.delete(),
        payment: updatedPayments,
        updatedAt: FieldValue.serverTimestamp(),
    };

    if (isOverpaid) {
        bookingUpdates.overpayment = {
            excessAmount: excessAmount,
            originalVerifiedAmount: verifiedAmount,
            hikeAmountCaptured: approvedAmount,
            status: 'awaiting_hiker_wallet',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
    }

    batch.update(bookingRef, bookingUpdates);

    // Atomically add hiker to tour group chat
    if (offerId) {
        try {
            const groupRef = db.collection('groups').doc(offerId);
            const groupSnap = await groupRef.get();
            if (groupSnap.exists) {
                const groupData = groupSnap.data();
                const members = groupData.members || [];
                const alreadyMember = members.some(m => m.id === userId);
                const hikerUser = bookingData.user || {};

                const newMember = {
                    id: userId,
                    username: hikerUser.username || '',
                    firstname: hikerUser.firstname || '',
                    lastname: hikerUser.lastname || '',
                    email: hikerUser.email || '',
                    bookingId,
                };

                const updatedMembers = alreadyMember ? members : [...members, newMember];

                batch.update(groupRef, {
                    participantsIds: FieldValue.arrayUnion(userId),
                    members: updatedMembers,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        } catch (groupErr) {
            console.warn(`[verifyManualPayment] Could not update group chat:`, groupErr.message);
        }
    }

    await batch.commit();
    console.log(`[verifyManualPayment] Successfully verified ${effectiveClassification} payment for booking ${bookingId}${isOverpaid ? ` (Overpayment excess: ₱${excessAmount.toFixed(2)})` : ''}`);

    if (isOverpaid) {
        const trailName = bookingData.trail?.name || 'your hike';
        await notifyUser(db, userId, {
            title: `Hike Confirmed · Overpayment Detected`,
            body: `Your payment was verified and your hike is confirmed! You overpaid by ₱${excessAmount.toFixed(2)}. Please submit your GCash/Maya details in your booking details so the organizer can refund the excess amount.`,
            inAppTitle: `Hike Confirmed · Excess Refund Pending`,
            inAppMessage: `Your booking for ${trailName} is 100% confirmed! An excess payment of ₱${excessAmount.toFixed(2)} was detected. Please provide your e-wallet details in your booking details to receive your refund.`,
            type: 'overpayment_detected',
            metadata: {
                bookingId,
                excessAmount,
                originalVerifiedAmount: verifiedAmount,
            },
            data: {
                bookingId,
                userId,
            }
        });
    } else if (isFull) {
        const trailName = bookingData.trail?.name || 'your tour';
        await notifyUser(db, userId, {
            title: 'Payment Verified · Booking Completed',
            body: `Your payment for ${trailName} has been verified and your reservation is completed!`,
            inAppTitle: 'Booking Completed',
            inAppMessage: `Your payment for ${trailName} was verified. Your booking is 100% completed!`,
            type: 'booking_completed',
            metadata: { bookingId, trailName },
            data: { bookingId, userId }
        });
    }

    return {
        success: true,
        verified: true,
        classification: effectiveClassification,
        remainingBalance: remaining,
        isOverpaid,
        excessAmount,
        message: isOverpaid
            ? `Full payment verified and excess of ₱${excessAmount.toFixed(2)} marked for refund.`
            : (isFull ? 'Full payment verified.' : 'Downpayment verified.'),
    };
});

/**
 * Atomically completes a manual refund payout.
 * 1. Updates cancellation document to 'approved' with payout receipt URL and completed step.
 * 2. Updates booking document to 'refunded'.
 * 3. Atomically releases 1 slot in businesses/{businessId}/offers/{offerId}.
 * 4. Atomically removes hiker from groups/{offerId}.
 */
exports.completeManualRefund = https.onCall(async (request) => {
    const {
        bookingId,
        userId,
        businessId: inputBusinessId,
        offerId: inputOfferId,
        cancellationId,
        receiptUrl,
        refundAmount,
        adminNote,
    } = request.data || {};

    const caller = request.auth;
    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');
    if (!receiptUrl) throw new HttpsError('invalid-argument', 'Receipt proof URL is required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;
    const offerId = inputOfferId || bookingData.offer?.id;

    // Authorization: Must be admin or owner for this business, or superadmin
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && (!businessId || adminBusinessId === businessId);
    const isOwner = caller.token.role === 'owner' && (!businessId || adminBusinessId === businessId);
    const isSuperAdmin = caller.token.role === 'superadmin';

    if (!isAdmin && !isOwner && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only administrators can complete refunds.');
    }

    const batch = db.batch();

    // 1. Cancellation Document Update
    let resolvedCancellationRef = null;
    if (cancellationId && businessId) {
        resolvedCancellationRef = db.collection('businesses').doc(businessId).collection('cancellations').doc(cancellationId);
    } else if (businessId) {
        const cSnap = await db.collection('businesses').doc(businessId).collection('cancellations')
            .where('bookingId', '==', bookingId).limit(1).get();
        if (!cSnap.empty) {
            resolvedCancellationRef = cSnap.docs[0].ref;
        }
    }

    const totalPaid = (bookingData.payment || []).reduce((sum, p) => p.status === 'captured' ? sum + p.amount : sum, 0);
    const resolvedRefundAmount = typeof refundAmount === 'number' && refundAmount > 0 ? refundAmount : totalPaid;

    if (resolvedCancellationRef) {
        const cancellationUpdates = {
            status: 'refund_submitted',
            adminRefundReceiptUrl: receiptUrl,
            adminRefundReceiptUploadedAt: FieldValue.serverTimestamp(),
            handshakeStep: 'awaiting_user_confirmation',
            refundAmount: resolvedRefundAmount,
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (adminNote && typeof adminNote === 'string') {
            cancellationUpdates.adminNote = adminNote.trim();
        }
        batch.update(resolvedCancellationRef, cancellationUpdates);
    }

    // 2. Booking Document Update
    batch.update(bookingRef, {
        status: 'refund',
        paymentVerificationStatus: 'refund_submitted',
        refundedAmount: resolvedRefundAmount,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // NOTE: DO NOT release tour slot or remove hiker from group chat here!
    // Hiker must remain in the tour chat and slot is retained until the refund is confirmed as received/resolved.

    await batch.commit();
    console.log(`[completeManualRefund] Successfully committed manual refund submission for booking ${bookingId}`);

    // Notify hiker that their manual refund payout has been disbursed with proof
    const trailName = bookingData.trail?.name || 'your hike';
    const businessName = bookingData.business?.name || 'the organizer';
    try {
        await notifyUser(db, userId, {
            title: `Refund Payout Sent`,
            body: `Your refund of ₱${resolvedRefundAmount.toFixed(2)} for ${trailName} has been disbursed by ${businessName}. Please inspect the receipt and confirm receipt in your booking details.`,
            inAppTitle: `Refund Payout Sent`,
            inAppMessage: `Your refund of ₱${resolvedRefundAmount.toFixed(2)} for ${trailName} has been disbursed by ${businessName}. Please inspect the receipt and confirm receipt in your booking details.`,
            type: 'refund_submitted',
            metadata: {
                bookingId,
                offerId,
                trailName,
                businessName,
                refundAmount: resolvedRefundAmount,
                receiptUrl,
            },
            data: {
                bookingId,
                offerId,
                userId,
            }
        });
    } catch (notifyErr) {
        console.warn(`[completeManualRefund] Notification failed after commit:`, notifyErr.message);
    }

    return {
        success: true,
        refundAmount: resolvedRefundAmount,
        handshakeStep: 'awaiting_user_confirmation',
        message: 'Refund payout proof uploaded. Awaiting hiker confirmation.',
    };
});

/**
 * Hiker confirms that they received the refund payout.
 * Atomically marks the cancellation and booking as completed/refunded,
 * and removes the hiker from the tour group chat.
 */
exports.confirmRefundReceived = https.onCall(async (request) => {
    const {
        bookingId,
        userId,
        businessId: inputBusinessId,
        offerId: inputOfferId,
        cancellationId
    } = request.data || {};

    const caller = request.auth;
    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');
    if (caller.uid !== userId) throw new HttpsError('permission-denied', 'Only the booking owner can confirm refund receipt.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;
    const offerId = inputOfferId || bookingData.offer?.id;

    const batch = db.batch();

    // 1. Cancellation Document Update
    let resolvedCancellationRef = null;
    let cancellationData = null;
    if (cancellationId && businessId) {
        resolvedCancellationRef = db.collection('businesses').doc(businessId).collection('cancellations').doc(cancellationId);
        const cSnap = await resolvedCancellationRef.get();
        if (cSnap.exists) cancellationData = cSnap.data();
    } else if (businessId) {
        const cSnap = await db.collection('businesses').doc(businessId).collection('cancellations')
            .where('bookingId', '==', bookingId).limit(1).get();
        if (!cSnap.empty) {
            resolvedCancellationRef = cSnap.docs[0].ref;
            cancellationData = cSnap.docs[0].data();
        }
    }

    // Idempotency check: prevent duplicate slot release or payment drain if already completed
    if (bookingData.status === 'refunded' || cancellationData?.status === 'refund_completed') {
        return { success: true, message: 'Refund receipt already confirmed.' };
    }

    const resolvedRefundAmount = cancellationData?.refundAmount || bookingData.refundedAmount || 0;

    if (resolvedCancellationRef) {
        batch.update(resolvedCancellationRef, {
            status: 'refund_completed',
            handshakeStep: 'completed',
            userConfirmedReceivedAt: FieldValue.serverTimestamp(),
            refundedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    // 2. Booking Document Update
    let remainingToRefund = resolvedRefundAmount;
    const updatedPayments = (bookingData.payment || []).map(p => {
        if (p.status === 'captured') {
            const thisRefund = Math.min(p.amount, Math.max(0, remainingToRefund));
            remainingToRefund -= thisRefund;
            return {
                ...p,
                status: thisRefund >= p.amount ? 'refunded' : 'captured',
                refundedAmount: thisRefund,
                refundedAt: Timestamp.now(),
                refundReason: 'Hiker confirmed refund received',
            };
        }
        return p;
    });

    batch.update(bookingRef, {
        status: 'refunded',
        paymentVerificationStatus: 'refunded',
        payment: updatedPayments,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Atomically remove hiker from Group Chat NOW since refund is resolved
    const resolvedOfferId = offerId || bookingData.offer?.id || cancellationData?.offerId;
    if (resolvedOfferId) {
        try {
            const groupRef = db.collection('groups').doc(resolvedOfferId);
            const groupSnap = await groupRef.get();
            if (groupSnap.exists) {
                const groupData = groupSnap.data();
                const updatedMembers = (groupData.members || []).filter(m => m.id !== userId);
                batch.update(groupRef, {
                    participantsIds: FieldValue.arrayRemove(userId),
                    members: updatedMembers,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        } catch (groupErr) {
            console.warn(`[confirmRefundReceived] Could not update group chat:`, groupErr.message);
        }
    }

    // 4. Release 1 Tour Slot in Offer NOW since refund is confirmed
    if (businessId && resolvedOfferId) {
        try {
            const offerRef = db.collection('businesses').doc(businessId).collection('offers').doc(resolvedOfferId);
            const offerSnap = await offerRef.get();
            if (offerSnap.exists && (offerSnap.data()?.reservedPax || 0) > 0) {
                batch.update(offerRef, {
                    reservedPax: FieldValue.increment(-1),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        } catch (offerErr) {
            console.warn(`[confirmRefundReceived] Could not update offer slot:`, offerErr.message);
        }
    }

    await batch.commit();
    console.log(`[confirmRefundReceived] Successfully confirmed refund and completed resolution for booking ${bookingId}`);

    // Notify business admins
    const trailName = bookingData.trail?.name || 'the hike';
    const hikerName = bookingData.user?.displayName || bookingData.user?.name || 'Hiker';
    if (businessId) {
        try {
            await notifyBusinessAdmins(db, businessId, {
                title: `Refund Confirmed by Hiker`,
                body: `${hikerName} confirmed receipt of the refund payout for ${trailName}.`,
                inAppTitle: `Refund Confirmed by Hiker`,
                inAppMessage: `${hikerName} confirmed receipt of the refund payout for ${trailName}. Resolution complete.`,
                type: 'refund_confirmed',
                metadata: {
                    bookingId,
                    userId,
                    trailName,
                    refundAmount: resolvedRefundAmount,
                },
                data: {
                    bookingId,
                    businessId,
                }
            });
        } catch (notifyErr) {
            console.warn(`[confirmRefundReceived] Notification failed after commit:`, notifyErr.message);
        }
    }

    return {
        success: true,
        message: 'Refund received confirmed successfully.',
    };
});

/**
 * Hiker reports that they did NOT receive the refund payout or disputes payout proof.
 * Capped at 3 dispute attempts.
 * Retains hiker in group chat so they can coordinate directly with the organizer.
 */
exports.disputeRefundPayout = https.onCall(async (request) => {
    const {
        bookingId,
        userId,
        businessId: inputBusinessId,
        cancellationId,
        disputeReason
    } = request.data || {};

    const caller = request.auth;
    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');
    if (caller.uid !== userId) throw new HttpsError('permission-denied', 'Only the booking owner can dispute refund receipt.');
    if (!disputeReason || !disputeReason.trim()) throw new HttpsError('invalid-argument', 'Dispute reason is required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;

    // 1. Resolve Cancellation Document & Check Dispute Count Limit (Max 3)
    let resolvedCancellationRef = null;
    let cancellationData = null;
    if (cancellationId && businessId) {
        resolvedCancellationRef = db.collection('businesses').doc(businessId).collection('cancellations').doc(cancellationId);
        const cSnap = await resolvedCancellationRef.get();
        if (cSnap.exists) cancellationData = cSnap.data();
    } else if (businessId) {
        const cSnap = await db.collection('businesses').doc(businessId).collection('cancellations')
            .where('bookingId', '==', bookingId).limit(1).get();
        if (!cSnap.empty) {
            resolvedCancellationRef = cSnap.docs[0].ref;
            cancellationData = cSnap.docs[0].data();
        }
    }

    if (bookingData.status === 'refunded' || cancellationData?.status === 'refund_completed') {
        throw new HttpsError('failed-precondition', 'Cannot dispute an already completed refund.');
    }

    if (cancellationData?.status === 'refund_disputed') {
        throw new HttpsError(
            'failed-precondition',
            'A dispute is already pending admin review. Please wait for the organizer to upload new payout proof.'
        );
    }

    const currentDisputeCount = cancellationData?.disputeCount || 0;
    if (currentDisputeCount >= 3) {
        throw new HttpsError(
            'failed-precondition',
            'Maximum dispute limit (3 attempts) reached. Please coordinate directly with the tour organizer in your tour chat.'
        );
    }

    const nextDisputeCount = currentDisputeCount + 1;
    const batch = db.batch();

    if (resolvedCancellationRef) {
        batch.update(resolvedCancellationRef, {
            status: 'refund_disputed',
            handshakeStep: 'refund_disputed',
            disputeCount: nextDisputeCount,
            disputeReason: disputeReason.trim(),
            disputedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    // 2. Booking Document Update
    batch.update(bookingRef, {
        status: 'refund',
        paymentVerificationStatus: 'refund_disputed',
        updatedAt: FieldValue.serverTimestamp(),
    });

    // NOTE: DO NOT remove user from group chat! Hiker remains in tour chat.

    await batch.commit();
    console.log(`[disputeRefundPayout] Booking ${bookingId} refund disputed (attempt ${nextDisputeCount}/3)`);

    // Notify business admins about the dispute
    const trailName = bookingData.trail?.name || 'the hike';
    const hikerName = bookingData.user?.displayName || bookingData.user?.name || 'Hiker';
    if (businessId) {
        try {
            await notifyBusinessAdmins(db, businessId, {
                title: `Refund Disputed by Hiker (Attempt ${nextDisputeCount}/3)`,
                body: `${hikerName} reported not receiving funds for ${trailName}: "${disputeReason.trim()}"`,
                inAppTitle: `Refund Disputed by Hiker (Attempt ${nextDisputeCount}/3)`,
                inAppMessage: `${hikerName} reported not receiving funds for ${trailName}: "${disputeReason.trim()}". Please review and re-initiate payout.`,
                type: 'refund_disputed',
                metadata: {
                    bookingId,
                    userId,
                    trailName,
                    disputeCount: nextDisputeCount,
                    disputeReason: disputeReason.trim(),
                },
                data: {
                    bookingId,
                    businessId,
                }
            });
        } catch (notifyErr) {
            console.warn(`[disputeRefundPayout] Notification failed after commit:`, notifyErr.message);
        }
    }

    return {
        success: true,
        disputeCount: nextDisputeCount,
        message: 'Refund dispute submitted to organizer.',
    };
});

/**
 * Hiker submits their e-wallet details for an excess overpayment refund.
 * Strict zero auto-fill rule: hiker inputs walletType, accountNumber (11-digit starting with 09), and accountName.
 */
exports.submitOverpaymentWallet = https.onCall(async (request) => {
    const { bookingId, userId, userWallet } = request.data || {};
    const caller = request.auth;

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');
    if (caller.uid !== userId) throw new HttpsError('permission-denied', 'Only the booking owner can submit wallet details.');

    if (!userWallet || !userWallet.accountNumber) {
        throw new HttpsError('invalid-argument', 'Wallet details are required.');
    }

    if (!userWallet.accountName || !String(userWallet.accountName).trim()) {
        throw new HttpsError('invalid-argument', 'Account holder name is required.');
    }

    const cleanNumber = String(userWallet.accountNumber).replace(/\D/g, '');
    if (cleanNumber.length !== 11 || !cleanNumber.startsWith('09')) {
        throw new HttpsError('invalid-argument', 'Mobile number must be 11 digits starting with 09.');
    }

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    if (!bookingData.overpayment) {
        throw new HttpsError('failed-precondition', 'No overpayment refund active for this booking.');
    }

    const opStatus = bookingData.overpayment.status;
    if (opStatus !== 'awaiting_hiker_wallet' && opStatus !== 'awaiting_admin_payout') {
        throw new HttpsError('failed-precondition', 'Cannot modify wallet details once refund payout has been initiated or completed.');
    }

    const businessId = bookingData.business?.id;

    await bookingRef.update({
        'overpayment.userWallet': {
            walletType: userWallet.walletType || 'GCash',
            accountNumber: cleanNumber,
            accountName: String(userWallet.accountName).trim(),
            submittedAt: Timestamp.now(),
        },
        'overpayment.status': 'awaiting_admin_payout',
        'overpayment.updatedAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[submitOverpaymentWallet] Hiker ${userId} submitted wallet for booking ${bookingId}`);

    if (businessId) {
        try {
            const hikerName = bookingData.user?.displayName || bookingData.user?.firstname || 'A hiker';
            const trailName = bookingData.trail?.name || 'the tour';
            await notifyBusinessAdmins(db, businessId, {
                title: `Excess Refund Wallet Submitted`,
                body: `${hikerName} provided their ${userWallet.walletType || 'GCash'} wallet for the ₱${(bookingData.overpayment.excessAmount || 0).toFixed(2)} excess refund on ${trailName}.`,
                inAppTitle: `Excess Refund Wallet Submitted`,
                inAppMessage: `${hikerName} submitted their wallet details for the ₱${(bookingData.overpayment.excessAmount || 0).toFixed(2)} overpayment refund on ${trailName}. Please disburse funds.`,
                type: 'overpayment_wallet_submitted',
                metadata: {
                    bookingId,
                    userId,
                    excessAmount: bookingData.overpayment.excessAmount || 0,
                },
                data: {
                    bookingId,
                    userId,
                }
            });
        } catch (notifyErr) {
            console.warn(`[submitOverpaymentWallet] Notification failed after commit:`, notifyErr.message);
        }
    }

    return {
        success: true,
        message: 'Wallet submitted. Awaiting organizer payout.',
    };
});

/**
 * Admin uploads proof of payout for an excess overpayment refund.
 * Updates overpayment.status to 'awaiting_user_confirmation'.
 */
exports.completeOverpaymentRefund = https.onCall(async (request) => {
    const { bookingId, userId, businessId: inputBusinessId, receiptUrl } = request.data || {};
    const caller = request.auth;

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId || !receiptUrl) {
        throw new HttpsError('invalid-argument', 'bookingId, userId, and receiptUrl are required.');
    }

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;

    // Check authorization
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && (!businessId || adminBusinessId === businessId);
    const isOwner = caller.token.role === 'owner' && (!businessId || adminBusinessId === businessId);
    const isSuperAdmin = caller.token.role === 'superadmin';

    if (!isAdmin && !isOwner && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only administrators can disburse overpayment refunds.');
    }

    if (!bookingData.overpayment) {
        throw new HttpsError('failed-precondition', 'No overpayment found on this booking.');
    }

    if (bookingData.overpayment.status === 'completed') {
        throw new HttpsError('failed-precondition', 'Overpayment refund is already completed.');
    }

    if (!bookingData.overpayment.userWallet?.accountNumber) {
        throw new HttpsError('failed-precondition', 'Hiker has not submitted their wallet details yet.');
    }

    await bookingRef.update({
        'overpayment.adminRefundReceiptUrl': receiptUrl,
        'overpayment.adminRefundReceiptUploadedAt': FieldValue.serverTimestamp(),
        'overpayment.status': 'awaiting_user_confirmation',
        'overpayment.updatedAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[completeOverpaymentRefund] Admin uploaded overpayment refund proof for booking ${bookingId}`);

    const trailName = bookingData.trail?.name || 'your hike';
    const excess = bookingData.overpayment.excessAmount || 0;
    try {
        await notifyUser(db, userId, {
            title: `Excess Refund Sent`,
            body: `The organizer has sent your ₱${excess.toFixed(2)} excess refund for ${trailName}. Please review the receipt proof and confirm receipt in your booking details.`,
            inAppTitle: `Excess Refund Sent`,
            inAppMessage: `The organizer has sent your ₱${excess.toFixed(2)} excess refund for ${trailName}. Please check your wallet and tap 'Confirm Received'.`,
            type: 'overpayment_refund_sent',
            metadata: {
                bookingId,
                excessAmount: excess,
                receiptUrl,
            },
            data: {
                bookingId,
                userId,
            }
        });
    } catch (notifyErr) {
        console.warn(`[completeOverpaymentRefund] Notification failed after commit:`, notifyErr.message);
    }

    return {
        success: true,
        message: 'Overpayment refund proof uploaded. Awaiting hiker confirmation.',
    };
});

/**
 * Hiker confirms receiving the excess overpayment refund.
 * Marks overpayment.status as 'completed'. Booking remains active & paid!
 */
exports.confirmOverpaymentReceived = https.onCall(async (request) => {
    const { bookingId, userId } = request.data || {};
    const caller = request.auth;

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');
    if (caller.uid !== userId) throw new HttpsError('permission-denied', 'Only the booking owner can confirm receipt.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    if (!bookingData.overpayment) {
        throw new HttpsError('failed-precondition', 'No overpayment found on this booking.');
    }

    if (bookingData.overpayment.status === 'completed') {
        return { success: true, message: 'Excess refund already confirmed.' };
    }

    if (
        bookingData.overpayment.status !== 'awaiting_user_confirmation' &&
        bookingData.overpayment.status !== 'refund_disputed'
    ) {
        throw new HttpsError('failed-precondition', 'Cannot confirm refund receipt at this time.');
    }

    await bookingRef.update({
        'overpayment.status': 'completed',
        'overpayment.userConfirmedReceivedAt': FieldValue.serverTimestamp(),
        'overpayment.updatedAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[confirmOverpaymentReceived] Hiker ${userId} confirmed excess refund for booking ${bookingId}`);

    const businessId = bookingData.business?.id;
    if (businessId) {
        try {
            const hikerName = bookingData.user?.displayName || bookingData.user?.firstname || 'Hiker';
            const trailName = bookingData.trail?.name || 'the tour';
            await notifyBusinessAdmins(db, businessId, {
                title: `Excess Refund Confirmed`,
                body: `${hikerName} confirmed receiving the ₱${(bookingData.overpayment.excessAmount || 0).toFixed(2)} excess refund for ${trailName}. Loop closed!`,
                inAppTitle: `Excess Refund Confirmed by Hiker`,
                inAppMessage: `${hikerName} confirmed receipt of their excess refund for ${trailName}.`,
                type: 'overpayment_confirmed',
                metadata: {
                    bookingId,
                    userId,
                },
                data: {
                    bookingId,
                    userId,
                }
            });
        } catch (notifyErr) {
            console.warn(`[confirmOverpaymentReceived] Notification failed after commit:`, notifyErr.message);
        }
    }

    return {
        success: true,
        message: 'Excess refund confirmed. Thank you!',
    };
});

/**
 * Hiker reports that they did NOT receive the excess overpayment refund payout.
 * Capped at 3 dispute attempts.
 */
exports.disputeOverpaymentRefund = https.onCall(async (request) => {
    const { bookingId, userId, disputeReason } = request.data || {};
    const caller = request.auth;

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');
    if (caller.uid !== userId) throw new HttpsError('permission-denied', 'Only the booking owner can dispute receipt.');
    if (!disputeReason || !disputeReason.trim()) throw new HttpsError('invalid-argument', 'Dispute reason is required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    if (!bookingData.overpayment) {
        throw new HttpsError('failed-precondition', 'No overpayment found on this booking.');
    }

    if (bookingData.overpayment.status === 'completed') {
        throw new HttpsError('failed-precondition', 'Cannot dispute an already completed excess refund.');
    }

    if (bookingData.overpayment.status === 'refund_disputed') {
        throw new HttpsError(
            'failed-precondition',
            'A dispute is already pending admin review. Please wait for the organizer to upload new payout proof.'
        );
    }

    if (bookingData.overpayment.status !== 'awaiting_user_confirmation') {
        throw new HttpsError('failed-precondition', 'Cannot dispute until payout receipt is uploaded.');
    }

    const currentDisputeCount = bookingData.overpayment.disputeCount || 0;
    if (currentDisputeCount >= 3) {
        throw new HttpsError(
            'failed-precondition',
            'Maximum dispute limit (3 attempts) reached. Please coordinate directly with the tour organizer in your tour chat.'
        );
    }

    const nextDisputeCount = currentDisputeCount + 1;

    await bookingRef.update({
        'overpayment.status': 'refund_disputed',
        'overpayment.disputeCount': nextDisputeCount,
        'overpayment.disputeReason': disputeReason.trim(),
        'overpayment.disputedAt': FieldValue.serverTimestamp(),
        'overpayment.updatedAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[disputeOverpaymentRefund] Booking ${bookingId} excess refund disputed (attempt ${nextDisputeCount}/3)`);

    const businessId = bookingData.business?.id;
    if (businessId) {
        try {
            const hikerName = bookingData.user?.displayName || bookingData.user?.firstname || 'Hiker';
            const trailName = bookingData.trail?.name || 'the hike';
            await notifyBusinessAdmins(db, businessId, {
                title: `Excess Refund Disputed (Attempt ${nextDisputeCount}/3)`,
                body: `${hikerName} reported not receiving the excess refund for ${trailName}: "${disputeReason.trim()}"`,
                inAppTitle: `Excess Refund Disputed by Hiker (Attempt ${nextDisputeCount}/3)`,
                inAppMessage: `${hikerName} reported not receiving their excess refund for ${trailName}: "${disputeReason.trim()}". Please review and re-initiate.`,
                type: 'overpayment_disputed',
                metadata: {
                    bookingId,
                    userId,
                    disputeReason: disputeReason.trim(),
                },
                data: {
                    bookingId,
                    userId,
                }
            });
        } catch (notifyErr) {
            console.warn(`[disputeOverpaymentRefund] Notification failed after commit:`, notifyErr.message);
        }
    }

    return {
        success: true,
        message: 'Dispute submitted. The organizer has been notified.',
    };
});

/**
 * Atomically marks remaining balance for a booking as paid on-site or via cash.
 */
exports.settleManualBalance = https.onCall(async (request) => {
    const {
        bookingId,
        userId,
        businessId: inputBusinessId,
        offerId: inputOfferId,
        method = 'cash',
        referenceCode = '',
        adminNote = '',
    } = request.data || {};
    const caller = request.auth;

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId || !userId) throw new HttpsError('invalid-argument', 'bookingId and userId are required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;
    const offerId = inputOfferId || bookingData.offer?.id;

    // Authorization Check
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && (!businessId || adminBusinessId === businessId);
    const isOwner = caller.token.role === 'owner' && (!businessId || adminBusinessId === businessId);
    const isSuperAdmin = caller.token.role === 'superadmin';

    if (!isAdmin && !isOwner && !isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only administrators can settle balances.');
    }

    if (bookingData.status === 'completed' && bookingData.remainingBalance === 0) {
        throw new HttpsError('failed-precondition', 'Remaining balance is already settled and booking is completed.');
    }

    const totalPrice = bookingData.totalPrice || bookingData.offer?.price || 0;
    const payments = bookingData.payment || [];
    const previouslyCaptured = payments.reduce((sum, p) => (p.status === 'captured' ? sum + (p.amount || 0) : sum), 0);
    const balAmount = typeof bookingData.remainingBalance === 'number'
        ? bookingData.remainingBalance
        : Math.max(0, totalPrice - previouslyCaptured);

    const isCash = method === 'cash';
    const fallbackRef = isCash ? `CASH-${Date.now()}` : `SETTLE-${Date.now()}`;
    const resolvedReference = (referenceCode && referenceCode.trim()) ? referenceCode.trim() : fallbackRef;
    const defaultNote = isCash ? 'Settled via Onsite Cash' : 'Remaining Balance Settled';
    const resolvedNote = (adminNote && adminNote.trim()) ? adminNote.trim() : defaultNote;

    const balancePayment = {
        gateway: 'manual_qr',
        method: isCash ? 'cash' : 'manual_qr',
        sessionId: `manual_balance_${Date.now()}`,
        referenceCode: resolvedReference,
        amount: balAmount,
        status: 'captured',
        classification: 'full',
        createdAt: Timestamp.now(),
        paidAt: Timestamp.now(),
        verifiedBy: caller.uid,
        verifiedAt: Timestamp.now(),
        adminNote: resolvedNote,
    };

    let hasPendingPayment = false;
    const updatedPayments = payments.map(p => {
        if (p.status === 'pending') {
            hasPendingPayment = true;
            return {
                ...p,
                amount: p.amount || balAmount,
                status: 'captured',
                classification: 'full',
                method: isCash ? 'cash' : (p.method || 'manual_qr'),
                referenceCode: p.referenceCode || resolvedReference,
                verifiedBy: caller.uid,
                verifiedAt: Timestamp.now(),
                adminNote: resolvedNote,
            };
        }
        return p;
    });

    if (!hasPendingPayment) {
        updatedPayments.push(balancePayment);
    }

    const batch = db.batch();
    batch.update(bookingRef, {
        status: 'completed',
        remainingBalance: 0,
        paymentVerificationStatus: 'fully_paid',
        paymentRejectionReason: FieldValue.delete(),
        payment: updatedPayments,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Atomically add hiker to tour group chat
    if (offerId) {
        try {
            const groupRef = db.collection('groups').doc(offerId);
            const groupSnap = await groupRef.get();
            if (groupSnap.exists) {
                const groupData = groupSnap.data();
                const members = groupData.members || [];
                const alreadyMember = members.some(m => m.id === userId);
                const hikerUser = bookingData.user || {};

                const newMember = {
                    id: userId,
                    username: hikerUser.username || '',
                    firstname: hikerUser.firstname || '',
                    lastname: hikerUser.lastname || '',
                    email: hikerUser.email || '',
                    bookingId,
                };

                const updatedMembers = alreadyMember ? members : [...members, newMember];

                batch.update(groupRef, {
                    participantsIds: FieldValue.arrayUnion(userId),
                    members: updatedMembers,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        } catch (groupErr) {
            console.warn(`[settleManualBalance] Could not update group chat:`, groupErr.message);
        }
    }

    await batch.commit();
    console.log(`[settleManualBalance] Settled remaining balance for booking ${bookingId}`);

    const trailName = bookingData.trail?.name || 'your tour';
    await notifyUser(db, userId, {
        title: 'Balance Settled · Booking Completed',
        body: `Your remaining balance for ${trailName} has been settled in full. Your reservation is completed!`,
        inAppTitle: 'Balance Settled',
        inAppMessage: `Your remaining balance of ₱${balAmount.toFixed(2)} for ${trailName} was settled. Your booking is 100% completed!`,
        type: 'booking_completed',
        metadata: { bookingId, trailName },
        data: { bookingId, userId }
    });

    return {
        success: true,
        remainingBalance: 0,
        status: 'completed',
        message: 'Remaining balance marked as settled and booking completed.',
    };
});

/**
 * Atomically records hiker acceptance of an organizer-initiated cancellation.
 * 1. Updates cancellation document to 'approved' and sets handshakeStep to 'awaiting_admin_refund_decision'.
 * 2. Updates booking document with cancellation acknowledgment.
 */
exports.acceptAdminCancellation = https.onCall(async (request) => {
    const { bookingId, cancellationId, businessId: inputBusinessId } = request.data || {};
    const caller = request.auth;

    if (!caller) throw new HttpsError('unauthenticated', 'Authentication required.');
    if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(caller.uid).collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnap.data();

    const businessId = inputBusinessId || bookingData.business?.id;

    const batch = db.batch();

    // 1. Cancellation Document Update
    let resolvedCancellationRef = null;
    if (cancellationId && businessId) {
        resolvedCancellationRef = db.collection('businesses').doc(businessId).collection('cancellations').doc(cancellationId);
    } else if (businessId) {
        const cSnap = await db.collection('businesses').doc(businessId).collection('cancellations')
            .where('bookingId', '==', bookingId).limit(1).get();
        if (!cSnap.empty) {
            resolvedCancellationRef = cSnap.docs[0].ref;
        }
    }

    if (resolvedCancellationRef) {
        batch.update(resolvedCancellationRef, {
            status: 'approved',
            handshakeStep: 'awaiting_admin_refund_decision',
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    // 2. Booking Update
    batch.update(bookingRef, {
        cancellationReason: 'Cancellation accepted by hiker',
        updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    console.log(`[acceptAdminCancellation] Hiker ${caller.uid} accepted cancellation for booking ${bookingId}`);

    // Alert business admins that hiker accepted the cancellation
    if (businessId) {
        const hikerName = bookingData.user?.firstname || 'The hiker';
        const trailName = bookingData.trail?.name || 'the hike';
        try {
            await notifyBusinessAdmins(db, businessId, {
                title: `Cancellation Accepted - ${trailName}`,
                body: `${hikerName} accepted your hike cancellation for ${trailName}. Ensure proper refund process if necessary.`,
                inAppTitle: `Cancellation Accepted by Hiker`,
                inAppMessage: `${hikerName} has accepted your hike cancellation for ${trailName}. Ensure proper refund process if necessary.`,
                type: 'admin_cancellation_accepted',
                metadata: {
                    bookingId,
                    userId: caller.uid,
                    cancellationId: cancellationId || resolvedCancellationRef?.id || '',
                },
                data: {
                    bookingId,
                    userId: caller.uid,
                }
            });
        } catch (notifyErr) {
            console.warn(`[acceptAdminCancellation] Notification failed after commit:`, notifyErr.message);
        }
    }

    return {
        success: true,
        message: 'Cancellation accepted successfully.',
    };
});

// ─── GROUP-CENTRIC PROGRESSIVE T-MINUS WEATHER ALERT ENGINE ──────────────────
// Monitors active hike groups (/groups/{groupId}) across the T-minus schedule:
// T-168h (7 days), T-72h (3 days), T-24h (1 day with 3-hr watch), T-3h (Departure)
// Saves alerts to /groups/{groupId}/alerts/{alertId} and sends notifications to group.participantsIds

const MOUNTAIN_COORDINATES = {
    tagapo: { lat: 14.3392772, lon: 121.2325293 },
    marami: { lat: 14.1986108, lon: 120.6858334 },
    batulao: { lat: 14.0399434, lon: 120.8023782 },
    makiling: { lat: 14.1352241, lon: 121.1944517 },
    maculot: { lat: 13.9208682, lon: 121.0516961 },
    daraitan: { lat: 14.6152778, lon: 121.4344444 },
    pulag: { lat: 16.5986, lon: 120.8986 },
    ulap: { lat: 16.3267, lon: 120.6406 },
    pinatubo: { lat: 15.1433, lon: 120.3506 },
    pico: { lat: 14.2144, lon: 120.6483 },
};

function resolveMountainCoords(trailName, customCoords) {
    if (customCoords && typeof customCoords.latitude === 'number' && typeof customCoords.longitude === 'number') {
        return { lat: customCoords.latitude, lon: customCoords.longitude };
    }
    if (customCoords && typeof customCoords.lat === 'number' && typeof customCoords.lon === 'number') {
        return { lat: customCoords.lat, lon: customCoords.lon };
    }
    const lower = (trailName || '').toLowerCase();
    for (const [key, coords] of Object.entries(MOUNTAIN_COORDINATES)) {
        if (lower.includes(key)) return coords;
    }
    return null;
}

async function resolveGroupCoordinates(db, group, trailName) {
    // 1. Direct coordinates on group.trail
    const directCoords = group.trail?.coordinates || group.trail?.general?.coordinates;
    const resolvedDirect = resolveMountainCoords(trailName, directCoords);
    if (resolvedDirect) return resolvedDirect;

    // 2. Fetch from Firestore /trails/{trailId}
    const trailId = group.trail?.id;
    if (trailId && db) {
        try {
            const trailDoc = await db.collection('trails').doc(trailId).get();
            if (trailDoc.exists) {
                const trailData = trailDoc.data() || {};
                // Check geography.start (GeoPoint or object with latitude/longitude)
                const geoStart = trailData.geography?.start;
                if (geoStart && typeof geoStart.latitude === 'number' && typeof geoStart.longitude === 'number') {
                    return { lat: geoStart.latitude, lon: geoStart.longitude };
                }
                // Check geography startLat / startLong
                if (typeof trailData.geography?.startLat === 'number' && typeof trailData.geography?.startLong === 'number') {
                    return { lat: trailData.geography.startLat, lon: trailData.geography.startLong };
                }
                // Check direct coordinates or general.coordinates on trail doc
                const trailCoords = trailData.coordinates || trailData.general?.coordinates;
                if (trailCoords) {
                    const lat = typeof trailCoords.latitude === 'number' ? trailCoords.latitude : trailCoords.lat;
                    const lon = typeof trailCoords.longitude === 'number' ? trailCoords.longitude : trailCoords.lon;
                    if (typeof lat === 'number' && typeof lon === 'number') {
                        return { lat, lon };
                    }
                }
            }
        } catch (trailErr) {
            console.warn(`[checkGroupWeatherAlerts] Could not fetch trail document ${trailId}:`, trailErr.message);
        }
    }

    // 3. Fallback to mountain name keyword matching in MOUNTAIN_COORDINATES
    return resolveMountainCoords(trailName, null);
}

function evaluateWeatherSafety(weatherData, trailName, phase, diffHours = 0, hikeDate = null) {
    // Determine the target index in the forecast arrays by exact calendar date if available
    let targetDayIndex = -1;
    if (hikeDate && typeof hikeDate.toISODate === 'function') {
        const hikeIso = hikeDate.toISODate();
        if (Array.isArray(weatherData.daily?.time)) {
            targetDayIndex = weatherData.daily.time.indexOf(hikeIso);
        }
    }
    // Fallback to bounded hours estimation if exact date was not matched
    if (targetDayIndex < 0) {
        targetDayIndex = Math.min(Math.max(0, Math.floor(diffHours / 24)), 6);
    }
    const targetHourIndex = Math.min(Math.max(0, Math.floor(diffHours)), 167);

    let weatherCode = 0;
    let precipProb = 0;
    let windSpeed = 0;
    let uvIndex = 0;
    let temperature = 0;

    if (phase === 'T-3' || phase === 'T-24') {
        // Use hourly data for near-term precision
        weatherCode = weatherData.hourly?.weathercode?.[targetHourIndex] ?? weatherData.daily?.weathercode?.[targetDayIndex] ?? 0;
        precipProb = weatherData.hourly?.precipitation_probability?.[targetHourIndex] ?? weatherData.daily?.precipitation_probability_max?.[targetDayIndex] ?? 0;
        windSpeed = weatherData.hourly?.windspeed_10m?.[targetHourIndex] ?? weatherData.daily?.windspeed_10m_max?.[targetDayIndex] ?? 0;
        temperature = weatherData.hourly?.temperature_2m?.[targetHourIndex] ?? weatherData.current?.temperature_2m ?? 0;
        uvIndex = weatherData.daily?.uv_index_max?.[targetDayIndex] ?? 0; // UV is daily max
    } else {
        // Use daily data for T-72 and T-168
        weatherCode = weatherData.daily?.weathercode?.[targetDayIndex] ?? 0;
        precipProb = weatherData.daily?.precipitation_probability_max?.[targetDayIndex] ?? 0;
        windSpeed = weatherData.daily?.windspeed_10m_max?.[targetDayIndex] ?? 0;
        temperature = weatherData.daily?.temperature_2m_max?.[targetDayIndex] ?? weatherData.current?.temperature_2m ?? 0;
        uvIndex = weatherData.daily?.uv_index_max?.[targetDayIndex] ?? 0;
    }

    const isSevereCode = [65, 75, 82, 85, 86, 95, 96, 99].includes(weatherCode);
    const isRain = precipProb >= 40 || (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
    const isHighWind = windSpeed >= 40;
    const isExtremeUv = uvIndex >= 11;

    const dailyRainMm = weatherData.daily?.precipitation_sum?.[targetDayIndex] ?? 0;
    const isTorrential = dailyRainMm >= 100;

    let status = 'SAFE';
    if (isSevereCode || isTorrential || windSpeed >= 60 || uvIndex >= 13) {
        status = 'DANGER';
    } else if (isRain || isHighWind || isExtremeUv || uvIndex >= 8 || precipProb >= 40) {
        status = 'CAUTION';
    }

    let phasePrefix = '';
    if (phase === 'T-168') phasePrefix = '7-Day Forecast';
    else if (phase === 'T-72') phasePrefix = '3-Day Advisory';
    else if (phase === 'T-24') phasePrefix = 'Eve-of-Hike Update';
    else if (phase === 'T-3') phasePrefix = 'Final Departure Alert';

    let headline = `${phasePrefix}: ${trailName}`;
    let message = `Weather is clear and optimal for your upcoming hike at ${trailName}.`;

    if (status === 'DANGER') {
        headline = `⚠️ Severe Weather Warning: ${trailName} (${phasePrefix})`;
        message = isSevereCode
            ? `Thunderstorms and heavy downpours forecast at ${trailName}. Please check group chat and coordinate with guides.`
            : `Severe weather conditions (${precipProb}% rain, ${Math.round(windSpeed)} km/h wind) expected. High hazard on exposed terrain.`;
    } else if (status === 'CAUTION') {
        headline = `🌧️ Weather Advisory: ${trailName} (${phasePrefix})`;
        message = isRain
            ? `Rain expected (${precipProb}% chance) at ${trailName}. Pack waterproof rain covers and traction footwear.`
            : `Breezy winds (${Math.round(windSpeed)} km/h) or high UV index expected. Prepare appropriate sun protection.`;
    }

    return {
        status,
        headline,
        message,
        metrics: {
            temperature: Math.round(temperature),
            precipitationProbability: precipProb,
            weatherCode,
            windSpeed: Math.round(windSpeed),
            uvIndex: Math.round(uvIndex),
        },
    };
}

async function processGroupWeatherAlert(db, groupDoc, force = false) {
    const group = groupDoc.data();
    const groupId = groupDoc.id;
    const trailName = group.trail?.name || group.trail?.general?.name || 'Scheduled Mountain';
    const nowManila = DateTime.now().setZone('Asia/Manila');

    let hikeDate = null;
    const rawDate = group.offer?.date || group.offer?.startDate || group.date;
    if (rawDate?.toDate) {
        hikeDate = DateTime.fromJSDate(rawDate.toDate()).setZone('Asia/Manila');
    } else if (typeof rawDate === 'string') {
        const trimmed = rawDate.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            // If date-only string (YYYY-MM-DD), default to morning departure 05:00 AM Manila time
            hikeDate = DateTime.fromISO(`${trimmed}T05:00:00`, { zone: 'Asia/Manila' });
        } else {
            hikeDate = DateTime.fromISO(trimmed).setZone('Asia/Manila');
        }
    } else if (typeof rawDate === 'number') {
        hikeDate = DateTime.fromMillis(rawDate).setZone('Asia/Manila');
    }

    // If timestamp was stored with midnight (00:00:00), adjust to standard 05:00 AM departure
    // to prevent the day of the hike from being evaluated as already finished at 6:00 AM
    if (hikeDate && hikeDate.isValid && hikeDate.hour === 0 && hikeDate.minute === 0 && hikeDate.second === 0) {
        hikeDate = hikeDate.set({ hour: 5, minute: 0, second: 0, millisecond: 0 });
    }

    let diffHours = hikeDate && hikeDate.isValid ? hikeDate.diff(nowManila, 'hours').hours : null;

    // Determine T-minus stage
    let currentPhase = null;
    let maxRecheckHours = 24;

    if (diffHours != null) {
        if (diffHours >= 0 && diffHours <= 3) {
            currentPhase = 'T-3';
            maxRecheckHours = 4;
        } else if (diffHours > 3 && diffHours <= 24) {
            currentPhase = 'T-24';
            maxRecheckHours = 3;
        } else if (diffHours > 24 && diffHours <= 72) {
            currentPhase = 'T-72';
            maxRecheckHours = 20;
        } else if (diffHours > 72 && diffHours <= 168) {
            currentPhase = 'T-168';
            maxRecheckHours = 20;
        }
    }

    if (!currentPhase) {
        // Expiration/Cleanup: If hike is over (diffHours < -6), delete stale alerts
        if (diffHours != null && diffHours < -6) {
            console.log(`[checkGroupWeatherAlerts] Hike for group ${groupId} ended. Cleaning up alerts.`);
            const oldAlerts = await db.collection('groups').doc(groupId).collection('alerts').get();
            if (!oldAlerts.empty) {
                const batch = db.batch();
                oldAlerts.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log(`[checkGroupWeatherAlerts] Cleaned up ${oldAlerts.size} alerts for group ${groupId}`);
            }
            return { skipped: true, reason: 'Hike has passed. Cleaned up alerts.' };
        }

        if (force) {
            currentPhase = 'T-168';
            diffHours = 168; // mock 7 days out
        } else {
            return { skipped: true, reason: 'Hike date is outside the 7-day forecast window or date is invalid.', hikeDate: rawDate };
        }
    }

    // Check last alert in /groups/{groupId}/alerts
    if (!force) {
        const lastAlertSnap = await db.collection('groups').doc(groupId).collection('alerts')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!lastAlertSnap.empty) {
            const lastAlert = lastAlertSnap.docs[0].data();
            const lastAlertTime = lastAlert.createdAt?.toDate ? DateTime.fromJSDate(lastAlert.createdAt.toDate()) : null;

            if (lastAlert.phase === currentPhase) {
                // Phase T-3: One-time final departure alert. Once emitted, monitoring is complete.
                if (currentPhase === 'T-3') {
                    return { skipped: true, reason: 'Final pre-departure alert for T-3 has already been issued. Monitoring complete.', phase: currentPhase };
                }

                // If previous alert for current milestone phase was SAFE, sleep until the next milestone phase
                if (lastAlert.status === 'SAFE') {
                    return {
                        skipped: true,
                        reason: `Phase ${currentPhase} conditions are SAFE. Sleeping until next milestone phase. Use force=true to override.`,
                        phase: currentPhase
                    };
                }

                // If previous alert was adverse (CAUTION or DANGER), enforce recheck interval
                // (daily recheck for T-168/T-72; 3-hour watch for T-24)
                if (lastAlertTime) {
                    const hoursSinceLastAlert = nowManila.diff(lastAlertTime, 'hours').hours;
                    if (hoursSinceLastAlert < maxRecheckHours) {
                        return {
                            skipped: true,
                            reason: `Already issued adverse alert for ${currentPhase} ${Math.round(hoursSinceLastAlert)} hours ago (recheck window is ${maxRecheckHours}h). Use force=true to override.`,
                            phase: currentPhase
                        };
                    }
                }
            }
        }
    }

    // Resolve mountain coordinates
    const coords = await resolveGroupCoordinates(db, group, trailName);
    if (!coords) {
        console.log(`[checkGroupWeatherAlerts] No coordinates resolved for ${trailName}`);
        return null;
    }

    const roundLat = coords.lat.toFixed(4);
    const roundLon = coords.lon.toFixed(4);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundLat}&longitude=${roundLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&daily=temperature_2m_max,precipitation_probability_max,windspeed_10m_max,uv_index_max,weathercode,precipitation_sum&timezone=Asia/Manila&forecast_days=7&models=best_match`;

    const res = await fetch(url);
    if (!res.ok) {
        console.error(`[checkGroupWeatherAlerts] Open-Meteo API failed for ${trailName}`);
        return null;
    }

    const weatherData = await res.json();
    const evaluation = evaluateWeatherSafety(weatherData, trailName, currentPhase, diffHours, hikeDate);

    // Save alert document to /groups/{groupId}/alerts/{alertId}
    const alertRef = await db.collection('groups').doc(groupId).collection('alerts').add({
        groupId,
        trailName,
        phase: currentPhase,
        status: evaluation.status,
        headline: evaluation.headline,
        message: evaluation.message,
        metrics: evaluation.metrics,
        hikeDate: rawDate || (hikeDate?.isValid ? hikeDate.toJSDate() : null),
        createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`[checkGroupWeatherAlerts] Created alert ${alertRef.id} for group ${groupId} (${currentPhase}: ${evaluation.status})`);

    // Target ONLY participants of the group
    const participantIds = Array.isArray(group.participantsIds) && group.participantsIds.length > 0
        ? group.participantsIds
        : (group.members || []).map(m => m.id).filter(Boolean);

    if (participantIds.length === 0) {
        return { alertId: alertRef.id, recipientsCount: 0 };
    }

    // Write in-app notifications for all participants
    const userDocs = await Promise.all(
        participantIds.map(id => db.collection('users').doc(id).get())
    );

    const tokenList = [];
    const notificationPromises = [];

    for (const uDoc of userDocs) {
        if (!uDoc.exists) continue;
        const uId = uDoc.id;
        const uData = uDoc.data();

        // 1. In-app notification
        notificationPromises.push(
            db.collection('users').doc(uId).collection('notifications').add({
                title: evaluation.headline,
                message: evaluation.message,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                    type: 'weather_alert',
                    groupId,
                    alertId: alertRef.id,
                    trailName,
                    phase: currentPhase,
                    severity: evaluation.status,
                    precipitationProbability: evaluation.metrics.precipitationProbability,
                    uvIndex: evaluation.metrics.uvIndex,
                }
            })
        );

        // 2. Collect tokens
        const userTokens = uData.fcmTokens || [];
        userTokens.forEach(t => {
            const tok = typeof t === 'string' ? t : t.token;
            if (tok) tokenList.push({ userId: uId, token: tok });
        });
    }

    await Promise.all(notificationPromises);

    // Multicast push notifications
    const uniqueTokens = [...new Set(tokenList.map(t => t.token))];
    if (uniqueTokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: uniqueTokens,
            notification: {
                title: evaluation.headline,
                body: evaluation.message,
            },
            data: {
                type: 'weather_alert',
                groupId,
                alertId: alertRef.id,
                trailName,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    icon: 'notification_icon',
                    color: '#2E7D32',
                    clickAction: 'fcm.ACTION.HELLO',
                },
            },
            apns: {
                payload: {
                    aps: {
                        contentAvailable: true,
                        sound: 'default',
                        priority: 10,
                    },
                },
            },
        });

        // Cleanup stale tokens
        const tokensToRemove = [];
        response.responses.forEach((r, idx) => {
            if (!r.success) {
                const errCode = r.error?.code;
                if (errCode === 'messaging/registration-token-not-registered' || errCode === 'messaging/invalid-registration-token') {
                    tokensToRemove.push(uniqueTokens[idx]);
                }
            }
        });

        if (tokensToRemove.length > 0) {
            for (const uDoc of userDocs) {
                if (!uDoc.exists) continue;
                const existingTokens = uDoc.data().fcmTokens || [];
                const cleaned = existingTokens.filter(t => {
                    const tokStr = typeof t === 'string' ? t : t.token;
                    return !tokensToRemove.includes(tokStr);
                });
                if (cleaned.length !== existingTokens.length) {
                    await db.collection('users').doc(uDoc.id).update({ fcmTokens: cleaned });
                }
            }
        }
    }

    return {
        alertId: alertRef.id,
        phase: currentPhase,
        status: evaluation.status,
        recipientsCount: participantIds.length,
    };
}

// Scheduled Cron: Runs hourly to check groups across T-168, T-72, T-24, and T-3
exports.checkHikeWeatherAlerts = functions.pubsub
    .schedule('0 * * * *')
    .timeZone('Asia/Manila')
    .onRun(async () => {
        console.log('[checkHikeWeatherAlerts] Running Group T-minus weather monitor...');
        const db = admin.firestore();

        try {
            const activeGroupsSnap = await db.collection('groups')
                .where('status', '==', 'active')
                .get();

            if (activeGroupsSnap.empty) {
                console.log('[checkHikeWeatherAlerts] No active groups found.');
                return null;
            }

            console.log(`[checkHikeWeatherAlerts] Evaluating ${activeGroupsSnap.size} active groups...`);
            for (const doc of activeGroupsSnap.docs) {
                await processGroupWeatherAlert(db, doc);
            }

            // Also clean up alerts from archived groups that have concluded
            try {
                const archivedGroupsSnap = await db.collection('groups')
                    .where('status', '==', 'archived')
                    .limit(25)
                    .get();

                for (const aDoc of archivedGroupsSnap.docs) {
                    const oldAlerts = await db.collection('groups').doc(aDoc.id).collection('alerts').get();
                    if (!oldAlerts.empty) {
                        const batch = db.batch();
                        oldAlerts.docs.forEach(alertDoc => batch.delete(alertDoc.ref));
                        await batch.commit();
                    }
                }
            } catch (archiveErr) {
                console.warn('[checkHikeWeatherAlerts] Error cleaning up archived groups:', archiveErr.message);
            }

            console.log('[checkHikeWeatherAlerts] Completed cycle.');
            return null;
        } catch (err) {
            console.error('[checkHikeWeatherAlerts] Error in weather monitoring cron:', err);
            return null;
        }
    });

// HTTP Test Endpoint: Allows 1-click test for any group or custom trail
exports.testGroupWeatherAlert = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        const groupId = req.query.groupId || req.body.groupId;
        const trailName = req.query.trail || req.body.trail || 'Mt. Daraitan';
        const userId = req.query.userId || req.body.userId;
        const force = req.query.force === 'true' || req.body.force === true;

        if (groupId) {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            if (!groupDoc.exists) {
                res.status(404).json({
                    error: `Group ${groupId} not found in this Firebase project (${process.env.GCLOUD_PROJECT}).`,
                    tip: 'Check if this group was created in staging (thrail-sandbox) vs production (thrail).'
                });
                return;
            }
            const result = await processGroupWeatherAlert(db, groupDoc, force);
            res.status(200).json({ success: true, result });
            return;
        }

        // Direct test by trail & user
        const coords = resolveMountainCoords(trailName, null) || MOUNTAIN_COORDINATES.batulao;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index&daily=precipitation_probability_max,windspeed_10m_max,uv_index_max,weathercode&timezone=Asia/Manila&forecast_days=1&models=best_match`;

        const weatherRes = await fetch(url);
        const weatherData = await weatherRes.json();
        const evaluation = evaluateWeatherSafety(weatherData, trailName, 'T-24');

        if (userId) {
            await db.collection('users').doc(userId).collection('notifications').add({
                title: evaluation.headline,
                message: evaluation.message,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                    type: 'weather_alert',
                    trailName,
                    phase: 'T-24',
                    severity: evaluation.status,
                    precipitationProbability: evaluation.metrics.precipitationProbability,
                    uvIndex: evaluation.metrics.uvIndex,
                },
            });
        }

        res.status(200).json({
            success: true,
            trailName,
            evaluation,
            note: userId ? `Notification added to user ${userId}` : 'No userId provided; evaluation returned only.',
        });
    } catch (err) {
        console.error('[testGroupWeatherAlert] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Triggers initial personalized recommendation generation whenever a user completes onboarding.
 * Listens for changes to /users/{userId}. When 'onBoardingComplete' transitions to true,
 * it checks if recommendations exist for the current month. If missing, it securely calls the
 * THARESYS recommendation engine server-to-server.
 */
exports.onUserOnboardingComplete = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
        const userId = context.params.userId;
        const afterData = change.after.exists ? change.after.data() : null;
        const beforeData = change.before.exists ? change.before.data() : null;

        if (!afterData) return null;

        // Trigger only when onBoardingComplete becomes true
        const justCompleted = afterData.onBoardingComplete === true &&
            (!beforeData || beforeData.onBoardingComplete !== true);

        if (!justCompleted) return null;

        // Current calendar month YYYY-MM in UTC
        const now = new Date();
        const monthId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

        // Verify if recommendations already exist to avoid duplicate work
        const recoSnap = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('recommendations')
            .doc(monthId)
            .get();

        if (recoSnap.exists) {
            console.log(`[onUserOnboardingComplete] Recommendations already exist for user ${userId} in ${monthId}`);
            return null;
        }

        console.log(`[onUserOnboardingComplete] User ${userId} completed onboarding. Calling THARESYS engine for ${monthId}...`);

        const engineBaseUrl = process.env.THARESYS_ENGINE_URL ||
            (process.env.FUNCTIONS_EMULATOR ? "http://127.0.0.1:8000" : "http://localhost:8000");
        const apiKey = process.env.THARESYS_API_KEY || "";

        try {
            const url = `${engineBaseUrl.replace(/\/+$/, '')}/api/users/${userId}/initial-recommendation`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'X-THARESYS-KEY': apiKey } : {})
                },
                body: JSON.stringify({
                    user_id: userId,
                    month_id: monthId,
                    generate_ai_reasoning: true,
                    commit_to_firestore: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[onUserOnboardingComplete] THARESYS engine error (${response.status}): ${errorText}`);
                return null;
            }

            const result = await response.json();
            console.log(`[onUserOnboardingComplete] Initial recommendations successfully generated for ${userId}:`, result.status);
            return result;
        } catch (err) {
            console.error(`[onUserOnboardingComplete] Failed contacting THARESYS engine for ${userId}:`, err.message);
            return null;
        }
    });

exports.approveReschedule = approveReschedule;
exports.removeUserFromGroupOnCancellation = removeUserFromGroupOnCancellation;
exports.onDeleteBooking = onDeleteBooking;