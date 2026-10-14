import { db } from "@/src/core/config/Firebase";
import { Application } from "@/src/core/models/Application/interfaces/Application.types";
import { applicationConverter } from "@/src/core/models/Application/utils/ApplicationFactory";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const createApplicationCollection = (db: any) => {
    return collection(db, "applications").withConverter(applicationConverter);
};

export const ApplicationRepository = (db: any) => ({
    /**
     * Fetches all submitted applications.
     */
    async fetchAll(): Promise<Application[]> {
        try {
            const col = createApplicationCollection(db);
            const snapshot = await getDocs(col);
            if (snapshot.empty) return [];
            return snapshot.docs.map((docSnap) => docSnap.data());
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching applications");
        }
    },

    /**
     * Fetches an application by its ID.
     */
    async fetchById(id: string): Promise<Application | null> {
        try {
            const col = createApplicationCollection(db);
            const docRef = doc(col, id);
            const docSnap = await getDoc(docRef);
            return docSnap.data() || null;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching application");
        }
    },

    /**
     * Submits and creates a new application.
     */
    async write(data: Application): Promise<Application> {
        try {
            const col = createApplicationCollection(db);
            const docRef = data.id ? doc(col, data.id) : doc(col);

            const q = query(col, where("applicant.id", "==", data.owner.id));
            const querySnapshot = await getDocs(q);

            const app = querySnapshot.docs.find((a) => a.data().owner.id === data.owner.id);

            if (app) {
                throw new Error(`Application is ${app?.data().status}`);
            }

            const newApp: Application = { ...data, id: docRef.id };

            await setDoc(docRef, newApp, { merge: true });

            return newApp;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed creating application");
        }
    },

    /**
     * Updates existing application details or status.
     */
    async update(data: Application): Promise<Application> {
        try {
            const col = createApplicationCollection(db);
            const docRef = doc(col, data.id);

            data.id = docRef.id;

            await setDoc(docRef, data, { merge: true });

            return data;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed updating application");
        }
    },

    /**
     * Deletes an application by its ID.
     */
    async delete(id: string): Promise<void> {
        try {
            const col = createApplicationCollection(db);
            const docRef = doc(col, id);
            await deleteDoc(docRef);
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed deleting application");
        }
    },
});

export const ApplicationRepo = ApplicationRepository(db);

