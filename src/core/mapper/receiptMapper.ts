import { ReceiptDB, ReceiptUI } from "@/src/types/entities/Receipt";
import { Timestamp } from "firebase/firestore";
import { timestampToISO } from "../utility/date";

export const ReceiptMapper = {
    toUI(data: ReceiptDB): ReceiptUI {
        return {
            id: data.id,
            amount: data.amount,
            date: (data.date && (data.date as any).toDate === 'function')
                ? timestampToISO(data.date)
                : new Date().toISOString(),
            mode: data.mode,
        }
    }, 
    toDB(data: ReceiptUI): ReceiptDB {
        return {
            id: data.id,
            amount: data.amount,
            date: Timestamp.fromDate(new Date(data.date)),
            mode: data.mode,
        }
    }
}