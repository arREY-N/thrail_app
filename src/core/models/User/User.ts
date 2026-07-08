import { ISignUp } from "@/src/core/models/User/SignUp.types";
import { IEmergencyContact, IMedicalProfile, IPreference, IUser, IUserDB, NotificationToken, Role } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
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
    medicalProfile: IMedicalProfile = {  // New
        hasCondition: false,
        details: '',
    };
    emergencyContact: IEmergencyContact = {
        name: '',
        contactNumber: '',
        email: '',
        userId: '',
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
            medicalProfile: this.medicalProfile, // New
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

export const editUser = ({user, updates}: {user: User, updates: Partial<User>}) => {
    console.log("Editing user with updates:", updates);
    return new User({...user, ...updates});
}

export const createInitialUser = (init?: Partial<User>): IUser => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: '',
        firstname: '',
        lastname: '',
        username: '',
        role: 'user',
        address: '',
        birthday: new Date(),
        onBoardingComplete: false,
        phoneNumber: '',
        fcmTokens: [],
        preferences: {
            experience: '',
            hike_length: [],
            hiked: false,
            location: [],
            province: [],
        },
        medicalProfile: {
            hasCondition: false,
            details: '',
        },
        emergencyContact: {
            name: '',
            contactNumber: '',
            email: '',
            userId: '',
        },
        ...init,   
    }
}

export const userFromDB = (id: string, data: DocumentData): IUser => {
    return {
        id,
        createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        username: data.username,
        role: data.role,
        address: data.address,
        birthday: data.birthday ? toDate(data.birthday) : new Date(),
        onBoardingComplete: data.onBoardingComplete,
        phoneNumber: data.phoneNumber,
        fcmTokens: (data.fcmTokens ?? []).map((token: any) => ({
            ...token,
            lastUpdated: token.lastUpdated ? toDate(token.lastUpdated) : new Date(),
        })),
        preferences: data.preferences,
        medicalProfile: data.medicalProfile,
        emergencyContact: data.emergencyContact,   
    }
}

export const userToDB = (user: IUser): IUserDB => {
    const isNew = user.id === '';

    return {
        id: user.id,
        fcmTokens: user.fcmTokens.map(token => ({
            ...token,
            lastUpdated: token.lastUpdated instanceof Date ? Timestamp.fromDate(token.lastUpdated) : token.lastUpdated,
        })),
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(user.createdAt),
        updatedAt: serverTimestamp(),
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        address: user.address,
        birthday: Timestamp.fromDate(user.birthday),
        onBoardingComplete: user.onBoardingComplete,
        phoneNumber: user.phoneNumber,
        preferences: user.preferences,
        medicalProfile: user.medicalProfile,
        role: user.role,
        emergencyContact: user.emergencyContact,
    }
}

export const userFromSignUp = (data: ISignUp): IUser => {
    if(data.confirmPassword !== data.password) {
        throw new Error('Password does not match');
    }

    const mapped: ISignUp = {
        ...data,
    }
    
    return createInitialUser(mapped);
}