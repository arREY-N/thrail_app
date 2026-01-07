import { db } from '@/src/core/config/Firebase';
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

export async function createPayment(paymentData){
    try{
        console.log(paymentData);

        const paymentRef = doc(collection(db, 'payments'));
        await setDoc(paymentRef, {
            ...paymentData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, {merge: true});

        return paymentRef.id;
    } catch (err){
        console.log(err.message)
        throw new Error(err.message || 'Failed creating payment document');
    }
}