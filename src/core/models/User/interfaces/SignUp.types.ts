import { FieldValue, Timestamp } from "firebase/firestore";
import { IUserSummary } from "./User.types";

export interface ISignUpBase<T> extends Omit<IUserSummary, 'id'> {
    phoneNumber: string;
    birthday: T;
    address: string;
    password: string;
    confirmPassword: string;
}

export type ISignUpDB = ISignUpBase<Timestamp | FieldValue>;
export type SignUp<T = Date> = ISignUpBase<T>;
export type ISignUp = SignUp;

export type UserCredential = {
    email: string;
    username: string;
};

export type CredentialResponse = {
    data: {
        emailAvailable: boolean;
        usernameAvailable: boolean;
    };
};