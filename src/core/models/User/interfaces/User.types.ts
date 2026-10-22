import { UserProfiles } from "@/src/recommendation/interfaces/Profile";
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

export type Preference = IPreference;

export type ITutorialProgress = Record<string, boolean>;

export interface IEmergencyContact {
    name: string;
    contactNumber: string;
    userId?: string;
    email?: string;
    phoneVerifiedAt?: Date | Timestamp | FieldValue | null;
    chatId?: string | null;
}

export interface IMedicalProfile {
    hasCondition: boolean;
    details: string[];
    clearanceUri?: string;
}

export interface NotificationToken<T> {
    token: string;
    platform: 'web' | 'ios' | 'android';
    lastUpdated: T;
}

export interface IUserBase<T> extends IUserSummary {
    address: string;
    birthday: T;
    createdAt: T;
    updatedAt: T;
    onBoardingComplete: boolean;
    onTutorialComplete: ITutorialProgress;
    phoneNumber: string;
    preferences: IPreference;
    medicalProfile: IMedicalProfile;
    role: Role;
    businessId?: string | null;
    fcmTokens: NotificationToken<T>[];
    emergencyContact: IEmergencyContact;
    profileImage: string;
    phoneVerifiedAt?: T | null;
    profile?: UserProfiles;
}

export type IUserDB = IUserBase<Timestamp | FieldValue>;
export type User<T = Date> = IUserBase<T>;
export type IUser = User;

export type LogIn = {
    email: string;
    password: string;
};

export type Role = 'superadmin' | 'admin' | 'user';
