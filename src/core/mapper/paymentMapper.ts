import { PaymentDB, PaymentUI } from "@/src/types/entities/Payment";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { toDate } from "../utility/date";

export const PaymentMapper = {
    toUI(data: PaymentDB): PaymentUI {
        return {
            id: data.id,
            receiptId: data.receipt.id,
            amount: data.receipt.amount,
            mode: data.receipt.mode,
            createdAt: toDate(data.createdAt),
            receiptDate: toDate(data.receipt.date),
            userId: data.user.id,
            lastname: data.user.lastname,
            firstname: data.user.firstname,
            email: data.user.email,
            businessId: data.business.id,
            businessName: data.business.name,
            offerId: data.offer.id,
            trail: data.offer.trail,
            offerDate: toDate(data.offer.date)

        }
    },
    toDB(data: PaymentUI): PaymentDB {
        return {
            id: data.id,
            receipt: {
                id: data.receiptId,
                amount: data.amount,
                date: Timestamp.fromDate(new Date(data.receiptDate)),
                mode: data.mode,
            }, 
            user: {
                id: data.userId,
                lastname: data.lastname,
                firstname: data.firstname,
                email: data.email,
            },
            business: {
                id: data.businessId,
                name: data.businessName
            },
            offer: {
                id: data.offerId,
                trail: data.trail,
                date: Timestamp.fromDate(new Date(data.offerDate)),
            },
            createdAt: serverTimestamp(), 
        }
    }
}