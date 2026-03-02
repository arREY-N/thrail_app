import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BaseRepository } from '../interface/repositoryInterface';
import { User, userConverter } from '../models/User/User';

const usersCollection = collection(db, 'users').withConverter(userConverter)

class UserRepositoryImpl implements BaseRepository<User>{
    async fetchAll(): Promise<User[]> {
        try{
            const snapshot = await getDocs(usersCollection);
            return snapshot.docs.map(docsnap=> docsnap.data());
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching all users.');
        }
    }

    async fetchById(id: string): Promise<User | null> {
        try {
            const snap = await getDoc(doc(usersCollection, id));
            if(!snap.exists()) return null;
            return snap.data()
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user.');
        }
    }

    async write(data: User): Promise<User> {
        try {
            const docRef = data.id
                ? doc(usersCollection, data.id)
                : doc(usersCollection)
                
            if(!data.id) data.id = docRef.id;
            
            await setDoc(docRef, data, { merge: true });
            
            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while writing user')
        }
    }

    async delete(id: string): Promise<any> {
        const functions = getFunctions();

        const deleteAccount = httpsCallable(functions, 'deleteUser');

        try {
            const result = await deleteAccount({userId: id});

            return result;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('An error occured while deleting user');
        }
    }

    async fetchByEmail(email: string): Promise<User[]>{
        try {
            const q = query(usersCollection, where('email', '==', email));
            
            const querySnapshot = await getDocs(q);

            if(querySnapshot.empty) return [];

            return querySnapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error(`An error occurred while fetching user with email ${email}`)
        }
    }
}

export const UserRepository = new UserRepositoryImpl();