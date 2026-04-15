import { db } from "@/src/core/config/Firebase";
import { BaseRepository } from "@/src/core/interface/repositoryInterface";
import { Hike, hikeConverter } from "@/src/core/models/Hike/Hike";
import { Location, locationConverter } from "@/src/core/models/Location/Location";
import { Unsubscribe } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, Timestamp } from "firebase/firestore";

const createHikesCollection = (userId: string) => {
    return collection(db, 'users', userId, 'hikes').withConverter(hikeConverter);
}

class HikeRepositoryImpl implements BaseRepository<Hike>{
    async fetchAll(userId: string): Promise<Hike[]> {
        try {
            const userHikesRef = createHikesCollection(userId);
            
            const snapshot = await getDocs(userHikesRef);

            if(snapshot.empty) return [];

            return snapshot.docs.map(doc => doc.data());
        } catch (err) {
            console.error('Error fetching hikes: ', err);
            throw new Error(err instanceof Error ? err.message : 'Failed fetching hikes');
        }
    }

    async fetchById(userId: string, hikeId: string): Promise<Hike | null> {
        try {
            const docRef = doc(createHikesCollection(userId), hikeId);
            const snapshot = await getDoc(docRef);

            return snapshot.data() || null;
        } catch (err) {
            console.error('Error fetching hike by ID: ', err);
            throw new Error(err instanceof Error ? err.message : 'Failed fetching hike');
        }
    }

    async write(hike: Hike, userId: string): Promise<Hike> {
        try {
            const docRef = hike.id !== ""
                ? doc(createHikesCollection(userId), hike.id)
                : doc(createHikesCollection(userId));

            const updated = new Hike({
                ...hike,
                id: docRef.id
            });

            await setDoc(
                docRef,
                updated,
                { merge: true }
            );

            return updated;
        } catch (error) {
            console.error('Error writing hike: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed writing hike');
        }
    }

    async writeCoordinates(userId: string, hikeId: string, coordinates: Location[]): Promise<void> {
        try {
            console.log('Writing: ', userId, hikeId, coordinates);
            const coordRef = doc(collection(db, 'users', userId, 'hikes', hikeId, 'coordinates'));
            
            const lastTimestamp = coordinates[coordinates.length -1].timestamp;

            const coordinatesData = coordinates.map(coord => coord.toFirestore());

            console.log({
                coordinates,
                lastCooordinate: lastTimestamp
            });

            await setDoc(
                coordRef,
                {
                    coordinates: coordinatesData,
                    lastCoordinate: Timestamp.fromDate(lastTimestamp),
                },
            )

            console.log(`Successfully wrote ${coordinates.length} coordinates for hike ${hikeId}`);
        } catch (error) {
            console.error('Error writing coordinates: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed writing coordinates');
        }
    }

    async delete(id: string, userId: string): Promise<void> {
        try {
            const docRef = doc(createHikesCollection(userId), id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting hike: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed deleting hike');
        }
    }

    async shareLocation(userId: string, groupId: string, coordinate: Location): Promise<void> {
        try {
            const locationRef = doc(collection(db, 'groups', groupId, 'liveLocations'), userId).withConverter(locationConverter);   

            await setDoc(
                locationRef, 
                coordinate,
                { merge: true }
            );
        } catch (error) {
            console.error('Error sharing location: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed sharing location');
        }
    }

    listenToLocations(groupId: string, onUpdate: (locations: Location[]) => void): Unsubscribe {
        try {
            const q = collection(db, 'groups', groupId, 'liveLocations')
                .withConverter(locationConverter);
    
            return onSnapshot(q, (snapshot) => {
                const locations = snapshot.docs.map(doc => {
                    const locationInstance = doc.data();

                    (locationInstance as any).id = doc.id;  
                    return locationInstance;
                })

                onUpdate(locations);
            });
        } catch (error) {
            console.error('Error sharing location: ', error);
            throw new Error(error instanceof Error ? error.message : 'Failed sharing location');
        }
    }
}

export const HikeRepository = new HikeRepositoryImpl();