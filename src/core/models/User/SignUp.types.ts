import { FieldValue, Timestamp } from "firebase/firestore";
import { IUserSummary } from "./User.types";

export interface ISignUpBase<T> extends Omit<IUserSummary, 'id'> {
    phoneNumber: string;
    birthday: T;
    address: string;
    
    password: string;
    confirmPassword: string;
}

export interface ISignUpDB extends ISignUpBase<Timestamp | FieldValue>{}
export interface ISignUp extends ISignUpBase<Date>{} 

export type UserCredential = {
    email: string,
    username: string,
}

export type CredentialResponse = {
    data: {
        emailAvailable: boolean,
        usernameAvailable: boolean,
    }
}