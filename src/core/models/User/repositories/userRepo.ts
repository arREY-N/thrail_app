import { userConverter, userFromDB } from "@/src/core/models/User/User";
import { IUser } from "@/src/core/models/User/User.types";
import { collection, getDocs } from "firebase/firestore";

export const UserRepo = (db: any) => ({
    async fetchAll(): Promise<IUser[]> {
        try {
            const userCollection = collection(db, 'users').withConverter(userConverter);
            
            const userSnapshots = await getDocs(userCollection);

            return userSnapshots.docs.map(userDoc => userFromDB(userDoc.id, userDoc.data()));
        } catch (err) {
            console.error('Error fetching users: ', err);
            throw new Error(err instanceof Error ? err.message : 'Failed fetching users');
        }
    }
});