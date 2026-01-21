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
                id: userId
            }, {merge: true});


        console.log(`User ${doc.data().uid} made admin for ${businessId}`);
        return { user: doc.data().uid };
    } catch (error) {
        console.error('Error setting default role: ', error);
        throw new Error(error.message);
    }
});

exports.createBusiness = onCall(async (request) => {
    const { active, userId, appId, email, businessName, address, province } = request.data;
    const caller = request.auth;

    try {
        console.log(request.data);
        if(!caller) {
            console.log('!caller');
            throw new Error('Authentication Required');
        }
        
        if(caller.token.role !== 'superadmin') {
            console.log('!== superadmin');
            throw new Error('Permission denied, only superadmin can create admin accounts');
        }
        
        if(!province) {
            console.log('Province missing')
            throw new Error('Please fill up all information');
        } 
        
        if(!address) {
            console.log('Address missing')
            throw new Error('Please fill up all information');
        } 
        
        if(!appId) {
            console.log('AppId missing')
            throw new Error('Please fill up all information');
        } 
        
        if(!userId) {
            console.log('UserId missing')
            throw new Error('Please fill up all information');
        } 
        
        if(!businessName) {
            console.log('Business Name missing')
            throw new Error('Please fill up all information');
        } 
        
        if(!email) {
            console.log('Email missing')
            throw new Error('Please fill up all information');
        } 
        
        const db = admin.firestore();
    
        const busRef = db.collection('businesses').doc(userId);
        const bus = await busRef.get();

        const application = db.collection('applications').doc(appId);
        const app = await application.get();
        
        if(bus.exists && app.data().approved) { 
            console.log('Approved')
            throw new Error('Application already approved');
        }

        console.log('Creating user claims')

        await admin.auth().setCustomUserClaims(userId, {
            role: 'admin',
            owner: userId
        });

        console.log('Creating business document')

        await db.collection('businesses').doc(userId).set({
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            id: userId,
            businessName: businessName,
            address,
            province,
            active: active === true
        },{merge: true});

        const businessRef = db.collection('businesses').doc(userId);
        const doc = await businessRef.get();
        
        if(!doc.exists) 
            throw new HttpsError('not-found', 'Business document does not exists');
        
        console.log('Creating admins folder')

        await businessRef.collection('admins').doc('owner').set({
                assignedAt: FieldValue.serverTimestamp(),
                id: userId
            },{merge: true});

        console.log('Setting application to true')

        await db.collection('applications').doc(appId).set({
                approved: true
            }, {merge: true});

        await db.collection('users').doc(userId).set({
            role: 'admin'
        }, {merge: true});

        return doc.data();
    } catch (err) {
        throw new HttpsError('Failed creating business account', err.message);
    }
})

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