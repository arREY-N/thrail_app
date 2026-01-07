const admin = require("firebase-admin");
const serviceAccount = require('./thrail-firebase-adminsdk-fbsvc-eb6a55392a.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'thrail'
});

const SUPERADMIN_ID = "MsHLwRNZWCDqCYZYJDgcsGap01Wv";

async function setSuperAdmin(){
    await admin.auth().setCustomUserClaims(SUPERADMIN_ID, {
        role: 'superadmin',
    });

    console.log('Superadmin assigned');
    process.exit();    
}

setSuperAdmin().catch(console.error);