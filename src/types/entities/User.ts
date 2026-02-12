import { FieldValue, Timestamp } from "firebase/firestore";

export interface UserDB{
    id?: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string; 
    address: string;
    birthday: Timestamp;
    createdAt: Timestamp | FieldValue;
    onBoardingComplete: boolean;
    phoneNumber: string;
    preferences?: {
        experience: string;
        hike_length: string[];
        hiked: boolean;
        location: string[];
        province: string[];
    };
    role: string; 
    updatedAt: Timestamp | FieldValue;
}

export interface UserUI{
    id?: string;
    address: string;
    birthday: string;
    email: string;
    firstname: string;
    lastname: string; 
    onBoardingComplete: boolean;
    phoneNumber: string;
    experience: string;
    hike_length: string[];
    hiked: boolean;
    location: string[];
    province: string[];
    role: string;
    username: string;
}

export interface SignUpUI{
    email: string;
    password: string;
    username: string;
    confirmPassword: string;
    phoneNumber: string;
    firstname: string;
    lastname: string; 
    birthday: string;
    address: string;
}

export class SignUpUI{
    email: string = '';
    password: string = '';
    username: string = '';
    confirmPassword: string = '';
    phoneNumber: string = '';
    firstname: string = '';
    lastname: string = ''; 
    birthday: string = '';
    address: string = '';

    constructor(init?: Partial<SignUpUI>){
        Object.assign(this, init);
    }
}

export class UserUI{
    address: string = '';
    birthday: string = '';
    email: string = '';
    firstname: string = '';
    lastname: string = '';  
    onBoardingComplete: boolean = false;
    phoneNumber: string = '';
    experience: string = '';
    hike_length: string[] = [];
    hiked: boolean = false;
    location: string[] = [];
    province: string[] = [];
    role: string = ''; 
    username: string = '';

    constructor(init?: Partial<UserUI>){
        Object.assign(this, init);
    }
}