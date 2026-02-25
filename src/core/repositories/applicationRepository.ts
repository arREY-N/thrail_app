import { db } from '@/src/core/config/Firebase';
import { ApplicationMapper } from '@/src/core/mapper/applicationMapper';
import { Application, applicationConverter } from '@/src/types/entities/Application';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { BaseRepository } from '../interface/repositoryInterface';

export const applicationCollection = collection(db, 'applications').withConverter(applicationConverter);

export interface ApplicationRepository extends BaseRepository<Application>{}

class ApplicationRepositoryImpl implements ApplicationRepository{
    async fetchAll(...args: any[]): Promise<Application[]> {
        try{
            const snapshot = await getDocs(applicationCollection);
            if(snapshot.empty) return [];
            console.log(snapshot);
            return snapshot.docs.map(doc => doc.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching applications');
        }    
    }

    async fetchById(id: string, ...args: any[]): Promise<Application | null> {
        try {
            const docRef = doc(applicationCollection, id);
            const docsnap = await getDoc(docRef);
            return docsnap.data() || null;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching application')
        }
    }

    async write(data: Application, ...args: any[]): Promise<Application> {
        try{
            const docref = data.id
                ? doc(applicationCollection, data.id)
                : doc(applicationCollection);

            const docsnap = await getDoc(docref);

            const q = query(applicationCollection, where('applicant.id', '==', data.userId));
            const querySnapshot = await getDocs(q);

            const app = querySnapshot.docs.find(app => app.data().userId === data.userId);

            if(app){
                throw new Error(`Application is ${app?.data().status}`);
            }

            const application = ApplicationMapper.toDB({
                ...data,
                id: docref.id, 
            });

            await setDoc(docref, application, {merge: true});
            
            data.id = docref.id;
            
            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed creating application');
        }    
    }

    async update(data: Application, ...args: any[]): Promise<Application> {
        try{
            const docref = doc(applicationCollection, data.id);

            const application = ApplicationMapper.toDB({
                ...data,
                id: docref.id, 
            });

            await setDoc(docref, application, {merge: true});

            data.id = docref.id;

            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed creating application');
        }    
    }

    async delete(id: string, ...args: any[]): Promise<void> {
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