import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { BaseRepository } from '../interface/repositoryInterface';
import { Payment, paymentConverter } from '../models/Payment/Payment';

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
): Promise<void>{
    try {
        const docRef = doc(collection(db, 'receipts'));
        
        const data = {
            id: docRef.id,
            date: serverTimestamp(),
            amount,
            mode: 'GCash',
        }
        await setDoc(docRef, data);

        // return ReceiptMapper.toUI(data);
    } catch (err) {
        if(err instanceof Error) throw err;
        throw new Error('Failed creating receipt');
    }
}

// export const ReceiptMapper = {
//     toUI(data: Receip): ReceiptUI {
//         return {
//             id: data.id,
//             amount: data.amount,
//             date: (data.date && (data.date as any).toDate === 'function')
//                 ? timestampToISO(data.date)
//                 : new Date().toISOString(),
//             mode: data.mode,
//         }
//     }, 
//     toDB(data: ReceiptUI): ReceiptDB {
//         return {
//             id: data.id,
//             amount: data.amount,
//             date: Timestamp.fromDate(new Date(data.date)),
//             mode: data.mode,
//         }
//     }
// }