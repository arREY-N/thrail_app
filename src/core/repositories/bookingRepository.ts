import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { BaseRepository } from '../interface/repositoryInterface';
import { Booking, bookingConverter } from '../models/Booking/Booking';

const createBookingCollection = (id: string) => {
    return collection(db, 'users', id, 'bookings').withConverter(bookingConverter);
}

export interface BookingRepositoryBase extends BaseRepository<Booking>{
    fetchUserBookings(id: string): Promise<Booking[]>;
    cancelBooking(booking: Booking, businessId: string): Promise<void>;
}

class BookingRepostoryImpl implements BookingRepositoryBase {
    async fetchUserBookings(id: string): Promise<Booking[]> {
        try {
            if(!id) throw new Error('User ID missing');

            const bookingsRef = createBookingCollection(id);
            const snapshot = await getDocs(bookingsRef);

            if(snapshot.empty) return []

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    async cancelBooking(booking: Booking, businessId: string): Promise<void> {
        try {
            const approved = booking.status === 'approved' || booking.status === 'paid'

            if(approved && !businessId) throw new Error('Only business owners can cancel approved or paid bookings'); 

            const bookingRef = doc(createBookingCollection(booking.user.id), booking.id);
            
            booking.cancelledBy = businessId;
            booking.status = 'cancelled';

            await setDoc(bookingRef, booking, {merge: true})
        } catch (err) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    async fetchAll(...args: any[]): Promise<Booking[]> {
        throw new Error('Method not implemented.');
    }

    async fetchById(id: string, ...args: any[]): Promise<Booking | null> {
        throw new Error('Method not implemented.');
    }

    async write(data: Booking, ...args: any[]): Promise<Booking> {
        try {
            const bookingRef = doc(createBookingCollection(data.user.id));
            
            data.id = bookingRef.id;

            await setDoc(
                bookingRef, 
                data, 
                {merge: true}
            );

            return data;
        } catch (err) {
            if(err instanceof Error) throw err
            throw new Error('An error occurred');
        }
    }

    async delete(id: string, ...args: any[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

}

export const BookingRepository = new BookingRepostoryImpl();