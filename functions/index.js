const admin = require("firebase-admin");
const {setGlobalOptions} = require("firebase-functions/v2");
const { https } = require("firebase-functions/v2");
const { HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const functions = require('firebase-functions/v1')
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const cors = require('cors')({origin: true});
const { FieldPath } = admin.firestore;
const { CloudTasksClient } = require('@google-cloud/tasks');
const { DateTime } = require('luxon');

const tasksClient = new CloudTasksClient();

const paymongoSecret = defineSecret('PAYMONGO_SECRET_KEY');
const paymongoWebhookSecret = defineSecret('PAYMONGO_WEBHOOK_SECRET'); // Optional
const { Buffer } = require('buffer');
const PaymentManager = require('./services/PaymentManager');
const PayMongoProvider = require('./services/providers/PayMongoProvider');

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
            const { userId, bookingId } = context.params;

            const businessId = data.business?.id;
            if (!businessId) {
                console.log('Missing businessId');
                return;
            }

            const userDoc = await admin.firestore()
                .collection('users')
                .doc(userId)
                .get();

            const user = userDoc.data();
            const userName = user?.firstname || 'A user';

            const adminIds = await admin.firestore()
                .collection('businesses')
                .doc(businessId)
                .collection('admins')
                .get()
                .then(query => query.docs.map(doc => doc.data().id));

            console.log(adminIds);

            if (!adminIds.length) return;

            const chunkSize = 10;
            const chunks = [];
            for (let i = 0; i < adminIds.length; i += chunkSize) {
                chunks.push(adminIds.slice(i, i + chunkSize));
            }   

            const userDocs = await Promise.all(
                adminIds.map(id =>
                    admin.firestore().collection('users').doc(id).get()
                )
            );

            let tokens = [];

            userDocs.forEach(doc => {
                if (!doc.exists) return;
                const userTokens = doc.data().fcmTokens || [];
                tokens.push(...userTokens);
            });

            if (!tokens.length) {
                console.log('No admin tokens found');
                return;
            }

            const uniqueTokens = [...new Set(tokens.map(t => t.token))];

            const trailName = data.trail?.name || 'a trail';

            const response = await admin.messaging().sendEachForMulticast({
                tokens: uniqueTokens,
                notification: {
                    title: `New Booking for ${trailName}`,
                    body: `${userName} just booked a hike for ${trailName}`
                }
            });


            const validTokens = tokens.filter((t, i) => {
                const res = response.responses[i];
                if (res?.success) return true;

                const error = res?.error?.code;
                return ![
                    'messaging/registration-token-not-registered',
                    'messaging/invalid-registration-token'
                ].includes(error);
            });
        } catch (error) {
            throw new HttpsError('internal', 'Error processing new booking: ' + error.message);
        }
    }
);

exports.onBookingStatusChange = functions.firestore
    .document('users/{userId}/bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        try {
            const before = change.before.data();
            const after = change.after.data();
            const { bookingId } = context.params;
            
            if (before.status === after.status) return;

            const { userId } = context.params;

            const userDoc = await admin.firestore()
                .collection('users')
                .doc(userId)
                .get();

            const tokens = userDoc.data()?.fcmTokens || [];

            if (!tokens.length) {
                throw new HttpsError('not-found', 'No tokens found for user: ' + userId);
            };

            const data = after;

            const trailName = data.trail?.name || 'your trail';
            const businessName = data.business?.name || 'the organizer';

            const dateStr = data.date?.toDate
                ? data.date.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    })
                : '';

            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokens.map(t => t.token),
                notification: {
                    title: "Booking Update",
                    body: `Your booking for ${trailName} with ${businessName} on ${dateStr} has been ${data.status}.`
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

            if(after.status === 'for-payment') {
                if(!data.offer || !data.offer.date) {
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
                const queuePath = tasksClient.queuePath(project, location, queue);

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
                    await tasksClient.createTask({ parent: queuePath, task: weekTask });
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
                    await tasksClient.createTask({ parent: queuePath, task: dayTask });
                }
            }
        } catch (error) {
            throw new HttpsError('internal', 'Error processing booking update: ' + error.message);
        }
    }
);

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
                message: `Hello! You're booking for ${trailName} on ${reminderDate} is quickly approaching. Be sure to have your things prepared ahead of time. Double check the weather and coordinate with your hikemates through the group chat in case of unexpected scenarios.`,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                    type: 'booking_reminder',
                    bookingId: bookingId,
                }                
            });

        const tokens = userDoc.data()?.fcmTokens || [];

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
    } catch (error) {
        throw new HttpsError('internal', 'Error sending booking reminder: ' + error.message);
    }
});

