const {setGlobalOptions} = require("firebase-functions");
const {onRequest, HttpsError} = require("firebase-functions/https");
const admin = require("firebase-admin");
const functions = require('firebase-functions/v1')
const { onUserCreated } = require("firebase-functions/v2/identity");
const { user } = require("firebase-functions/v1/auth");
const { onCall } = require('firebase-functions/v2/https'); 
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');
const { log } = require("console");
const { request } = require("http");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });


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

exports.createAdmin = onCall(async (request) => {
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

exports.createBusiness = onCall(async (request) => {
    const { data, applicationId } = request.data;
    const auth = request.auth;

    if (!auth) throw new HttpsError('unauthenticated', 'Authentication Required');
    if (auth.token.role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Only superadmins can approve applications');
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

exports.deleteUser = onCall(async (request) => {
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

exports.checkEmail = onCall(async (request) => {
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