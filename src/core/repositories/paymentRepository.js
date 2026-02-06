import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function createPayment(paymentData){
    try{
        const paymentRef = doc(db, 'payments', paymentData.receipt.id);
        await setDoc(paymentRef, {
            id: paymentRef.id,
            ...paymentData,
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

export async function createReceipt(amount){
    try {
        const docRef = doc(collection(db, 'receipts'));
        
        await setDoc(docRef, {
            reference: docRef.id, 
            createdAt: serverTimestamp(),
            amount
        });

        return docRef.id;
    } catch (err) {
        console.log(err.message);
        throw new Error(err.message || 'Failed creating receipt');
    }
}