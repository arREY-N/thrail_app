import { BOOKING_STATUS } from '@/src/constants/status';
import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

export async function fetchUserBookings(userId){
    try {
        if(!userId) throw new Error('User ID missing');

        const bookingsRef = collection(db, 'users', userId, 'bookings');
        const snapshot = await getDocs(bookingsRef);

        if(snapshot.empty){
            console.log('empty')
            return []
        };

        return snapshot.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            }
        });
    } catch (err) {
        console.log(err.message);
        throw new Error(err.message || 'Failed to fetch user bookings');
    }
}

export async function createBooking(bookingData){
    try {
        console.log(bookingData);
        const bookingRef = doc(collection(db, 'users', bookingData.userId, 'bookings'));
        await setDoc(bookingRef, {
            ...bookingData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, {merge: true});
        return bookingRef.id;
    } catch (err) {
        console.log(err.message);
        throw new Error(err.message || 'Failed creating booking');
    }
}

export async function cancelBooking({cancelledBy, bookingData}){
    try {
        console.log(bookingData);
        const { id, userId, } = bookingData;

        const bookingRef = doc(db, 'users', userId, 'bookings', id);
        await setDoc(bookingRef, {
            status: BOOKING_STATUS.CANCELLED,
            cancelledBy,
            updatedAt: serverTimestamp()
        }, {merge: true})
        
        return {
            ...bookingData,
            status: BOOKING_STATUS.CANCELLED,
            cancelledBy,
            updatedAt: new Date()
        }
    } catch (err) {
        console.log(err.message);
        throw new Error(err.message || 'Failed cancelling booking');
    }
}