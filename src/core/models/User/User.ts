import { ISignUp } from "@/src/core/models/User/SignUp.types";
import { IEmergencyContact, IPreference, IUser, IUserDB, NotificationToken, Role } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class User implements IUser{
    [key: string]: any;
    [immerable] = true
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    email: string = '';
    firstname: string = '';
    lastname: string = '';  
    username: string = '';
    role: Role = 'user'; 
    address: string = '';
    birthday: Date = new Date();
    onBoardingComplete: boolean = false;
    phoneNumber: string = '';
    fcmTokens: NotificationToken<Date>[] = [];
    preferences: IPreference = {
        experience: '',
        hike_length: [],
        hiked: false,
        location: [],
        province: [],
    };
    emergencyContact: IEmergencyContact = {
        name: '',
        contactNumber: '',
    }

    constructor(init?: Partial<User>){
        Object.assign(this, init);
    }

    static fromSignUp(data: ISignUp): User {
        if(data.confirmPassword !== data.password) {
            throw new Error('Password does not match');
        }

        const mapped: ISignUp = {
            ...data,
        }
        
        return new User(mapped);
    }

    static fromFirestore(id: string, data: IUserDB): User {
        const mapped: IUser = {
            ...data,
            id,
            fcmTokens: (data.fcmTokens ?? []).map(token => ({
                ...token,
                lastUpdated: toDate(token.lastUpdated),
            })),
            birthday: toDate(data.birthday),
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        };

        return new User(mapped);
    }

    toFirestore(): IUserDB {
        const isNew = this.id === '';

        const mapped: IUserDB = {
            id: this.id,
            fcmTokens: this.fcmTokens.map(token => ({
                ...token,
                lastUpdated: token.lastUpdated instanceof Date ? Timestamp.fromDate(token.lastUpdated) : token.lastUpdated,
            })),
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            username: this.username,
            firstname: this.firstname,
            lastname: this.lastname,
            email: this.email,
            address: this.address,
            birthday: Timestamp.fromDate(this.birthday),
            onBoardingComplete: this.onBoardingComplete,
            phoneNumber: this.phoneNumber,
            preferences: this.preferences,
            role: this.role,
            emergencyContact: this.emergencyContact,
        }

        return mapped;
    }
}

export const userConverter: FirestoreDataConverter<User> = {
    toFirestore: (user: User) => {
        return user.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): User => {
        const data = snapshot.data() as IUserDB;
        return User.fromFirestore(snapshot.id, data);
    }
}