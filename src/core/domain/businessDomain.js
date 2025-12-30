import { app } from '@/src/core/config/Firebase';
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(app);
const createAdminFn = httpsCallable(functions, 'createAdmin');

async function createAdmin(email, password, businessId){
    const res = await createAdminFn({email, password, businessId});
    console.log('Admin created UID: ', res.data.uid);
}