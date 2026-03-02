import { db } from '@/src/core/config/Firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { BaseRepository } from '../interface/repositoryInterface';
import { Application, applicationConverter } from '../models/Application/Application';

export const applicationCollection = collection(db, 'applications').withConverter(applicationConverter);

export interface ApplicationRepository extends BaseRepository<Application>{}

class ApplicationRepositoryImpl implements ApplicationRepository{
    async fetchAll(): Promise<Application[]> {
        try{
            const snapshot = await getDocs(applicationCollection);
            if(snapshot.empty) return [];
            return snapshot.docs.map(doc => doc.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching applications');
        }    
    }

    async fetchById(id: string): Promise<Application | null> {
        try {
            const docRef = doc(applicationCollection, id);
            const docsnap = await getDoc(docRef);
            return docsnap.data() || null;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching application')
        }
    }

    async write(data: Application): Promise<Application> {
        try{
            const docref = data.id
                ? doc(applicationCollection, data.id)
                : doc(applicationCollection);

            const q = query(applicationCollection, where('applicant.id', '==', data.owner.id));
            const querySnapshot = await getDocs(q);

            const app = querySnapshot.docs.find(app => app.data().owner.id === data.owner.id);

            if(app){
                throw new Error(`Application is ${app?.data().status}`);
            }

            data.id = docref.id;

            await setDoc(docref, data, {merge: true});
        
            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed creating application');
        }    
    }

    async update(data: Application): Promise<Application> {
        try{
            const docref = doc(applicationCollection, data.id);
            
            data.id = docref.id;

            await setDoc(docref, data, {merge: true});

            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed creating application');
        }    
    }

    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(applicationCollection, id);
            await deleteDoc(docRef);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed deleting application')
        }       
    }
}

export const ApplicationRepository = new ApplicationRepositoryImpl();