import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { BaseRepository } from '../interface/repositoryInterface';
import { ReceiptMapper } from '../mapper/receiptMapper';
import { Payment, paymentConverter } from '../models/Payment/Payment';
import { IReceipt } from '../models/Payment/Payment.types';

const paymentCollection = collection(db, 'payments').withConverter(paymentConverter);
class PaymentRepositoryImpl implements BaseRepository<Payment>{
    fetchAll(): Promise<Payment[]> {
        throw new Error('Method not implemented.');
    }
    
    async fetchById(id: string): Promise<any> {
        try {
            const paymentRef = doc(paymentCollection, id);
            const snap = await getDoc(paymentRef)

            return snap.data()
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error(`Failed fetching payment ${id}`)
        }
    }

    async write(data: Payment): Promise<Payment> {
        try{
            const paymentRef = doc(paymentCollection, data.receipt.id);
        
            await setDoc(
                paymentRef,
                data,
                {merge: false}
            );
        
            return data;
        } catch (err){
            if(err instanceof Error) throw err;
            throw new Error('Failed creating payment document');
        }
    }

    delete(id: string): Promise<void> {
        throw new Error('Method unavailable for Payment.');
    }
}

export const PaymentRepository = new PaymentRepositoryImpl();


export async function createReceipt(
    amount: number,
    mode: string
): Promise<IReceipt<Date>>{
    try {
        const docRef = doc(collection(db, 'receipts'));
        
        const data = {
            id: docRef.id,
            date: serverTimestamp(),
            amount,
            mode: 'GCash',
        }
        await setDoc(docRef, data);

        return ReceiptMapper.toUI(data);
    } catch (err) {
        if(err instanceof Error) throw err;
        throw new Error('Failed creating receipt');
    }
}