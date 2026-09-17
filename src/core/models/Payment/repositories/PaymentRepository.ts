import { db } from "@/src/core/config/Firebase";
import { Payment } from "@/src/core/models/Payment/interfaces/Payment.types";
import { newPayment, paymentConverter } from "@/src/core/models/Payment/utils/PaymentFactory";
import {
    collection,
    deleteDoc,
    doc,
    Firestore,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Unsubscribe,
    where,
} from "firebase/firestore";

export const PaymentRepository = (db: Firestore) => {
    const createPaymentCollection = () => {
        return collection(db, "payments").withConverter(paymentConverter);
    };

    return {
        async fetchAll(): Promise<Payment[]> {
            try {
                const colRef = createPaymentCollection();
                const snapshot = await getDocs(colRef);

                if (snapshot.empty) return [];
                return snapshot.docs.map((d) => d.data());
            } catch (error) {
                console.error("Failed to fetch payments:", error);
                if (error instanceof Error) throw error;
                throw new Error("Failed to fetch payments");
            }
        },

        async fetchById(id: string): Promise<Payment | null> {
            try {
                const colRef = createPaymentCollection();
                const docRef = doc(colRef, id);
                const snapshot = await getDoc(docRef);

                if (!snapshot.exists()) return null;
                return snapshot.data();
            } catch (error) {
                console.error(`Failed to fetch payment with id ${id}:`, error);
                if (error instanceof Error) throw error;
                throw new Error(`Failed to fetch payment ${id}`);
            }
        },

        async fetchByUserId(userId: string): Promise<Payment[]> {
            try {
                const colRef = createPaymentCollection();
                const q = query(colRef, where("user.id", "==", userId));
                const snapshot = await getDocs(q);

                if (snapshot.empty) return [];
                return snapshot.docs.map((d) => d.data());
            } catch (error) {
                console.error(`Failed to fetch payments for user ${userId}:`, error);
                if (error instanceof Error) throw error;
                throw new Error(`Failed to fetch payments for user ${userId}`);
            }
        },

        async fetchByBusinessId(businessId: string): Promise<Payment[]> {
            try {
                const colRef = createPaymentCollection();
                const q = query(colRef, where("business.id", "==", businessId));
                const snapshot = await getDocs(q);

                if (snapshot.empty) return [];
                return snapshot.docs.map((d) => d.data());
            } catch (error) {
                console.error(`Failed to fetch payments for business ${businessId}:`, error);
                if (error instanceof Error) throw error;
                throw new Error(`Failed to fetch payments for business ${businessId}`);
            }
        },

        listenToUserPayments(userId: string, onUpdate: (payments: Payment[]) => void): Unsubscribe {
            try {
                const colRef = createPaymentCollection();
                const q = query(colRef, where("user.id", "==", userId));

                return onSnapshot(
                    q,
                    (snapshot) => {
                        onUpdate(snapshot.docs.map((d) => d.data()));
                    },
                    (error) => {
                        console.error("Failed to listen to user payments:", error);
                    }
                );
            } catch (error) {
                console.error("Failed to listen to user payments:", error);
                throw error;
            }
        },

        async write(data: Payment): Promise<Payment> {
            try {
                let payment = data;
                const colRef = createPaymentCollection();
                const docId = data.id || data.receipt?.id;
                const docRef = docId ? doc(colRef, docId) : doc(colRef);

                if (!payment.id) {
                    payment = newPayment({ ...payment, id: docRef.id });
                }

                await setDoc(docRef, payment, { merge: true });
                return payment;
            } catch (error) {
                console.error("Failed to write payment:", error);
                if (error instanceof Error) throw error;
                throw new Error("Failed creating payment document");
            }
        },

        async delete(id: string): Promise<void> {
            try {
                const colRef = createPaymentCollection();
                const docRef = doc(colRef, id);
                await deleteDoc(docRef);
            } catch (error) {
                console.error(`Failed to delete payment ${id}:`, error);
                if (error instanceof Error) throw error;
                throw new Error(`Failed to delete payment ${id}`);
            }
        },
    };
};

export const PaymentRepo = PaymentRepository(db);
