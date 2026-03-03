import { immerable } from "immer";
import { ISignUp } from "./SignUp.types";

export class SignUp implements ISignUp{
    [key: string]: any;
    [immerable] = true
    phoneNumber: string = '';
    birthday: Date = new Date;
    address: string = '';
    password: string = '';
    confirmPassword: string = '';
    username: string = '';
    firstname: string = '';
    lastname: string = '';
    email: string = '';

    constructor(init?: Partial<ISignUp>){
        Object.assign(this, init);
    }
    
}