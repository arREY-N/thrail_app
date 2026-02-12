import { db } from '@/src/core/config/Firebase';
import { PaymentUI } from '@/src/types/entities/Payment';
import { ReceiptUI } from '@/src/types/entities/Receipt';
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { BaseRepository } from '../interface/repositoryInterface';
import { PaymentMapper } from '../mapper/paymentMapper';
import { ReceiptMapper } from '../mapper/receiptMapper';

class PaymentRepositoryImpl implements BaseRepository<PaymentUI>{
    fetchAll(): Promise<PaymentUI[]> {
        throw new Error('Method not implemented.');
    }
    
    async fetchById(id: string): Promise<any> {
        try {
            const paymentRef = doc(db, 'payments', id);
            const snap = await getDoc(paymentRef)

            return {
                id: snap.id,
                ...snap.data()
            }
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error(`Failed fetching payment ${id}`)
        }
    }

    async write(data: PaymentUI): Promise<PaymentUI> {
        try{
            const paymentRef = doc(db, 'payments', data.receiptId);
            
            const dbData = PaymentMapper.toDB(data);
            
            const finalDb = { ...dbData, id: paymentRef.id }

            await setDoc(
                paymentRef,
                finalDb,
                {merge: false}
            );
        
            return PaymentMapper.toUI(finalDb);
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

export async function createPayment(
    paymentData: PaymentUI
){
}

export async function fetchPayment(
    id: string
){
    
}

export async function createReceipt(
    amount: number,
    mode: string
): Promise<ReceiptUI>{
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