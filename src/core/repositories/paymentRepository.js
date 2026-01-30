import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function createPayment(paymentData){
    try{
        const paymentRef = doc(collection(db, 'payments'));
        await setDoc(paymentRef, {
            ...paymentData,
            id: paymentRef.id,
            createdAt: serverTimestamp(),
        });

        return paymentRef.id;
    } catch (err){
        console.log(err.message)
        throw new Error(err.message || 'Failed creating payment document');
    }
}

export async function fetchPayment(id){
    try {
        const paymentRef = doc(db, 'payments', id);
        const snap = await getDoc(paymentRef)

        return {
            id: snap.id,
            ...snap.data()
        }
    } catch (err) {
        console.log(err.message);
        throw new Error(err.message || 'Failed fetching payment ', id)
    }
}