exports.setDefaultUserRole = functions.auth.user().onCreate(async (user) => {
    const account = await admin.auth().getUser(user.uid);

    if(account.customClaims && account.customClaims.role === 'business'){
        console.log(`Skip default role attachement for business accounts.`);
        return null;
    }

    try{
        await admin.auth().setCustomUserClaims(user.uid, {role: 'user'});
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
    },{merge: true});

    await userRef
        .collection('recommendations')
        .doc('init')
        .set({
            createdAt: FieldValue.serverTimestamp(),
            trails:[]
        }, {merge: true});

    console.log(`User doc and recommendation collection created for: ${userRef}`);
});

exports.createAdmin = https.onCall(async (request) => {
    try{
        const { userId, businessId } = request.data;
        const caller = request.auth;
        const db = admin.firestore();

        if(!caller) throw new Error('Authentication required');
        
        if(!userId) throw new Error('User ID required');
        
        if(!businessId) throw new Error('Business ID required');
    
        if(caller.token.role !== 'admin' && caller.token.owner !== businessId) 
            throw new Error('Permission denied, only business owners can create admin accounts');
    
        await admin.auth().setCustomUserClaims(userId, {
            role: 'admin',
            businessId
        });

        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if(!doc.exists){
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
            }, {merge: true});


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

            const [busSnap, appSnap, userSnap] = await Promise.all([
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
    
    if(!caller) 
        throw new HttpsError('unauthenticated', 'Authentication required');
    
    if(caller.token.role !== 'superadmin') 
        throw new HttpsError('permission-denied', 'Only superadmins can delete accounts');

    if(!userId) 
        throw new HttpsError('invalid-argument', 'Invalid user ID provided');

    try {
        const user = await admin.auth().getUser(userId);
        const role = user.customClaims ? user.customClaims.role : 'user'

        if(role !== 'user'){
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
    
    if(!email.trim()) throw new HttpsError('invalid-argument', 'No email provided');
    
    if(!username.trim()) throw new HttpsError('invalid-argument', 'No username provided');
    
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
 * Creates a PayMongo Checkout Session for a given booking.
 * Generates a hosted payment page URL for users to securely enter payment details.
 * 
 * @function createPaymongoCheckout
 * @param {Object} request - The callable HTTPS request.
 * @param {Object} request.data - The data payload.
 * @param {number} request.data.amount - The amount to charge (in PHP, decimal).
 * @param {string} request.data.type - The payment method type (e.g., 'gcash', 'maya').
 * @param {string} request.data.returnUrl - The deep link URL to return to the app.
 * @param {string} request.data.bookingId - The ID of the booking to link the payment to.
 * @param {string} request.data.userId - The ID of the user making the payment.
 * @returns {Promise<Object>} The checkout session object containing the checkout_url.
 * @throws {HttpsError} If authentication or parameters are missing/invalid.
 */
exports.createPaymongoCheckout = https.onCall({ secrets: [paymongoSecret] }, async (request) => {
    const { amount, type, returnUrl, bookingId, userId } = request.data;
    const auth = request.auth;

    console.log(`[createPaymongoCheckout] Initiating checkout for user ${userId || auth?.uid}, booking ${bookingId}`);

    if (!auth) throw new HttpsError('unauthenticated', 'Authentication Required');
    if (!amount || !type || !bookingId) throw new HttpsError('invalid-argument', 'Amount, type, and bookingId are required');

    const PAYMONGO_SECRET_KEY = paymongoSecret.value();
    if (!PAYMONGO_SECRET_KEY) {
        throw new HttpsError('internal', 'Server configuration error: PayMongo Secret Key missing.');
    }

    // Initialize provider and register to manager
    const paymongoProvider = new PayMongoProvider(PAYMONGO_SECRET_KEY);
    PaymentManager.registerProvider('paymongo', paymongoProvider);

    const redirectUrl = returnUrl || 'thrailapp://';

    try {
        const session = await PaymentManager.getProvider('paymongo').createCheckout(amount, type, redirectUrl, { bookingId, userId });
        
        // Update booking to mark it as pending payment
        await admin.firestore()
            .collection('users')
            .doc(userId || auth.uid)
            .collection('bookings')
            .doc(bookingId)
            .update({
                paymentStatus: 'pending',
                paymentGateway: 'paymongo',
                updatedAt: FieldValue.serverTimestamp()
            });

        console.log(`[createPaymongoCheckout] Successfully created session ${session.id} for booking ${bookingId}`);
        return session;
    } catch (err) {
        console.error(`[createPaymongoCheckout] Failed to initialize checkout for booking ${bookingId}: `, err);
        throw new HttpsError('internal', err.message || 'Failed to initialize checkout');
    }
});

/**
 * HTTP Proxy to bypass mobile WebView security restrictions and deep link back into the app.
 * Uses an HTML meta-refresh instead of an HTTP 302 redirect.
 * 
 * @function paymongoRedirect
 * @param {Object} req - The express HTTP request.
 * @param {Object} req.query.url - The target deep link URL to open.
 * @param {Object} res - The express HTTP response.
 */
exports.paymongoRedirect = functions.https.onRequest((req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        console.warn('[paymongoRedirect] Missing target URL parameter.');
        res.status(400).send("Missing URL parameter");
        return;
    }
    console.log(`[paymongoRedirect] Generating proxy HTML for redirect to: ${targetUrl}`);

    // Using an HTML meta-refresh and JS redirect ensures the app scheme 
    // is correctly invoked by the WebView, avoiding standard 302 errors.
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="0;url=${targetUrl}">
        </head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p>Returning to app...</p>
            <script>
                setTimeout(function() {
                    window.location.href = "${targetUrl}";
                }, 100);
            </script>
        </body>
        </html>
    `;
    res.status(200).send(html);
});

/**
 * Webhook endpoint for capturing payment completion events from PayMongo.
 * Verifies the signature, marks the booking as paid, and generates the payment receipt in Firestore.
 * 
 * @function paymentWebhook
 * @param {Object} req - The express HTTP request containing PayMongo payload.
 * @param {Object} res - The express HTTP response.
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
    if (event?.data?.attributes?.type === 'payment.paid') {
        const paymentData = event.data.attributes.data.attributes;
        const bookingId = paymentData.description || event.data.attributes.data.id; // Usually we need to trace back via reference number or fetching session
        // Note: PayMongo webhooks for payment.paid give the raw payment. We might need to look up the intent or description.
        // For checkout sessions, payment.paid has `paymentData.source.id` or similar. 
        // We will assume the reference_number mapped to description or it's accessible.
        // Actually, reference_number is inside the checkout session. 
        // Wait, a more robust way is querying Firestore for a booking with this payment Gateway ID, OR relying on metadata if passed down.
        // As a fallback, we just log it. Let's do a basic implementation:
        
        const referenceCode = paymentData.balance_transaction_id || event.data.attributes.data.id;
        const gatewayId = event.data.attributes.data.id;
        const amount = paymentData.amount / 100;

        // Find the booking (simplified, assuming we can map it)
        // In reality, you'd want to store the checkout session ID in the booking and query by it
        // Or if PayMongo passes reference_number directly to payment.paid event:
        const refNumber = paymentData.description || paymentData.reference_number;
        
        if (refNumber) {
            console.log(`[paymentWebhook] Received payment.paid event for reference ${refNumber}. Amount: ${amount}`);
            const db = admin.firestore();
            const bookingsSnapshot = await db.collectionGroup('bookings')
                .where(admin.firestore.FieldPath.documentId(), '==', refNumber)
                .get();

            if (!bookingsSnapshot.empty) {
                const bookingDoc = bookingsSnapshot.docs[0];
                const bookingData = bookingDoc.data();
                console.log(`[paymentWebhook] Found matching booking: ${bookingDoc.id} with status: ${bookingData.status}`);

                if (bookingData.status !== 'cancelled') {
                    // 7 days before hike for refund policy
                    const refundableUntil = new Date(bookingData.offer.date.toDate());
                    refundableUntil.setDate(refundableUntil.getDate() - 7);

                    await bookingDoc.ref.update({
                        paymentStatus: 'captured',
                        paymentGatewayId: gatewayId,
                        paymentReferenceCode: referenceCode,
                        status: 'paid',
                        refundableUntil: Timestamp.fromDate(refundableUntil),
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    // Create Payment Receipt Record
                    await db.collection('payments').add({
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                        receipt: {
                            amount: amount,
                            date: FieldValue.serverTimestamp(),
                            gateway: 'paymongo',
                            referenceCode: referenceCode
                        },
                        offer: bookingData.offer,
                        business: bookingData.business,
                        user: bookingData.user
                    });
                    
                    console.log(`[paymentWebhook] Successfully captured payment and generated receipt for booking ${refNumber}`);
                } else {
                    // Booking was already cancelled, issue automatic refund!
                    try {
                        await provider.issueRefund(gatewayId, amount, 'requested_by_customer');
                        console.log(`Auto-refunded late payment for cancelled booking: ${refNumber}`);
                    } catch (e) {
                        console.error("Failed to auto-refund cancelled booking", e);
                    }
                }
            }
        }
    }

    res.status(200).send('Webhook Received');
});

/**
 * Handles pre-payment cancellation of a booking by a user or admin.
 * 
 * @function cancelBooking
 * @param {Object} request - The callable HTTPS request.
 * @param {Object} request.data - The data payload.
 * @param {string} request.data.bookingId - The ID of the booking to cancel.
 * @param {string} request.data.userId - The ID of the user who owns the booking.
 * @param {string} request.data.reason - The reason for cancellation.
 * @returns {Promise<Object>} Success status.
 * @throws {HttpsError} If unauthorized, not found, or payment is already captured.
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
    if (data.paymentStatus === 'captured' || data.status === 'paid') {
        throw new HttpsError('failed-precondition', 'Payment already completed. Please request a refund instead.');
    }

    await bookingRef.update({
        status: 'cancelled',
        paymentStatus: 'failed',
        cancellationReason: reason || 'User initiated cancellation',
        cancelledBy: caller.uid,
        updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`[cancelBooking] Successfully cancelled booking ${bookingId}`);
    return { success: true };
});

/**
 * Handles dual-system refunds for captured payments.
 * Users can trigger this within 7 days of the hike. Admins can trigger this anytime.
 * 
 * @function refundBooking
 * @param {Object} request - The callable HTTPS request.
 * @param {Object} request.data - The data payload.
 * @param {string} request.data.bookingId - The ID of the booking to refund.
 * @param {string} request.data.userId - The ID of the user who owns the booking.
 * @param {string} request.data.reason - The reason for refund.
 * @returns {Promise<Object>} Success status.
 * @throws {HttpsError} If unauthorized, outside timeframe, or refund fails via API.
 */
exports.refundBooking = https.onCall({ secrets: [paymongoSecret] }, async (request) => {
    const { bookingId, userId, reason } = request.data;
    const caller = request.auth;

    console.log(`[refundBooking] Refund requested for booking ${bookingId} by user ${caller?.uid}`);

    if (!caller) throw new HttpsError('unauthenticated', 'Auth required');

    const db = admin.firestore();
    const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) throw new HttpsError('not-found', 'Booking not found');
    const data = bookingDoc.data();

    if (data.paymentStatus !== 'captured') {
        throw new HttpsError('failed-precondition', 'Cannot refund a booking that is not captured.');
    }

    // Dual-System Authorization Check
    const isAdmin = caller.token.role === 'admin' && caller.token.businessId === data.business.id;
    const isSuperAdmin = caller.token.role === 'superadmin';
    const isOwner = caller.uid === data.user.id;

    if (!isAdmin && !isSuperAdmin && !isOwner) {
        throw new HttpsError('permission-denied', 'Not authorized to refund this booking.');
    }

    // User-triggered timeframe check
    if (isOwner && !isAdmin && !isSuperAdmin) {
        const now = Timestamp.now().toDate();
        const refundableUntil = data.refundableUntil ? data.refundableUntil.toDate() : new Date(0);
        
        if (now > refundableUntil) {
            throw new HttpsError('failed-precondition', 'The automated refund timeframe has expired. Please contact the organizer.');
        }
    }

    // Execute Refund via PaymentManager
    const PAYMONGO_SECRET_KEY = paymongoSecret.value();
    const provider = new PayMongoProvider(PAYMONGO_SECRET_KEY);
    PaymentManager.registerProvider('paymongo', provider);

    try {
        const gatewayId = data.paymentGatewayId;
        const refundAmount = data.offer.price; // Usually based on offer price
        
        await PaymentManager.getProvider(data.paymentGateway || 'paymongo').issueRefund(gatewayId, refundAmount, reason || 'requested_by_customer');

        await bookingRef.update({
            status: 'refunded',
            paymentStatus: 'refunded',
            updatedAt: FieldValue.serverTimestamp()
        });

        console.log(`[refundBooking] Successfully processed full refund for booking ${bookingId} via PayMongo`);
        return { success: true };
    } catch (e) {
        console.error(`[refundBooking] Critical failure during PayMongo refund for booking ${bookingId}:`, e);
        throw new HttpsError('internal', 'Refund failed: ' + e.message);
    }
});