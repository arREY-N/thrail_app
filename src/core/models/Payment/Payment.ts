// COMMENTED FOR NOW IN CASE THERE ARE DEPENDENCIES, WILL DELETE LATER IF NOT NEEDED ANYMORE

// import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
// import { immerable } from "immer";
// import { toDate } from "../../utility/date";
// import { IBusinessSummary } from "../Business/Business.types";
// import { IOfferSummary } from "../Offer/Offer.types";
// import { IUserSummary } from "../User/User.types";
// import { IPayment, IPaymentDB, IReceipt } from "./Payment.types";

// export class Payment implements IPayment {
//     [key: string]: any;
//     [immerable] = true
//     id: string = '';
//     createdAt: Date = new Date();
//     updatedAt: Date = new Date();
//     business: IBusinessSummary = {
//         id: "",
//         name: ""
//     };
//     receipt: IReceipt<Date> = {
//         id: "",
//         amount: 0,
//         date: new Date(),
//         gateway: "",
//         referenceCode: "",
//     };
//     offer: IOfferSummary<Date> = {
//         date: new Date(0),
//         price: 0
//     };
//     user: IUserSummary ={
//         id: "",
//         username: "",
//         firstname: "",
//         lastname: "",
//         email: ""
//     };

//     constructor(init?: Partial<IPayment>){
//         Object.assign(this, init);
//     }

//     static fromFirestore(id: string, data: IPaymentDB): Payment{
//         const mapped: IPayment = {
//             ...data,
//             id,
//             createdAt: toDate(data.createdAt),
//             updatedAt: toDate(data.updatedAt),
//             receipt: {
//                 ...data.receipt,
//                 date: toDate(data.receipt.date),
//                 referenceCode: data.receipt.referenceCode || "",
//             },
//             offer: {
//                 ...data.offer,
//                 date: toDate(data.offer.date),
//             },
//         };

//         return new Payment(mapped);
//     }

//     toFirestore(): IPaymentDB {
//         const isNew = this.id === '';

//         const mapped: IPaymentDB = {
//             id: this.id,
//             createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
//             updatedAt: serverTimestamp(),
//             receipt: {
//                 ...this.receipt,
//                 date: Timestamp.fromDate(this.receipt.date),
//                 referenceCode: this.receipt.referenceCode,
//             },
//             offer: {
//                 ...this.offer,
//                 date: Timestamp.fromDate(this.offer.date),
//             },
//             business: this.business,
//             user: this.user,
//         }

//         return mapped;
//     }
// }

// export const paymentConverter: FirestoreDataConverter<Payment> = {
//     toFirestore: (payment: Payment) => {
//         return payment.toFirestore();
//     },
//     fromFirestore: (snapshot: QueryDocumentSnapshot): Payment => {
//         const data = snapshot.data() as IPaymentDB;
//         return Payment.fromFirestore(snapshot.id, data);
//     }
// }