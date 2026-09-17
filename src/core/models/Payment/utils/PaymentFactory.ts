import { IPaymentDB, Payment } from "@/src/core/models/Payment/interfaces/Payment.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newPayment = (init?: Partial<Payment>): Payment => {
    return {
        id: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        receipt: {
            id: "",
            amount: 0,
            date: new Date(),
            gateway: "",
            referenceCode: "",
            ...init?.receipt,
            ...(init?.receipt?.date ? { date: toDate(init.receipt.date) } : {}),
        },
        offer: {
            date: new Date(),
            price: 0,
            ...init?.offer,
            ...(init?.offer?.date ? { date: toDate(init.offer.date) } : {}),
        },
        business: {
            id: "",
            name: "",
            ...init?.business,
        },
        user: {
            id: "",
            username: "",
            firstname: "",
            lastname: "",
            email: "",
            ...init?.user,
        },
    };
};

const paymentFromFirestore = (id: string, data: IPaymentDB): Payment => {
    return {
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        business: data.business ?? { id: "", name: "" },
        receipt: {
            id: data.receipt?.id ?? "",
            amount: data.receipt?.amount ?? 0,
            date: toDate(data.receipt?.date),
            gateway: data.receipt?.gateway ?? "",
            referenceCode: data.receipt?.referenceCode || "",
        },
        offer: {
            date: toDate(data.offer?.date),
            price: data.offer?.price ?? 0,
        },
        user: data.user ?? { id: "", username: "", firstname: "", lastname: "", email: "" },
    };
};

const paymentToFirestore = (payment: Payment): IPaymentDB => {
    const isNew = payment.id === "";

    return {
        id: payment.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(toDate(payment.createdAt)),
        updatedAt: serverTimestamp(),
        business: payment.business,
        receipt: {
            ...payment.receipt,
            date: Timestamp.fromDate(toDate(payment.receipt.date)),
            referenceCode: payment.receipt.referenceCode,
        },
        offer: {
            ...payment.offer,
            date: Timestamp.fromDate(toDate(payment.offer.date)),
        },
        user: payment.user,
    };
};

export const paymentConverter: FirestoreDataConverter<Payment> = {
    toFirestore: (payment: Payment) => {
        return paymentToFirestore(payment);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Payment => {
        const data = snapshot.data() as IPaymentDB;
        return paymentFromFirestore(snapshot.id, data);
    },
};
