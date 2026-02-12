import { db } from '@/src/core/config/Firebase';
import { UserDB, UserUI } from '@/src/types/entities/User';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BaseRepository } from '../interface/repositoryInterface';
import { UserMapper } from '../mapper/userMapper';

const usersCollection = collection(db, 'users').withConverter({
    toFirestore: (user: UserDB) => user,
    fromFirestore: (snapshot): UserDB => snapshot.data() as UserDB
})

class UserRepositoryImpl implements BaseRepository<UserUI>{
    async fetchAll(): Promise<UserUI[]> {
        try{
            const snapshot = await getDocs(usersCollection);

            return snapshot.docs.map((docsnap) => UserMapper.toUI({
                ...docsnap.data(),
                id: docsnap.id,
            }));

        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching all users.');
        }
    }

    async fetchById(id: string): Promise<UserUI | null> {
        try {
            const snap = await getDoc(doc(usersCollection, id));
            if(!snap.exists()) return null;

            return UserMapper.toUI({
                id: snap.id,
                ...snap.data()
            })
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user.');
        }
    }

    async write(data: UserUI): Promise<UserUI> {
        try {
            const docRef = data.id
                ? doc(usersCollection, data.id)
                : doc(usersCollection)

            const user = UserMapper.toDB({ id: docRef.id, ...data});

            await setDoc(docRef, data, { merge: true });

            return UserMapper.toUI(user);
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

    async fetchByEmail(email: string): Promise<UserUI[] | []>{
        try {
            const q = query(usersCollection, where('email', '==', email));
            
            const querySnapshot = await getDocs(q);

            if(querySnapshot.empty){
                return [];
            }

            return querySnapshot.docs.map((docsnap) => UserMapper.toUI({
                id: docsnap.id,
                ...docsnap.data()
            }));
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error(`An error occurred while fetching user with email ${email}`)
        }
    }
}

export const UserRepository = new UserRepositoryImpl();
// /**
//  * Fetch user by ID 
//  * @param {string} id
//  * @returns {Promise<User|null}>
//  */
// export async function fetchUserById(id){
//     try {
//         const ref = doc(db, 'users', id);
//         const snap = await getDoc(ref);

//         if(!snap.exists()) return null;

//         return {
//             id: snap.id,
//             ...snap.data()
//         }
//     } catch (err) {
//         throw new Error('Failed to fetch user ', id);
//     }
// }

// export async function fetchUsers(){
    
// }

// export async function fetchUserByEmail(email){
//     try {
//         const userRef = collection(db, 'users');
//         const q = query(userRef, where('email', '==', email));
        
//         const querySnapshot = await getDocs(q);

//         if(querySnapshot.empty){
//             return null;
//         }

//         const results = querySnapshot.docs.map((docsnap) => ({
//             id: docsnap.id,
//             ...docsnap.data()
//         }))

//         return results[0];
//     } catch (err) {
//         throw new Error(err.message ?? 'Failed fetching', email)
//     }
// }

// export async function deleteUser(id){
//     const functions = getFunctions();

//     const deleteAccount = httpsCallable(functions, 'deleteUser');

//     try {
//         const result = await deleteAccount({userId: id});
//         return result.data.success;
//     } catch (err) {
//         throw new Error(err.message ?? 'Failed deleting ', id)
//     }
// }