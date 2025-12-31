const {setGlobalOptions} = require("firebase-functions");
const {onRequest, HttpsError} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const functions = require('firebase-functions/v1')
const { onUserCreated } = require("firebase-functions/v2/identity");
const { user } = require("firebase-functions/v1/auth");
const { onCall } = require('firebase-functions/v2/https'); 
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

exports.setDefaultUserRole = functions.auth.user().onCreate(async (user) => {
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
    const { businessId } = request.data;
    const caller = request.auth;
    const db = admin.firestore();
    
    if(!caller) throw new Error('Authentication required');

    if(caller.token.role !== 'admin') throw new Error('Permission denied, only admin can create admin accounts');

    try{
        await admin.auth().setCustomUserClaims(businessId, {
            role: 'admin',
            businessId
        });

        const userRef = db.collection('users').doc(businessId);
        const doc = await userRef.get();

        if(!doc.exists){
            throw new HttpsError('Not found', 'Business document does not exists');
        }

        await userRef.update({
            updatedAt: FieldValue.serverTimestamp(),
            role: 'admin',
            businessId
        })

        console.log(`User ${doc.data().uid} made admin for ${businessId}`);
        return { uid: businessId };
    } catch (error) {
        console.error('Error setting default role: ', error);
        throw new Error(error.message);
    }
});

exports.createBusiness = onCall(async (request) => {
    const { email, businessName } = request.data;
    const caller = request.auth;
    const db = admin.firestore();

    const generatedEmail = `${businessName}@thrail.com`;
    const tempPass = crypto.randomBytes(8).toString('hex');

    if(!caller) throw new Error('Authentication Required');

    if(caller.token.role !== 'superadmin') throw new Error('Permission denied, only superadmin can create admin accounts');

    if(!email) throw new Error('Business email required');

    try {
        const userRecord = await admin.auth().createUser({
            email: generatedEmail,
            ownerEmail: email,
            password: tempPass,
            businessName: businessName
        });

        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: 'business'
        });

        await admin.firestore()
            .collection('businesses')
            .doc(userRecord.uid)
            .set({
                businessId: userRecord.uid,
                email: generatedEmail,
                ownerEmail: email,
                role: 'business',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            })

        const businessRef = db.collection('businesses').doc(userRecord.uid);
        const doc = await businessRef.get();

        if(!doc.exists){
            throw new HttpsError('not-found', 'Business document does not exists');
        }

        const data = doc.data();

        console.log('Doc: ', data);

        return { 
            businessId: data.businessId,
            businessName: businessName,
            businessEmail: data.email,
            tempPass: tempPass
        }
    } catch (err) {
        throw new HttpsError('Failed creating business account', err);
    }
})