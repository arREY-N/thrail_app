import { db } from '@/src/core/config/Firebase';
import { collection, collectionGroup, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { Booking, bookingConverter } from '../models/Booking/Booking';

const createBookingCollection = (id: string) => {
    return collection(db, 'users', id, 'bookings').withConverter(bookingConverter);
}

class BookingRepostoryImpl {
    /**
     * FOR USER USE.
     * Fetches all booking for a specific user using their ID.
     * @param id 
     * @returns Booking[]
     */
    async fetchUserBookings(id: string): Promise<Booking[]> {
        try {
            if(!id) throw new Error('User ID missing');

            const bookingsRef = createBookingCollection(id);
            const snapshot = await getDocs(bookingsRef);

            if(snapshot.empty) return []

            console.log(`Fetched ${snapshot.docs.length} bookings for user ${id}`);
            return snapshot.docs.
                filter(docsnap => docsnap.id !== 'init').map(docsnap => docsnap.data());
        } catch (err) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    /**
     * FOR BUSINESS USE.
     * Fetches all bookings for a specific offer.
     * @param offerId 
     * @returns Booking[]
     */
    async fetchOfferBookings(offerId: string): Promise<Booking[]> {
        try {
            if(!offerId) throw new Error('Offer ID missing');
            const bookingsRef = collectionGroup(db, 'bookings').withConverter(bookingConverter);
            const snapshot = await getDocs(query(bookingsRef, where('offer.id', '==', offerId)));

            console.log(`Querying bookings for offer ID: ${offerId}`);
            if(snapshot.empty) return []
            console.log(`Fetched ${snapshot.docs.length} bookings for offer ${offerId}`);
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            console.log('Error fetching offer bookings: ', err);
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    /**
     * FOR SUPERADMIN USE.
     * Fetches all bookings across all users.
     * @returns 
     */
    async fetchAll(): Promise<Booking[]> {
        try {
            const bookingsRef = collectionGroup(db, 'bookings').withConverter(bookingConverter);
            const snapshot = await getDocs(bookingsRef);

            if(snapshot.empty) return []
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (error) {
            if(error instanceof Error) throw error
            throw new Error('An error occurred');   
        }
    }

    /**
     * FOR BUSINESS USE.
     * Fetches all bookings for a specific business using the business ID
     * @param businessId 
     * @returns 
     */
    async fetchAllBusinessBookings(businessId: string): Promise<Booking[]> {
        try {
            if(!businessId) throw new Error('Business ID missing');
            
            const bookingsRef = collectionGroup(db, 'bookings').withConverter(bookingConverter);
            const snapshot = await getDocs(query(bookingsRef, where('business.id', '==', businessId))); 
            
            if(snapshot.empty) return []
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (error) {
            if(error instanceof Error) throw error
            throw new Error('An error occurred');   
        }
    }

    /**
     * Fetches a booking using its ID. Uses collectionGroup to search 
     * across all users, proceed with caution when using to prevent unauthorized
     * view of user bookings.
     * @param bookingId 
     * @returns Booking | null
     */
    async fetchById(bookingId: string): Promise<Booking | null> {
        try {
            const docRef = collectionGroup(db, 'bookings').withConverter(bookingConverter);
            const snapshot = await getDocs(query(docRef, where('id', '==', bookingId)));    

            if(snapshot.empty) return null;

            return snapshot.docs[0].data();
        } catch (error) {
            if(error instanceof Error) throw error
            throw new Error('An error occurred');
        }
    }


    async cancelBooking(booking: Booking, businessId: string): Promise<void> {
        try {
            const approved = booking.status === 'paid'

            if(approved && !businessId) throw new Error('Only business owners can cancel approved or paid bookings'); 

            const bookingRef = doc(createBookingCollection(booking.user.id), booking.id);
            
            booking.cancelledBy = businessId;
            booking.status = 'refund';

            await setDoc(bookingRef, booking, {merge: true})
        } catch (err) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    async write(data: Booking): Promise<Booking> {
        try {
            let booking = data;

            const bookingRef = data.id 
                ? doc(createBookingCollection(data.user.id), data.id)
                : doc(createBookingCollection(data.user.id));

            if(!data.id){
                console.log('Creating new booking with ID: ', bookingRef.id);
                booking = new Booking({
                    ...data,
                    id: bookingRef.id,
                });
            }
            
            await setDoc(
                bookingRef, 
                booking, 
                {merge: true}
            );

            return booking;
        } catch (err) {
            console.log('Error writing booking: ', err);
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    async delete(id: string, ...args: any[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

}

export const BookingRepository = new BookingRepostoryImpl();