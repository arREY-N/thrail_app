import { db } from '@/src/core/config/Firebase';
import { ApplicationMapper } from '@/src/core/mapper/applicationMapper';
import { ApplicationDB, ApplicationUI } from '@/src/types/entities/Application';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { BaseRepository } from '../interface/repositoryInterface';

export const applicationCollection = collection(db, 'applications').withConverter({
    toFirestore: (application: ApplicationDB) => application,
    fromFirestore: (snapshot): ApplicationDB => snapshot.data() as ApplicationDB
});

export interface ApplicationRepository extends BaseRepository<ApplicationUI>{

}

class ApplicationRepositoryImpl implements ApplicationRepository{
    async fetchAll(...args: any[]): Promise<ApplicationUI[]> {
        try{
            const snapshot = await getDocs(applicationCollection);

            if(snapshot.empty) return [];

            return snapshot.docs.map((docsnap) => ApplicationMapper.toUI(docsnap.data()));
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching applications');
        }    
    }

    async fetchById(id: string, ...args: any[]): Promise<ApplicationUI | null> {
        try {
            const docRef = doc(applicationCollection, id);

            const docsnap = await getDoc(docRef);

            if(!docsnap.exists()) return null;

            return ApplicationMapper.toUI(docsnap.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching application')
        }
    }

    async write(data: ApplicationUI, ...args: any[]): Promise<ApplicationUI> {
        try{
            const docref = doc(applicationCollection, data.id)
            const docsnap = await getDoc(docref);

            if(docsnap.exists())
                throw new Error('You have already submitted an application.');

            const application = ApplicationMapper.toDB(data);

            await setDoc(docref, application, {merge: true});

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