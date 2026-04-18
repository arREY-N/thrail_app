import { FieldValue, Timestamp } from "firebase/firestore";

export interface IUserSummary {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
}

export interface IPreference {
    experience: string;
    hike_length: string[];
    hiked: boolean;
    location: string[];
    province: string[];
}

export interface IEmergencyContact {
    name: string;
    contactNumber: string;
}

export interface IMedicalProfile {  // New
    hasCondition: boolean;
    details: string;
    clearanceUri?: string;
}

export interface NotificationToken<T> {
    token: string;
    platform: 'web' | 'ios' | 'android';
    lastUpdated: T;
}

export interface IUserBase<T> extends IUserSummary{
    address: string;
    birthday: T;
    createdAt: T;
    updatedAt: T;
    onBoardingComplete: boolean;
    phoneNumber: string;
    preferences: IPreference;
    medicalProfile: IMedicalProfile;  // New
    role: Role;
    fcmTokens: NotificationToken<T>[];
    emergencyContact: IEmergencyContact;
}

export interface IUserDB extends IUserBase<Timestamp | FieldValue> {}
export interface IUser extends IUserBase<Date> {}

export type LogIn = {
    email: string,
    password: string,
}

export type Role = 'superadmin' | 'admin' | 'user';