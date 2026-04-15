const admin = require("firebase-admin");
const {setGlobalOptions} = require("firebase-functions/v2");
const { https } = require("firebase-functions/v2");
const { HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const functions = require('firebase-functions/v1')
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const cors = require('cors')({origin: true});
const { FieldPath } = admin.firestore;


const paymongoSecret = defineSecret('PAYMONGO_SECRET_KEY');
const { Buffer } = require('buffer');

admin.initializeApp();

setGlobalOptions({ 
    region: 'us-central1', 
    maxInstances: 10 
});

exports.onAddBooking = functions.firestore
    .document('users/{userId}/bookings/{bookingId}')
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();
        const { userId } = context.params;

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
    }
);

exports.onBookingStatusChange = functions.firestore
    .document('users/{userId}/bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        console.log(before, after);
        
        if (before.status === after.status) return;

        const { userId } = context.params;

        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();

        const tokens = userDoc.data()?.fcmTokens || [];

        console.log(tokens.length, 'tokens found for user:', userId);
        if (!tokens.length) return;

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
        console.log(`Booking status change notification sent to ${response.successCount} tokens, ${response.failureCount} failures for user: ${userId}`);
    }
);

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
    const { userId, businessId } = request.data;
    const caller = request.auth;
    const db = admin.firestore();
    
    if(!caller) throw new Error('Authentication required');
    
    if(!userId) throw new Error('User ID required');
    
    if(!businessId) throw new Error('Business ID required');

    if(caller.token.role !== 'admin' && caller.token.owner !== businessId) 
        throw new Error('Permission denied, only business owners can create admin accounts');

    try{
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
        throw new Error(error.message);
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

 exports.createPaymongoCheckout = https.onCall({ secrets: [paymongoSecret] }, async (request) => {
     const { amount, type, returnUrl } = request.data;
     const auth = request.auth;

     if (!auth) throw new HttpsError('unauthenticated', 'Authentication Required');
     if (!amount || !type) throw new HttpsError('invalid-argument', 'Amount and type are required');
     if (!['gcash', 'paymaya', 'maya'].includes(type)) throw new HttpsError('invalid-argument', 'Invalid payment type');

     const PAYMONGO_SECRET_KEY = paymongoSecret.value();

     if (!PAYMONGO_SECRET_KEY) {
         throw new HttpsError('internal', 'Server configuration error: PayMongo Secret Key missing in environment.');
     }

     const encodedKey = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');
    
     // PayMongo uses 'paymaya' internally
     const sourceType = type === 'maya' ? 'paymaya' : type;
     const redirectUrl = returnUrl || 'thrailapp://';

     try {
         const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Basic ${encodedKey}`
             },
             body: JSON.stringify({
                 data: {
                     attributes: {
                         send_email_receipt: false,
                         show_description: false,
                         show_line_items: true,
                         line_items: [
                             {
                                 currency: 'PHP',
                                 amount: Math.round(amount * 100),
                                 name: 'Booking Payment',
                                 quantity: 1
                             }
                         ],
                         payment_method_types: [sourceType],
                         success_url: redirectUrl,
                         cancel_url: redirectUrl
                     }
                 }
             })
         });

         if (!response.ok) {
             const errorDetails = await response.text();
             console.error('PayMongo API Error Details:', errorDetails);
            
            if (response.status === 401 || response.status === 403) {
                throw new Error("Payment service is currently unavailable. Please notify the Thrail administrators.");
            }
            if (response.status >= 500) {
                throw new Error("GCash/Maya is currently experiencing temporary system downtime. Please try again in a few minutes.");
            }

             let paymongoError = null;
             try {
                 const parsed = JSON.parse(errorDetails);
                 if (parsed.errors && parsed.errors.length > 0) {
                     paymongoError = parsed.errors[0];
                 }
             } catch (e) {
                 // Silently fails, falls back to generic timeout/network error below
             }

             if (paymongoError) {
                 const code = paymongoError.code || '';
                 const detail = paymongoError.detail || '';
                 const pointer = paymongoError.source?.pointer || '';

                if (code === 'AMOUNT_EXCEED_LIMIT' || (pointer === 'amount' && detail.toLowerCase().includes('exceed'))) {
                    throw new Error("This booking exceeds the ₱100,000 maximum transaction limit for GCash/Maya. Please use a different payment method or pay in installments.");
                }
                if (code === 'parameter_invalid' && pointer === 'amount' && detail.toLowerCase().includes('least')) {
                    throw new Error("The booking amount (or 50% downpayment) is too small. The minimum payment required by GCash/Maya is ₱100.");
                }
                if (code === 'parameter_format_invalid' && pointer === 'return_url') {
                    throw new Error("An internal routing error occurred while generating your booking checkout. Please try again.");
                }
                if (code === 'SYSTEM_ERROR' || code === 'PY0016') {
                    throw new Error("GCash/Maya is currently experiencing temporary system downtime. Please try again in a few minutes.");
                }
                
                 // Fallback for an unmapped PayMongo error
                 throw new Error(detail || "An unexpected error occurred with the payment gateway.");
             }
            
             throw new Error("Could not connect to the payment gateway. Please check your internet connection and try booking again.");
         }

        const data = await response.json();
        return {
            id: data.data.id,
            checkout_url: data.data.attributes.checkout_url,
            status: 'pending'
        };
    } catch (err) {
        console.error("PayMongo Checkout Session Failed: ", err);
        throw new HttpsError('internal', err.message || 'Failed to initialize PayMongo checkout');
    }
});

exports.paymongoRedirect = functions.https.onRequest((req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        res.status(400).send("Missing URL parameter");
        return;
    }

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