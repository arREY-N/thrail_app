import { db } from "@/src/core/config/Firebase";
import { Location, locationConverter } from "@/src/core/models/Location/Location";
import { collection, doc, onSnapshot, setDoc, Unsubscribe } from "firebase/firestore";

export interface WriteLocation {
    groupId: string;
    userId: string;
    location: Location;
}

export interface LocationRepositoryInterface {
    listenToLocations(groupId: string, onUpdate: (locations: Location[]) => void): Unsubscribe;
    writeLocation(params: WriteLocation): Promise<void>;
}

class LocationRepositoryImpl implements LocationRepositoryInterface{
    listenToLocations(groupId: string, onUpdate: (locations: Location[]) => void): Unsubscribe {
        const q = collection(db, 'groups', groupId, 'liveLocations')
            .withConverter(locationConverter);

        return onSnapshot(q, (snapshot) => {
            onUpdate(snapshot.docs.map(doc => doc.data()));
        });
    }

    async writeLocation(params: Omit<WriteLocation, 'groupId'>): Promise<void> {
        const { userId, location } = params;   

        try {
            const docRed = doc(collection(db, 'user'))
        } catch (error) {
            console.error('LocationRepository Error:', error);
            throw error;
        }
    }

    async liveFeedLocation(params: WriteLocation): Promise<void> {
        const { groupId, userId, location } = params;
        
        try {
            if(!groupId || !userId) {  
                throw new Error('Missing required parameters');
            }

            if(!location || !location.longitude || !location.latitude || !location.altitude) {
                throw new Error('Invalid location data');
            }

            const locRef = collection(db, 'groups', groupId, 'liveLocations');

            const docRef = doc(locRef, userId).withConverter(locationConverter);
            
            await setDoc(
                docRef, 
                location,
                { merge: true }
            );

        } catch (error) {
            console.log('LocationRepository Error:', error);
        }
    }
}

export const LocationRepository = new LocationRepositoryImpl();