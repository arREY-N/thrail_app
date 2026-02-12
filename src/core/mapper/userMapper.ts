import { UserDB, UserUI } from "@/src/types/entities/User";
import { serverTimestamp, Timestamp } from "firebase/firestore";

export const UserMapper = {
    toUI(data: UserDB): UserUI {
        console.log(data);
        const dateObject = data.birthday
            ? data.birthday.toDate().toISOString().split('T')[0]
            : '';

        return new UserUI({
            id: data.id || '',
            address: data.address,
            birthday: dateObject,
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            onBoardingComplete: data.onBoardingComplete,
            phoneNumber: data.phoneNumber,
            experience: data.preferences?.experience || '',
            hike_length: data.preferences?.hike_length || [],
            hiked: data.preferences?.hiked || false,
            location: data.preferences?.location || [],
            province: data.preferences?.province || [],
            role: data.role || 'user',
            username: data.username,
        })
    },
    toDB(data: UserUI): UserDB {
        return {
            id: data.id, 
            email: data.email,
            username: data.username,
            firstname: data.firstname,
            lastname: data.lastname,
            address: data.address,
            birthday: data.birthday ? Timestamp.fromDate(new Date(data.birthday)) : Timestamp.now(),
            createdAt: serverTimestamp(),
            onBoardingComplete: data.onBoardingComplete,
            phoneNumber: data.phoneNumber,
            preferences: {
                experience: data.experience,
                hike_length: data.hike_length,
                hiked: data.hiked,
                location: data.location,
                province: data.province,
            },
            role: data.role || 'user',
            updatedAt: serverTimestamp(),
        }
    }
}